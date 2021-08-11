import { Configuration, KsqlApi, Table as KsqlTable } from 'generated-sources';
import { PromiseThunkResult, ClusterName } from 'redux/interfaces';
import { BASE_PARAMS } from 'lib/constants';
import * as actions from 'redux/actions/actions';

const apiClientConf = new Configuration(BASE_PARAMS);
export const brokersApiClient = new KsqlApi(apiClientConf);

const transformKsqlResponse = (
  rawTable: Required<KsqlTable>
): Dictionary<string>[] => {
  const { headers, rows } = rawTable;

  const transformedRows = rows.map((row) => {
    const objectRow: Dictionary<string> = {};
    row.forEach((_, index) => {
      objectRow[headers[index]] = row[index];
    });
    return objectRow;
  });

  return transformedRows;
};

const getTables = (clusterName: ClusterName) =>
  brokersApiClient.executeKsqlCommand({
    clusterName,
    ksqlCommand: { ksql: 'SHOW TABLES;' },
  });

const getStreams = (clusterName: ClusterName) =>
  brokersApiClient.executeKsqlCommand({
    clusterName,
    ksqlCommand: { ksql: 'SHOW STREAMS;' },
  });

export const fetchKsqlDbTables =
  (clusterName: ClusterName): PromiseThunkResult =>
  async (dispatch) => {
    dispatch(actions.fetchKsqlDbTablesAction.request());
    try {
      const tables = await getTables(clusterName);
      const streams = await getStreams(clusterName);

      dispatch(
        actions.fetchKsqlDbTablesAction.success({
          tables: tables.data ? transformKsqlResponse(tables.data) : [],
          streams: streams.data ? transformKsqlResponse(streams.data) : [],
        })
      );
    } catch (e) {
      dispatch(actions.fetchKsqlDbTablesAction.failure({}));
    }
  };
