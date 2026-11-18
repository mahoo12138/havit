import { useTranslation } from 'react-i18next';

import { NumberInput } from './number-field';
import { Field, FieldError, FieldLabel } from './field';

type NumberFieldFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  error?: string | null;
  autoFocus?: boolean;
};

// Forms keep numbers as strings; base-ui NumberField works on `number | null`.
function parseNumberValue(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumberValue(value: number | null): string {
  return value === null ? '' : String(value);
}

function NumberFieldField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  required,
  disabled,
  id,
  error,
  autoFocus,
}: NumberFieldFieldProps) {
  const inputId = id ?? label;
  const { i18n } = useTranslation();

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <NumberInput
        id={inputId}
        invalid={!!error}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        locale={i18n.language}
        value={parseNumberValue(value)}
        onValueChange={(next) => onChange(formatNumberValue(next))}
      />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

export { NumberFieldField };
export type { NumberFieldFieldProps };
