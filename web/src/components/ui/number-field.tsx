import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field';
import { MinusIcon, PlusIcon } from 'lucide-react';

import * as s from './number-field.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

const STEPPER_LABELS: Record<'en' | 'zh', { decrease: string; increase: string }> = {
  en: { decrease: 'Decrease', increase: 'Increase' },
  zh: { decrease: '减少', increase: '增加' },
};

function getStepperLabels(locale?: Intl.LocalesArgument) {
  const code = typeof locale === 'string' ? locale : undefined;
  return code?.toLowerCase().startsWith('zh') ? STEPPER_LABELS.zh : STEPPER_LABELS.en;
}

export type NumberInputProps = {
  value: number | null;
  onValueChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  locale?: Intl.LocalesArgument;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  placeholder?: string;
  autoFocus?: boolean;
  invalid?: boolean;
  required?: boolean;
  className?: string;
};

function NumberInput({
  value,
  onValueChange,
  min,
  max,
  step,
  locale,
  disabled,
  readOnly,
  id,
  placeholder,
  autoFocus,
  invalid,
  required,
  className,
}: NumberInputProps) {
  const labels = getStepperLabels(locale);

  return (
    <NumberFieldPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      locale={locale}
      disabled={disabled}
      readOnly={readOnly}
      className={cx(s.root, className)}
    >
      <NumberFieldPrimitive.Group
        className={s.group}
        data-invalid={invalid || undefined}
      >
        <NumberFieldPrimitive.Decrement
          className={s.stepper}
          aria-label={labels.decrease}
        >
          <MinusIcon aria-hidden="true" />
        </NumberFieldPrimitive.Decrement>
        <NumberFieldPrimitive.Input
          id={id}
          className={s.input}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-invalid={invalid || undefined}
          aria-required={required || undefined}
        />
        <NumberFieldPrimitive.Increment
          className={s.stepper}
          aria-label={labels.increase}
        >
          <PlusIcon aria-hidden="true" />
        </NumberFieldPrimitive.Increment>
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  );
}

export { NumberInput };
