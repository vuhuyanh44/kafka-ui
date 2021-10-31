package com.provectus.kafka.ui.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.provectus.kafka.ui.util.JmxClusterUtil;
import lombok.Builder;
import lombok.Data;
import org.apache.kafka.clients.admin.ConfigEntry;
import org.apache.kafka.clients.admin.TopicDescription;
import org.apache.kafka.common.TopicPartition;

@Data
@Builder(toBuilder = true)
public class InternalTopic {

  // from TopicDescription
  private final String name;
  private final boolean internal;
  private final int replicas;
  private final int partitionCount;
  private final int inSyncReplicas;
  private final int replicationFactor;
  private final int underReplicatedPartitions;
  private final Map<Integer, InternalPartition> partitions;

  // topic configs
  private final List<InternalTopicConfig> topicConfigs;
  private final CleanupPolicy cleanUpPolicy;

  // rates from jmx
  private final BigDecimal bytesInPerSec;
  private final BigDecimal bytesOutPerSec;

  // from log dir data
  private final long segmentSize;
  private final long segmentCount;

  public static InternalTopic from(TopicDescription topicDescription,
                                   List<ConfigEntry> configs,
                                   InternalPartitionsOffsets partitionsOffsets,
                                   JmxClusterUtil.JmxMetrics jmxMetrics,
                                   InternalLogDirStats logDirInfo) {
    var topic = InternalTopic.builder();
    topic.internal(
        topicDescription.isInternal() || topicDescription.name().startsWith("_")
    );
    topic.name(topicDescription.name());

    List<InternalPartition> partitions = topicDescription.partitions().stream().map(
            partition -> {
              var partitionDto = InternalPartition.builder();
              partitionDto.leader(partition.leader().id());
              partitionDto.partition(partition.partition());
              partitionDto.inSyncReplicasCount(partition.isr().size());
              partitionDto.replicasCount(partition.replicas().size());
              List<InternalReplica> replicas = partition.replicas().stream().map(
                      r -> new InternalReplica(r.id(), partition.leader().id() != r.id(),
                          partition.isr().contains(r)))
                  .collect(Collectors.toList());
              partitionDto.replicas(replicas);

              partitionsOffsets.get(topicDescription.name(), partition.partition())
                  .ifPresent(offsets -> {
                    partitionDto.offsetMin(offsets.getEarliest());
                    partitionDto.offsetMax(offsets.getLatest());
                  });

              var segmentStats =
                  logDirInfo.getPartitionsStats().get(
                      new TopicPartition(topicDescription.name(), partition.partition()));
              if (segmentStats != null) {
                partitionDto.segmentCount(segmentStats.getSegmentsCount());
                partitionDto.segmentSize(segmentStats.getSegmentSize());
              }

              return partitionDto.build();
            })
        .collect(Collectors.toList());

    topic.partitions(partitions.stream().collect(
        Collectors.toMap(InternalPartition::getPartition, t -> t)));

    var partitionsStats = new PartitionsStats(topicDescription);
    topic.replicas(partitionsStats.getReplicasCount());
    topic.partitionCount(partitionsStats.getPartitionsCount());
    topic.inSyncReplicas(partitionsStats.getInSyncReplicasCount());
    topic.underReplicatedPartitions(partitionsStats.getUnderReplicatedPartitionCount());

    topic.replicationFactor(
        topicDescription.partitions().isEmpty()
            ? 0
            : topicDescription.partitions().get(0).replicas().size()
    );

    var segmentStats = logDirInfo.getTopicStats().get(topicDescription.name());
    if (segmentStats != null) {
      topic.segmentCount(segmentStats.getSegmentsCount());
      topic.segmentSize(segmentStats.getSegmentSize());
    }

    topic.bytesOutPerSec(jmxMetrics.getBytesOutPerSec().get(topicDescription.name()));
    topic.bytesOutPerSec(jmxMetrics.getBytesOutPerSec().get(topicDescription.name()));

    topic.topicConfigs(
        configs.stream().map(InternalTopicConfig::from).collect(Collectors.toList()));

    topic.cleanUpPolicy(
        configs.stream()
            .filter(config -> config.name().equals("cleanup.policy"))
            .findFirst()
            .map(ConfigEntry::value)
            .map(CleanupPolicy::fromString)
            .orElse(CleanupPolicy.UNKNOWN)
    );

    return topic.build();
  }

}
