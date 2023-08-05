package com.provectus.kafka.ui.emitter;

import com.provectus.kafka.ui.model.ConsumerPosition;
import com.provectus.kafka.ui.model.TopicMessageEventDTO;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.TreeMap;
import java.util.function.Supplier;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.errors.InterruptException;
import org.apache.kafka.common.utils.Bytes;
import reactor.core.publisher.FluxSink;

@Slf4j
public class BackwardRecordEmitter extends AbstractEmitter {

  private final Supplier<EnhancedConsumer> consumerSupplier;
  private final ConsumerPosition consumerPosition;
  private final int messagesPerPage;

  private final TimestampsSortedMessageProcessing messagesProcessing;

  public BackwardRecordEmitter(
      Supplier<EnhancedConsumer> consumerSupplier,
      ConsumerPosition consumerPosition,
      int messagesPerPage,
      TimestampsSortedMessageProcessing messagesProcessing,
      PollingSettings pollingSettings) {
    super(messagesProcessing, pollingSettings);
    this.messagesProcessing = messagesProcessing;
    this.consumerPosition = consumerPosition;
    this.messagesPerPage = messagesPerPage;
    this.consumerSupplier = consumerSupplier;
  }

  @Override
  public void accept(FluxSink<TopicMessageEventDTO> sink) {
    log.debug("Starting backward polling for {}", consumerPosition);
    try (EnhancedConsumer consumer = consumerSupplier.get()) {
      sendPhase(sink, "Created consumer");

      var seekOperations = SeekOperations.create(consumer, consumerPosition);
      var readUntilOffsets = new TreeMap<TopicPartition, Long>(Comparator.comparingInt(TopicPartition::partition));
      readUntilOffsets.putAll(seekOperations.getOffsetsForSeek());

      int msgsToPollPerPartition = (int) Math.ceil((double) messagesPerPage / readUntilOffsets.size());
      log.debug("'Until' offsets for polling: {}", readUntilOffsets);

      while (!sink.isCancelled() && !readUntilOffsets.isEmpty() && !sendLimitReached()) {
        new TreeMap<>(readUntilOffsets).forEach((tp, readToOffset) -> {
          if (sink.isCancelled()) {
            return; //fast return in case of sink cancellation
          }
          long beginOffset = seekOperations.getBeginOffsets().get(tp);
          long readFromOffset = Math.max(beginOffset, readToOffset - msgsToPollPerPartition);

          partitionPollIteration(tp, readFromOffset, readToOffset, consumer, sink)
              .forEach(r -> sendMessage(sink, r));

          if (beginOffset == readFromOffset) {
            // we fully read this partition -> removing it from polling iterations
            readUntilOffsets.remove(tp);
          } else {
            // updating 'to' offset for next polling iteration
            readUntilOffsets.put(tp, readFromOffset);
          }
        });
        if (readUntilOffsets.isEmpty()) {
          log.debug("begin reached after partitions poll iteration");
        } else if (sink.isCancelled()) {
          log.debug("sink is cancelled after partitions poll iteration");
        }
        messagesProcessing.flush(sink);
      }
      sendFinishStatsAndCompleteSink(sink);
      log.debug("Polling finished");
    } catch (InterruptException kafkaInterruptException) {
      log.debug("Polling finished due to thread interruption");
      sink.complete();
    } catch (Exception e) {
      log.error("Error occurred while consuming records", e);
      sink.error(e);
    }
  }

  private List<ConsumerRecord<Bytes, Bytes>> partitionPollIteration(
      TopicPartition tp,
      long fromOffset, //inclusive
      long toOffset, //exclusive
      EnhancedConsumer consumer,
      FluxSink<TopicMessageEventDTO> sink
  ) {
    consumer.assign(Collections.singleton(tp));
    consumer.seek(tp, fromOffset);
    sendPhase(sink, String.format("Polling partition: %s from offset %s", tp, fromOffset));

    var recordsToSend = new ArrayList<ConsumerRecord<Bytes, Bytes>>();
    while (!sink.isCancelled()
        && !sendLimitReached()
        && consumer.position(tp) < toOffset) {

      var polledRecords = poll(sink, consumer, pollingSettings.getPartitionPollTimeout());
      log.debug("{} records polled from {}", polledRecords.count(), tp);

      var filteredRecords = polledRecords.records(tp).stream()
          .filter(r -> r.offset() < toOffset)
          .toList();

      recordsToSend.addAll(filteredRecords);
    }
    log.debug("{} records to send", recordsToSend.size());
    return recordsToSend;
  }
}
