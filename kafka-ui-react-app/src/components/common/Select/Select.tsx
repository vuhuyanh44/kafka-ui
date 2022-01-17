import React, { useState, useRef } from 'react';
import useClickOutside from 'lib/hooks/useClickOutside';

import * as S from './Select.styled';
import LiveIcon from './LiveIcon.styled';

export interface SelectProps {
  options?: Array<SelectOption>;
  id?: string;
  name?: string;
  selectSize?: 'M' | 'L';
  isLive?: boolean;
  minWidth?: string;
  defaultValue?: string | number;
  value?: string | number;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (option: SelectOption) => void;
}

export interface SelectOption {
  label: string | number;
  value: string | number;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  id,
  options = [],
  defaultValue,
  value,
  selectSize = 'L',
  placeholder = '',
  isLive,
  name,
  disabled = false,
  onChange,
  ...props
}) => {
  const [selectedOption, setSelectedOption] = useState(defaultValue);
  const [showOptions, setShowOptions] = useState(false);

  const showOptionsHandler = () => {
    if (!disabled) setShowOptions(!showOptions);
  };

  const selectContainerRef = useRef(null);
  const clickOutsideHandler = () => setShowOptions(false);
  useClickOutside(selectContainerRef, clickOutsideHandler);

  const updateSelectedOption = (option: SelectOption) => {
    if (disabled) return;

    setSelectedOption(option.value);
    if (onChange) onChange(option);
    setShowOptions(false);
  };

  return (
    <div ref={selectContainerRef}>
      {isLive && <LiveIcon />}
      {name ? (
        <S.Select
          role="listbox"
          selectSize={selectSize}
          isLive={isLive}
          disabled={disabled}
          onClick={showOptionsHandler}
          onKeyDown={showOptionsHandler}
          {...props}
        >
          <S.SelectedOption role="option" tabIndex={0}>
            {options.find((option) => option.value === selectedOption)?.label ||
              placeholder}
          </S.SelectedOption>
          {showOptions && (
            <S.OptionList>
              {options?.map((option) => (
                <S.Option
                  value={option.value}
                  key={option.value}
                  disabled={option.disabled}
                  onClick={() => updateSelectedOption(option)}
                  tabIndex={0}
                >
                  {option.label}
                </S.Option>
              ))}
            </S.OptionList>
          )}
        </S.Select>
      ) : (
        <S.Select
          role="listbox"
          selectSize={selectSize}
          isLive={isLive}
          disabled={disabled}
          onClick={showOptionsHandler}
          onKeyDown={showOptionsHandler}
          {...props}
        >
          <S.SelectedOption role="option" tabIndex={0}>
            {options.find((option) => option.value === selectedOption)?.label ||
              placeholder}
          </S.SelectedOption>
          {showOptions && (
            <S.OptionList>
              {options?.map((option) => (
                <S.Option
                  value={option.value}
                  key={option.value}
                  disabled={option.disabled}
                  onClick={() => updateSelectedOption(option)}
                  tabIndex={0}
                >
                  {option.label}
                </S.Option>
              ))}
            </S.OptionList>
          )}
        </S.Select>
      )}
    </div>
  );
};

export default Select;
