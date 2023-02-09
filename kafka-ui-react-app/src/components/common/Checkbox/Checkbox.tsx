import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { InputLabel } from 'components/common/Input/InputLabel.styled';
import { FormError, InputHint } from 'components/common/Input/Input.styled';
import { ErrorMessage } from '@hookform/error-message';

interface CheckboxProps {
  name: string;
  label: React.ReactNode;
  hint?: string;
  cursor?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ name, label, hint, cursor }) => {
  const { register } = useFormContext();

  return (
    <div>
      <InputLabel cursor={cursor}>
        <input {...register(name)} type="checkbox" />
        {label}
      </InputLabel>
      <InputHint>{hint}</InputHint>
      <FormError>
        <ErrorMessage name={name} />
      </FormError>
    </div>
  );
};

export default Checkbox;
