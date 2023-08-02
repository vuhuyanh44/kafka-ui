package com.provectus.kafka.ui.emitter;

import com.provectus.kafka.ui.model.TopicMessageConsumingDTO;
import com.provectus.kafka.ui.model.TopicMessageEventDTO;
import com.provectus.kafka.ui.model.TopicMessageNextPageCursorDTO;
import javax.annotation.Nullable;
import reactor.core.publisher.FluxSink;

class ConsumingStats {

  private long bytes = 0;
  private int records = 0;
  private long elapsed = 0;

  void sendConsumingEvt(FluxSink<TopicMessageEventDTO> sink,
                        PolledRecords polledRecords,
                        int filterApplyErrors) {
    bytes += polledRecords.bytes();
    this.records += polledRecords.count();
    this.elapsed += polledRecords.elapsed().toMillis();
    sink.next(
        new TopicMessageEventDTO()
            .type(TopicMessageEventDTO.TypeEnum.CONSUMING)
            .consuming(createConsumingStats(sink, filterApplyErrors))
    );
  }

  void sendFinishEvent(FluxSink<TopicMessageEventDTO> sink, int filterApplyErrors, @Nullable Cursor.Tracking cursor) {
    sink.next(
        new TopicMessageEventDTO()
            .type(TopicMessageEventDTO.TypeEnum.DONE)
            .cursor(
                cursor != null
                    ? new TopicMessageNextPageCursorDTO().id(cursor.registerCursor())
                    : null
            )
            .consuming(createConsumingStats(sink, filterApplyErrors))
    );
  }

  private TopicMessageConsumingDTO createConsumingStats(FluxSink<TopicMessageEventDTO> sink,
                                                        int filterApplyErrors) {
    return new TopicMessageConsumingDTO()
        .bytesConsumed(this.bytes)
        .elapsedMs(this.elapsed)
        .isCancelled(sink.isCancelled())
        .filterApplyErrors(filterApplyErrors)
        .messagesConsumed(this.records);
  }
}
