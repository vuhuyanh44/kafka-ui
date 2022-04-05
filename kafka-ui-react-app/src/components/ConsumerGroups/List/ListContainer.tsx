import { connect } from 'react-redux';
import { RootState } from 'redux/interfaces';
import {
  getConsumerGroupsOrderBy,
  getConsumerGroupsSortOrder,
  getConsumerGroupsTotalPages,
  sortBy,
  search,
  selectAll,
  getConsumerGroupsSearch,
} from 'redux/reducers/consumerGroups/consumerGroupsSlice';
import List from 'components/ConsumerGroups/List/List';

const mapStateToProps = (state: RootState) => ({
  consumerGroups: selectAll(state),
  orderBy: getConsumerGroupsOrderBy(state),
  sortOrder: getConsumerGroupsSortOrder(state),
  totalPages: getConsumerGroupsTotalPages(state),
  search: getConsumerGroupsSearch(state),
});

const mapDispatchToProps = {
  setConsumerGroupsSortOrderBy: sortBy,
  setConsumerGroupsSearch: search,
};

export default connect(mapStateToProps, mapDispatchToProps)(List);
