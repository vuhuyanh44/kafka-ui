package com.provectus.kafka.ui.service;

import com.google.common.collect.ImmutableMap;
import com.provectus.kafka.ui.config.ClustersProperties;
import com.provectus.kafka.ui.mapper.ClusterMapper;
import com.provectus.kafka.ui.model.KafkaCluster;
import java.util.Collection;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class ClustersStorage {

  private final ImmutableMap<String, KafkaCluster> kafkaClusters;

  public ClustersStorage(ClustersProperties properties,
                         KafkaClusterInitializer initializer) {
    var builder = ImmutableMap.<String, KafkaCluster>builder();
    properties.getClusters().forEach(c -> builder.put(c.getName(), initializer.init(c)));
    this.kafkaClusters = builder.build();
  }

  public Collection<KafkaCluster> getKafkaClusters() {
    return kafkaClusters.values();
  }

  public Optional<KafkaCluster> getClusterByName(String clusterName) {
    return Optional.ofNullable(kafkaClusters.get(clusterName));
  }
}
