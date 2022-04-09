import React from 'react';
import SavedFilters, {
  Props,
} from 'components/Topics/Topic/Details/Messages/Filters/SavedFilters';
import { MessageFilters } from 'components/Topics/Topic/Details/Messages/Filters/Filters';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib/testHelpers';

describe('SavedFilter Component', () => {
  const mockFilters: MessageFilters[] = [
    { name: 'name', code: 'code' },
    { name: 'name1', code: 'code1' },
  ];

  const setUpComponent = (props: Partial<Props> = {}) => {
    return render(
      <SavedFilters
        filters={props.filters || mockFilters}
        onEdit={props.onEdit || jest.fn()}
        onCancelBtn={props.onCancelBtn || jest.fn()}
        onGoBack={props.onGoBack || jest.fn()}
        activeFilterHandler={props.activeFilterHandler || jest.fn()}
        deleteFilter={props.deleteFilter || jest.fn()}
      />
    );
  };

  it('should check the Cancel button click', () => {
    const cancelMock = jest.fn();
    setUpComponent({ onCancelBtn: cancelMock });
    userEvent.click(screen.getByText(/cancel/i));
    expect(cancelMock).toHaveBeenCalled();
  });

  it('should check on go back button click', () => {
    const onGoBackMock = jest.fn();
    setUpComponent({ onGoBack: onGoBackMock });
    userEvent.click(screen.getByText(/back to custom filter/i));
    expect(onGoBackMock).toHaveBeenCalled();
  });

  describe('Empty Filters Rendering', () => {
    beforeEach(() => {
      setUpComponent({ filters: [] });
    });
    it('should check the rendering of the empty filter', () => {
      expect(screen.getByText(/no saved filter/i)).toBeInTheDocument();
      expect(screen.queryByRole('savedFilter')).not.toBeInTheDocument();
    });
  });

  describe('Saved Filters Deleting Editing', () => {
    const onEditMock = jest.fn();
    const activeFilterMock = jest.fn();

    beforeEach(() => {
      setUpComponent({
        onEdit: onEditMock,
        activeFilterHandler: activeFilterMock,
      });
    });

    afterEach(() => {
      onEditMock.mockClear();
      activeFilterMock.mockClear();
    });

    it('should check the normal data rendering', () => {
      expect(screen.getAllByRole('savedFilter')).toHaveLength(
        mockFilters.length
      );
      expect(screen.getByText(mockFilters[0].name)).toBeInTheDocument();
      expect(screen.getByText(mockFilters[1].name)).toBeInTheDocument();
    });

    it('should check the Filter edit Button works', () => {
      const savedFilters = screen.getAllByRole('savedFilter');
      userEvent.hover(savedFilters[0]);
      userEvent.click(within(savedFilters[0]).getByText(/edit/i));
      expect(onEditMock).toHaveBeenCalled();

      userEvent.hover(savedFilters[1]);
      userEvent.click(within(savedFilters[1]).getByText(/edit/i));
      expect(onEditMock).toHaveBeenCalledTimes(2);
    });

    it('should check the select filter', () => {
      const selectFilterButton = screen.getByText(/Select filter/i);

      userEvent.click(selectFilterButton);
      expect(activeFilterMock).not.toHaveBeenCalled();

      const savedFilterElement = screen.getAllByRole('savedFilter');
      userEvent.click(savedFilterElement[0]);
      userEvent.click(selectFilterButton);

      expect(activeFilterMock).toHaveBeenCalled();
    });
  });

  describe('Saved Filters Deletion', () => {
    const deleteMock = jest.fn();

    beforeEach(() => {
      setUpComponent({ deleteFilter: deleteMock });
    });

    afterEach(() => {
      deleteMock.mockClear();
    });

    it('Open Confirmation for the deletion modal', () => {
      const savedFilters = screen.getAllByRole('savedFilter');
      const deleteIcons = screen.getAllByTestId('deleteIcon');
      userEvent.hover(savedFilters[0]);
      userEvent.click(deleteIcons[0]);
      const modelDialog = screen.getByRole('dialog');
      expect(modelDialog).toBeInTheDocument();
      expect(
        within(modelDialog).getByText(/Confirm deletion/i)
      ).toBeInTheDocument();
    });

    it('Close Confirmations deletion modal with button', () => {
      const savedFilters = screen.getAllByRole('savedFilter');
      const deleteIcons = screen.getAllByTestId('deleteIcon');

      userEvent.hover(savedFilters[0]);
      userEvent.click(deleteIcons[0]);

      const modelDialog = screen.getByRole('dialog');
      expect(modelDialog).toBeInTheDocument();
      const cancelButton = within(modelDialog).getByRole('button', {
        name: /Cancel/i,
      });
      userEvent.click(cancelButton);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Delete the saved filter', () => {
      const savedFilters = screen.getAllByRole('savedFilter');
      const deleteIcons = screen.getAllByTestId('deleteIcon');

      userEvent.hover(savedFilters[0]);
      userEvent.click(deleteIcons[0]);

      userEvent.click(screen.getByRole('button', { name: /Delete/i }));
      expect(deleteMock).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
