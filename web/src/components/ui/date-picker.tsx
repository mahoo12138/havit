import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, XIcon } from 'lucide-react';
import { enUS, zhCN } from 'react-day-picker/locale';
import type { Locale } from 'react-day-picker';

import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import * as s from './date-picker.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatDateValue(date?: Date): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLocaleConfig(language?: string): { code: string; calendarLocale: Locale } {
  const isZh = language?.toLowerCase().startsWith('zh');
  return {
    code: isZh ? 'zh-CN' : 'en-US',
    calendarLocale: isZh ? zhCN : enUS,
  };
}

// Compact, locale-aware display: en-US reads like "Apr 10, 2024"; the numeric
// form keeps narrow two-column form fields from truncating CJK date glyphs.
function formatDisplayDate(date: Date | undefined, code: string): string {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat(code, {
      year: 'numeric',
      month: code === 'zh-CN' ? 'numeric' : 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return formatDateValue(date);
  }
}

type DatePickerProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'onChange' | 'value'
> & {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
};

function DatePicker({
  className,
  value,
  onChange,
  placeholder,
  disabled,
  minDate,
  maxDate,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { i18n } = useTranslation();
  const localeConfig = getLocaleConfig(i18n.language);
  const selected = React.useMemo(() => parseDate(value), [value]);

  return (
    <span className={s.control}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cx(s.trigger, className)}
          disabled={disabled}
          data-empty={!selected || undefined}
          {...props}
        >
          <CalendarIcon className={s.triggerIcon} aria-hidden="true" />
          <span className={s.value}>
            {selected ? formatDisplayDate(selected, localeConfig.code) : placeholder}
          </span>
        </PopoverTrigger>
        <PopoverContent className={s.content} align="start" sideOffset={8}>
          <Calendar
            locale={localeConfig.calendarLocale}
            selected={selected}
            minDate={minDate}
            maxDate={maxDate}
            onSelect={(date) => {
              onChange(formatDateValue(date));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {selected && !disabled ? (
        <button
          type="button"
          className={s.clear}
          aria-label="Clear date"
          onClick={() => onChange('')}
        >
          <XIcon aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}

export { DatePicker };
export type { DatePickerProps };
