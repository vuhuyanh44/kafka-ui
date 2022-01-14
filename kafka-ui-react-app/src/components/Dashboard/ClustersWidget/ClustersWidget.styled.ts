import styled from 'styled-components';

interface TableCellProps {
  maxWidth?: string;
}

export const SwitchWrapper = styled.div`
  padding: 16px;
`;

export const TableCell = styled.td<TableCellProps>`
  padding: 16px;
  word-break: break-word;
  max-width: ${(props) => (props.maxWidth ? props.maxWidth : 'auto')};
`;
