package com.provectus.kafka.ui.service;

import com.provectus.kafka.ui.mapper.ClusterMapper;
import com.provectus.kafka.ui.model.InternalTopic;
import com.provectus.kafka.ui.model.KafkaCluster;
import com.provectus.kafka.ui.model.Topic;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClusterServiceTest {
    @InjectMocks
    private ClusterService clusterService;

    @Mock
    private ClustersStorage clustersStorage;
    @Spy
    private final ClusterMapper clusterMapper = Mappers.getMapper(ClusterMapper.class);

    @Test
    public void shouldListFirst20Topics() {
        var topicName = UUID.randomUUID().toString();

        when(clustersStorage.getClusterByName(topicName))
                .thenReturn(Optional.of(KafkaCluster.builder()
                        .topics(
                                IntStream.rangeClosed(1, 100).boxed()
                                        .map(Objects::toString)
                                        .collect(Collectors.toMap(Function.identity(), e -> InternalTopic.builder()
                                                .partitions(Map.of())
                                                .name(e)
                                                .build()))
                        )
                        .build()));

        var topics = clusterService.getTopics(topicName, Optional.empty(), Optional.empty());
        assertThat(topics.getPageCount()).isEqualTo(5);
        assertThat(topics.getTopics()).hasSize(20);
        assertThat(topics.getTopics()).map(Topic::getName).isSorted();
    }

    @Test
    public void shouldCalculateCorrectPageCountForNonDivisiblePageSize() {
        var topicName = UUID.randomUUID().toString();

        when(clustersStorage.getClusterByName(topicName))
                .thenReturn(Optional.of(KafkaCluster.builder()
                        .topics(
                                IntStream.rangeClosed(1, 100).boxed()
                                        .map(Objects::toString)
                                        .collect(Collectors.toMap(Function.identity(), e -> InternalTopic.builder()
                                                .partitions(Map.of())
                                                .name(e)
                                                .build()))
                        )
                        .build()));

        var topics = clusterService.getTopics(topicName, Optional.of(4), Optional.of(33));
        assertThat(topics.getPageCount()).isEqualTo(4);
        assertThat(topics.getTopics()).hasSize(1)
                .first().extracting(Topic::getName).isEqualTo("99");
    }

    @Test
    public void shouldCorrectlyHandleNonPositivePageNumberAndPageSize() {
        var topicName = UUID.randomUUID().toString();

        when(clustersStorage.getClusterByName(topicName))
                .thenReturn(Optional.of(KafkaCluster.builder()
                        .topics(
                                IntStream.rangeClosed(1, 100).boxed()
                                        .map(Objects::toString)
                                        .collect(Collectors.toMap(Function.identity(), e -> InternalTopic.builder()
                                                .partitions(Map.of())
                                                .name(e)
                                                .build()))
                        )
                        .build()));

        var topics = clusterService.getTopics(topicName, Optional.of(0), Optional.of(-1));
        assertThat(topics.getPageCount()).isEqualTo(5);
        assertThat(topics.getTopics()).hasSize(20);
        assertThat(topics.getTopics()).map(Topic::getName).isSorted();
    }
}
