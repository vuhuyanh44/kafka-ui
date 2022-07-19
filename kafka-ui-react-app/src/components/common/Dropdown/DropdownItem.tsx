import React, { PropsWithChildren } from 'react';

import * as S from './Dropdown.styled';

interface DropdownItemProps {
  onClick(): void;
  danger?: boolean;
}

const DropdownItem: React.FC<PropsWithChildren<DropdownItemProps>> = ({
  onClick,
  danger,
  children,
}) => {
  const onClickHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <S.Item
      $isDanger={!!danger}
      onClick={onClickHandler}
      className="dropdown-item is-link"
    >
      {children}
    </S.Item>
  );
};

export default DropdownItem;
