import React from 'react';
import { create } from 'react-test-renderer';
import { TestRouterWrapper } from 'lib/testHelpers';
import { clusterConnectConnectorTasksPath } from 'lib/paths';
import TasksContainer from 'components/Connect/Details/Tasks/TasksContainer';
import Tasks, { TasksProps } from 'components/Connect/Details/Tasks/Tasks';
import { tasks } from 'redux/reducers/connect/__test__/fixtures';
import { ThemeProvider } from 'styled-components';
import theme from 'theme/theme';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from 'redux/store';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';

jest.mock('components/common/PageLoader/PageLoader', () => 'mock-PageLoader');

jest.mock(
  'components/Connect/Details/Tasks/ListItem/ListItemContainer',
  () => 'tr' // need to mock as `tr` to let dom validtion pass
);

const history = createMemoryHistory();

describe('Tasks', () => {
  const tasksContainer = (props: Partial<TasksProps> = {}) => (
    <ThemeProvider theme={theme}>
      <Provider store={store}>
        <Router history={history}>
          <TasksContainer>
            <Tasks
              data-testId="tasks_view"
              fetchTasks={jest.fn()}
              areTasksFetching={false}
              tasks={tasks}
              {...props}
            />
          </TasksContainer>
        </Router>
      </Provider>
    </ThemeProvider>
  );

  it('container renders view', () => {
    render(tasksContainer());
    expect(screen.getByTestId('tasks_view')).toBeInTheDocument();
  });

  describe('view', () => {
    const pathname = clusterConnectConnectorTasksPath(
      ':clusterName',
      ':connectName',
      ':connectorName'
    );
    const clusterName = 'my-cluster';
    const connectName = 'my-connect';
    const connectorName = 'my-connector';

    const setupWrapper = (props: Partial<TasksProps> = {}) => (
      <ThemeProvider theme={theme}>
        <TestRouterWrapper
          pathname={pathname}
          urlParams={{ clusterName, connectName, connectorName }}
        >
          <Tasks
            fetchTasks={jest.fn()}
            areTasksFetching={false}
            tasks={tasks}
            {...props}
          />
        </TestRouterWrapper>
      </ThemeProvider>
    );

    it('matches snapshot', () => {
      const wrapper = create(setupWrapper());
      expect(wrapper.toJSON()).toMatchSnapshot();
    });

    it('matches snapshot when fetching tasks', () => {
      const wrapper = create(setupWrapper({ areTasksFetching: true }));
      expect(wrapper.toJSON()).toMatchSnapshot();
    });

    it('matches snapshot when no tasks', () => {
      const wrapper = create(setupWrapper({ tasks: [] }));
      expect(wrapper.toJSON()).toMatchSnapshot();
    });

    it('fetches tasks on mount', () => {
      const fetchTasks = jest.fn();
      render(setupWrapper({ fetchTasks }));
      expect(fetchTasks).toHaveBeenCalledTimes(1);
      expect(fetchTasks).toHaveBeenCalledWith(
        clusterName,
        connectName,
        connectorName,
        true
      );
    });
  });
});
