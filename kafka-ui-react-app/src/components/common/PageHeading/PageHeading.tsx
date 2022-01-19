import styled from 'styled-components';
import React from 'react';
import { Colors } from 'theme/theme';

interface Props {
  text: string;
  className?: string;
}

const PageHeading: React.FC<Props> = ({ text, className, children }) => {
  return (
    <div className={className}>
      <h1>{text}</h1>
      <div>{children}</div>
    </div>
  );
};

export default styled(PageHeading)`
  height: 56px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 16px;
  & h1 {
    font-size: 24px;
    font-weight: 500;
    line-height: 32px;
    color: ${Colors.neutral[100]};
  }
  & > div {
    display: flex;
    gap: 16px;
  }
`;
