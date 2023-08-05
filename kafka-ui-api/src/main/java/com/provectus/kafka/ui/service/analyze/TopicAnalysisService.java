package com.provectus.kafka.ui.service.analyze;

import com.provectus.kafka.ui.emitter.EmptyPollsCounter;
import com.provectus.kafka.ui.emitter.EnhancedConsumer;
import com.provectus.kafka.ui.emitter.OffsetsInfo;
import com.provectus.kafka.ui.emitter.PollingSettings;
import com.provectus.kafka.ui.emitter.SeekOperations;
import com.provectus.kafka.ui.exception.TopicAnalysisException;
import com.provectus.kafka.ui.model.ConsumerPosition;
import com.provectus.kafka.ui.model.KafkaCluster;
import com.provectus.kafka.ui.model.SeekTypeDTO;
import com.provectus.kafka.ui.model.TopicAnalysisDTO;
import com.provectus.kafka.ui.service.ConsumerGroupService;
import com.provectus.kafka.ui.service.TopicsService;
import java.io.Closeable;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.errors.InterruptException;
import org.apache.kafka.common.errors.WakeupException;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;


@Slf4j
@Component
@RequiredArgsConstructor
public class TopicAnalysisService {

  private final AnalysisTasksStore analysisTasksStore = new AnalysisTasksStore();

  private final TopicsService topicsService;
  private final ConsumerGroupService consumerGroupService;

  public Mono<Void> analyze(KafkaCluster cluster, String topicName) {
    return topicsService.getTopicDetails(cluster, topicName)
        .doOnNext(topic ->
            startAnalysis(
                cluster,
                topicName,
                topic.getPartitions().values()
                    .stream()
                    .mapToLong(p -> p.getOffsetMax() - p.getOffsetMin())
                    .sum()
            )
        ).then();
  }

  private synchronized void startAnalysis(KafkaCluster cluster,
                                          String topic,
                                          long approxNumberOfMsgs) {
    var topicId = new TopicIdentity(cluster, topic);
    if (analysisTasksStore.isAnalysisInProgress(topicId)) {
      throw new TopicAnalysisException("Topic is already analyzing");
    }
    var task = new AnalysisTask(cluster, topicId, approxNumberOfMsgs);
    analysisTasksStore.registerNewTask(topicId, task);
    Schedulers.boundedElastic().schedule(task);
  }

  public void cancelAnalysis(KafkaCluster cluster, String topicName) {
    analysisTasksStore.cancelAnalysis(new TopicIdentity(cluster, topicName));
  }

  public Optional<TopicAnalysisDTO> getTopicAnalysis(KafkaCluster cluster, String topicName) {
    return analysisTasksStore.getTopicAnalysis(new TopicIdentity(cluster, topicName));
  }

  class AnalysisTask implements Runnable, Closeable {

    private final Instant startedAt = Instant.now();

    private final TopicIdentity topicId;
    private final long approxNumberOfMsgs;

    private final TopicAnalysisStats totalStats = new TopicAnalysisStats();
    private final Map<Integer, TopicAnalysisStats> partitionStats = new HashMap<>();

    private final EnhancedConsumer consumer;

    AnalysisTask(KafkaCluster cluster, TopicIdentity topicId, long approxNumberOfMsgs) {
      this.topicId = topicId;
      this.approxNumberOfMsgs = approxNumberOfMsgs;
      this.consumer = consumerGroupService.createConsumer(
          cluster,
          // to improve polling throughput
          Map.of(
              ConsumerConfig.RECEIVE_BUFFER_CONFIG, "-1", //let OS tune buffer size
              ConsumerConfig.MAX_POLL_RECORDS_CONFIG, "100000"
          )
      );
    }

    @Override
    public void close() {
      consumer.wakeup();
    }

    @Override
    public void run() {
      try {
        log.info("Starting {} topic analysis", topicId);
        var seekOperations = SeekOperations.create(
            consumer,
            new ConsumerPosition(SeekTypeDTO.BEGINNING, topicId.topicName, null)
        );
        seekOperations.assignAndSeekNonEmptyPartitions();

        while (!seekOperations.assignedPartitionsFullyPolled()) {
          var polled = consumer.pollEnhanced(Duration.ofSeconds(3));
          polled.forEach(r -> {
            totalStats.apply(r);
            partitionStats.get(r.partition()).apply(r);
          });
          updateProgress();
        }
        analysisTasksStore.setAnalysisResult(topicId, startedAt, totalStats, partitionStats);
        log.info("{} topic analysis finished", topicId);
      } catch (WakeupException | InterruptException cancelException) {
        log.info("{} topic analysis stopped", topicId);
        // calling cancel for cases when our thread was interrupted by some non-user cancellation reason
        analysisTasksStore.cancelAnalysis(topicId);
      } catch (Throwable th) {
        log.error("Error analyzing topic {}", topicId, th);
        analysisTasksStore.setAnalysisError(topicId, startedAt, th);
      } finally {
        consumer.close();
      }
    }

    private void updateProgress() {
      if (totalStats.totalMsgs > 0 && approxNumberOfMsgs != 0) {
        analysisTasksStore.updateProgress(
            topicId,
            totalStats.totalMsgs,
            totalStats.keysSize.sum + totalStats.valuesSize.sum,
            Math.min(100.0, (((double) totalStats.totalMsgs) / approxNumberOfMsgs) * 100)
        );
      }
    }
  }
}
