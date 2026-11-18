import * as React from 'react';
import {
  DayPicker,
  type CustomComponents,
  type Locale,
  type Matcher,
} from 'react-day-picker';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import * as s from './calendar.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

// ---------------------------------------------------------------- date utils
// Tiny month-level helpers so the calendar stays free of a date-fns import.

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isBeforeMonth(a: Date, b: Date): boolean {
  return (
    a.getFullYear() < b.getFullYear() ||
    (a.getFullYear() === b.getFullYear() && a.getMonth() < b.getMonth())
  );
}

function isAfterMonth(a: Date, b: Date): boolean {
  return isBeforeMonth(b, a);
}

function formatMonthLabel(date: Date, localeCode?: string): string {
  try {
    return new Intl.DateTimeFormat(localeCode, {
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  }
}

function formatMonthName(date: Date, localeCode?: string): string {
  try {
    return new Intl.DateTimeFormat(localeCode, { month: 'short' }).format(date);
  } catch {
    return String(date.getMonth() + 1);
  }
}

// ------------------------------------------------------------------- labels

type CalendarLabels = {
  openPicker: string;
  backToCalendar: string;
  chooseYear: string;
  chooseMonth: string;
  navigateYear: string;
  previousYear: string;
  nextYear: string;
};

const LABELS: Record<'en' | 'zh', CalendarLabels> = {
  en: {
    openPicker: 'Select month and year',
    backToCalendar: 'Back to the calendar',
    chooseYear: 'Choose year',
    chooseMonth: 'Choose month',
    navigateYear: 'Navigate year',
    previousYear: 'Previous year',
    nextYear: 'Next year',
  },
  zh: {
    openPicker: '选择年月',
    backToCalendar: '返回日历',
    chooseYear: '选择年份',
    chooseMonth: '选择月份',
    navigateYear: '切换年份',
    previousYear: '上一年',
    nextYear: '下一年',
  },
};

function getLabels(locale?: Locale): CalendarLabels {
  return locale?.code?.toLowerCase().startsWith('zh') ? LABELS.zh : LABELS.en;
}

// --------------------------------------------------------------- boundaries

type MonthBoundaries = { startMonth?: Date; endMonth?: Date };

function getBoundaries(minDate?: Date, maxDate?: Date): MonthBoundaries {
  const startMonth = minDate ? startOfMonth(minDate) : undefined;
  const endMonth = maxDate ? startOfMonth(maxDate) : undefined;
  if (startMonth && endMonth && isAfterMonth(startMonth, endMonth)) {
    return { startMonth, endMonth: startMonth };
  }
  return { startMonth, endMonth };
}

function clampMonth(date: Date, boundaries: MonthBoundaries): Date {
  const month = startOfMonth(date);
  if (boundaries.startMonth && isBeforeMonth(month, boundaries.startMonth)) {
    return boundaries.startMonth;
  }
  if (boundaries.endMonth && isAfterMonth(month, boundaries.endMonth)) {
    return boundaries.endMonth;
  }
  return month;
}

function getDisabledMatchers(
  disabledDates: Matcher | Matcher[] | undefined,
  minDate?: Date,
  maxDate?: Date,
): Matcher[] {
  const matchers: Matcher[] = [];
  if (disabledDates !== undefined) {
    matchers.push(...(Array.isArray(disabledDates) ? disabledDates : [disabledDates]));
  }
  if (minDate) matchers.push({ before: minDate });
  if (maxDate) matchers.push({ after: maxDate });
  return matchers;
}

// -------------------------------------------------------------- context

type PickerView = 'days' | 'years' | 'months';

type CalendarSurfaceContextValue = {
  view: PickerView;
  now: Date;
  localeCode?: string;
  labels: CalendarLabels;
  boundaries: MonthBoundaries;
  displayMonth: Date;
  setView: (view: PickerView) => void;
  setDisplayMonth: (month: Date) => void;
  returnToDays: () => void;
};

const CalendarSurfaceContext = React.createContext<CalendarSurfaceContextValue | null>(null);

function useCalendarSurface(): CalendarSurfaceContextValue {
  const context = React.useContext(CalendarSurfaceContext);
  if (!context) {
    throw new Error('Calendar month panels must be rendered inside the Calendar surface');
  }
  return context;
}

// ------------------------------------------------------------ grid keyboard nav

function useGridNavigation(itemCount: number, columns: number) {
  const gridRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = itemRefs.current.findIndex((item) => item === document.activeElement);
      if (currentIndex < 0) return;

      const offsets: Record<string, number> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -columns,
        ArrowDown: columns,
      };
      const offset = offsets[event.key];
      if (!offset) return;

      event.preventDefault();
      let nextIndex = currentIndex + offset;
      while (nextIndex >= 0 && nextIndex < itemCount && itemRefs.current[nextIndex]?.disabled) {
        nextIndex += offset;
      }
      const nextItem = itemRefs.current[nextIndex];
      nextItem?.focus({ preventScroll: true });

      const grid = gridRef.current;
      if (grid && nextItem) {
        const itemTop = nextItem.offsetTop;
        const itemBottom = itemTop + nextItem.offsetHeight;
        if (itemTop < grid.scrollTop) grid.scrollTop = itemTop;
        if (itemBottom > grid.scrollTop + grid.clientHeight) {
          grid.scrollTop = itemBottom - grid.clientHeight;
        }
      }
    },
    [columns, itemCount],
  );

  return { gridRef, itemRefs, onKeyDown };
}

// -------------------------------------------------------------- panel pieces

function CaptionToggle({
  label,
  expanded,
  onClick,
  ariaLabel,
}: {
  label: string;
  expanded: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      className={s.captionToggle}
      data-calendar-caption=""
      data-expanded={expanded || undefined}
      onClick={onClick}
      aria-expanded={expanded}
      aria-label={ariaLabel}
    >
      <span>{label}</span>
      <ChevronDownIcon className={s.captionChevron} aria-hidden="true" />
    </button>
  );
}

type PickerHeaderProps = {
  label: string;
  expanded: boolean;
  onClick: () => void;
  ariaLabel: string;
  showNav?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
};

function PickerHeader({
  label,
  expanded,
  onClick,
  ariaLabel,
  showNav = false,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
}: PickerHeaderProps) {
  const context = useCalendarSurface();
  return (
    <div className={s.pickerHeader}>
      <CaptionToggle label={label} expanded={expanded} onClick={onClick} ariaLabel={ariaLabel} />
      {showNav ? (
        <div className={s.pickerNav} role="group" aria-label={context.labels.navigateYear}>
          <button
            type="button"
            className={s.navButton}
            onClick={onPrevious}
            disabled={previousDisabled}
            aria-label={context.labels.previousYear}
          >
            <ChevronLeftIcon className={s.navChevron} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={s.navButton}
            onClick={onNext}
            disabled={nextDisabled}
            aria-label={context.labels.nextYear}
          >
            <ChevronRightIcon className={s.navChevron} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function YearGrid({
  years,
  selectedYear,
  currentYear,
  onSelect,
}: {
  years: number[];
  selectedYear: number;
  currentYear: number;
  onSelect: (year: number) => void;
}) {
  const context = useCalendarSurface();
  const selectedIndex = Math.max(0, years.indexOf(selectedYear));
  const { gridRef, itemRefs, onKeyDown } = useGridNavigation(years.length, 3);

  React.useLayoutEffect(() => {
    const grid = gridRef.current;
    const selectedItem = itemRefs.current[selectedIndex];
    if (!grid || !selectedItem) return;

    const centeredTop =
      selectedItem.offsetTop - (grid.clientHeight - selectedItem.offsetHeight) / 2;
    grid.scrollTop = Math.max(0, Math.min(centeredTop, grid.scrollHeight - grid.clientHeight));
    selectedItem.focus({ preventScroll: true });
  }, [gridRef, itemRefs, selectedIndex]);

  return (
    <div
      ref={gridRef}
      className={s.yearGrid}
      role="listbox"
      aria-label={context.labels.chooseYear}
      onKeyDown={onKeyDown}
    >

      {years.map((year, index) => {
        const isSelected = year === selectedYear;
        const isCurrent = year === currentYear && !isSelected;
        return (
          <button
            key={year}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            type="button"
            role="option"
            aria-selected={isSelected}
            tabIndex={index === selectedIndex ? 0 : -1}
            className={cx(
              s.gridButton,
              isSelected && s.gridButtonSelected,
              isCurrent && s.gridButtonCurrent,
            )}
            onClick={() => onSelect(year)}
          >
            {year}
          </button>
        );
      })}
    </div>
  );
}

function MonthGrid({
  year,
  displayMonthIndex,
  currentMonth,
  currentYear,
  boundaries,
  onSelect,
}: {
  year: number;
  displayMonthIndex: number;
  currentMonth: number;
  currentYear: number;
  boundaries: MonthBoundaries;
  onSelect: (monthIndex: number) => void;
}) {
  const context = useCalendarSurface();
  const preferredIndex = year === currentYear ? currentMonth : displayMonthIndex;
  const { gridRef, itemRefs, onKeyDown } = useGridNavigation(12, 3);

  React.useLayoutEffect(() => {
    const preferred = itemRefs.current[preferredIndex];
    const firstEnabled = itemRefs.current.find((item) => item && !item.disabled);
    (preferred?.disabled ? firstEnabled : preferred)?.focus({ preventScroll: true });
  }, [itemRefs, preferredIndex, year]);

  return (
    <div
      ref={gridRef}
      className={s.monthGridPanel}
      role="listbox"
      aria-label={context.labels.chooseMonth}
      onKeyDown={onKeyDown}
    >
      {Array.from({ length: 12 }, (_, monthIndex) => {
        const candidate = new Date(year, monthIndex, 1);
        const disabled = Boolean(
          (boundaries.startMonth && isBeforeMonth(candidate, boundaries.startMonth)) ||
            (boundaries.endMonth && isAfterMonth(candidate, boundaries.endMonth)),
        );
        const isSelected = monthIndex === displayMonthIndex;
        const isCurrent = year === currentYear && monthIndex === currentMonth && !isSelected;
        return (
          <button
            key={monthIndex}
            ref={(element) => {
              itemRefs.current[monthIndex] = element;
            }}
            type="button"
            role="option"
            aria-selected={isSelected}
            tabIndex={!disabled && monthIndex === preferredIndex ? 0 : -1}
            disabled={disabled}
            aria-label={`${formatMonthName(candidate, context.localeCode)} ${year}`}
            className={cx(
              s.gridButton,
              isSelected && s.gridButtonSelected,
              isCurrent && s.gridButtonCurrent,
            )}
            onClick={() => onSelect(monthIndex)}
          >
            {formatMonthName(candidate, context.localeCode)}
          </button>
        );
      })}
    </div>
  );
}

// --------------------------------------------------------- custom DayPicker UI

const CalendarMonth: CustomComponents['Month'] = ({
  calendarMonth: _calendarMonth,
  displayIndex: _displayIndex,
  className,
  children,
  ...props
}) => {
  const context = useCalendarSurface();
  const labels = context.labels;

  if (context.view === 'days') {
    return (
      <div {...props} className={cx(s.month, className)}>
        {children}
      </div>
    );
  }

  const panelMonth = context.displayMonth;
  const panelYear = panelMonth.getFullYear();
  const panelMonthIndex = panelMonth.getMonth();
  const { startMonth, endMonth } = context.boundaries;
  const defaultFromYear = context.now.getFullYear() - 100;
  const defaultToYear = context.now.getFullYear() + 20;
  const fromYear = startMonth ? startMonth.getFullYear() : defaultFromYear;
  const toYear = endMonth ? endMonth.getFullYear() : defaultToYear;
  const years = Array.from({ length: toYear - fromYear + 1 }, (_, index) => fromYear + index);
  const previousYearMonth = new Date(panelYear - 1, panelMonthIndex, 1);
  const nextYearMonth = new Date(panelYear + 1, panelMonthIndex, 1);
  const previousDisabled = Boolean(startMonth && isBeforeMonth(previousYearMonth, startMonth));
  const nextDisabled = Boolean(endMonth && isAfterMonth(nextYearMonth, endMonth));

  if (context.view === 'years') {
    return (
      <div {...props} className={cx(s.month, s.monthPicker, className)} data-calendar-view="years">
        <PickerHeader
          label={formatMonthLabel(panelMonth, context.localeCode)}
          expanded
          onClick={context.returnToDays}
          ariaLabel={labels.backToCalendar}
        />
        <div className={s.viewPanel} key="years">
          <YearGrid
            years={years}
            selectedYear={panelYear}
            currentYear={context.now.getFullYear()}
            onSelect={(year) => {
              context.setDisplayMonth(new Date(year, panelMonthIndex, 1));
              context.setView('months');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div {...props} className={cx(s.month, s.monthPicker, className)} data-calendar-view="months">
      <PickerHeader
        label={String(panelYear)}
        expanded
        onClick={() => context.setView('years')}
        ariaLabel={labels.chooseYear}
        showNav
        onPrevious={() => context.setDisplayMonth(previousYearMonth)}
        onNext={() => context.setDisplayMonth(nextYearMonth)}
        previousDisabled={previousDisabled}
        nextDisabled={nextDisabled}
      />
      <div className={s.viewPanel} key="months">
        <MonthGrid
          year={panelYear}
          displayMonthIndex={panelMonthIndex}
          currentMonth={context.now.getMonth()}
          currentYear={context.now.getFullYear()}
          boundaries={context.boundaries}
          onSelect={(monthIndex) => {
            context.setDisplayMonth(new Date(panelYear, monthIndex, 1));
            requestAnimationFrame(() => context.returnToDays());
          }}
        />
      </div>
    </div>
  );
};

const CalendarMonthCaption: CustomComponents['MonthCaption'] = ({
  calendarMonth,
  displayIndex: _displayIndex,
  className,
  children,
  ...props
}) => {
  const context = useCalendarSurface();
  return (
    <div {...props} className={cx(s.monthCaption, className)}>
      <CaptionToggle
        label={formatMonthLabel(calendarMonth.date, context.localeCode)}
        expanded={false}
        onClick={() => context.setView('years')}
        ariaLabel={context.labels.openPicker}
      />
    </div>
  );
};

const CalendarChevron: CustomComponents['Chevron'] = ({ className, orientation, ...props }) => {
  if (orientation === 'left') {
    return <ChevronLeftIcon className={cx(s.navChevron, className)} {...props} />;
  }
  if (orientation === 'right') {
    return <ChevronRightIcon className={cx(s.navChevron, className)} {...props} />;
  }
  return <ChevronDownIcon className={cx(s.navChevron, className)} {...props} />;
};

// ------------------------------------------------------------------ Calendar

export type CalendarProps = {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  locale?: Locale;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Matcher | Matcher[];
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  className?: string;
};

function Calendar({
  selected,
  onSelect,
  locale,
  minDate,
  maxDate,
  disabledDates,
  month: controlledMonth,
  defaultMonth,
  onMonthChange,
  className,
}: CalendarProps) {
  const [now] = React.useState(() => new Date());
  const boundaries = getBoundaries(minDate, maxDate);
  const [internalMonth, setInternalMonth] = React.useState(() =>
    clampMonth(
      (selected && startOfMonth(selected)) ||
        (defaultMonth && startOfMonth(defaultMonth)) ||
        now,
      boundaries,
    ),
  );
  const displayMonth = clampMonth(
    controlledMonth ? startOfMonth(controlledMonth) : internalMonth,
    boundaries,
  );
  const [view, setView] = React.useState<PickerView>('days');
  const shellRef = React.useRef<HTMLDivElement>(null);

  function setDisplayMonth(nextMonth: Date) {
    const normalized = clampMonth(startOfMonth(nextMonth), boundaries);
    if (!controlledMonth) setInternalMonth(normalized);
    onMonthChange?.(normalized);
  }

  function returnToDays() {
    setView('days');
    // Double rAF: the popover's own focus management also runs on the next
    // frame, so focus the caption only after every frame callback has settled.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        shellRef.current
          ?.querySelector<HTMLButtonElement>('[data-calendar-caption]')
          ?.focus({ preventScroll: true });
      });
    });
  }

  function handleShellKeyDownCapture(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape' || view === 'days') return;
    event.preventDefault();
    event.stopPropagation();
    returnToDays();
  }

  const contextValue: CalendarSurfaceContextValue = {
    view,
    now,
    localeCode: locale?.code,
    labels: getLabels(locale),
    boundaries,
    displayMonth,
    setView,
    setDisplayMonth,
    returnToDays,
  };

  return (
    <CalendarSurfaceContext.Provider value={contextValue}>
      <div
        ref={shellRef}
        className={cx(s.shell, className)}
        data-calendar-view={view}
        onKeyDownCapture={handleShellKeyDownCapture}
      >
        <DayPicker
          mode="single"
          showOutsideDays
          fixedWeeks
          navLayout="after"
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          startMonth={boundaries.startMonth}
          endMonth={boundaries.endMonth}
          disabled={getDisabledMatchers(disabledDates, minDate, maxDate)}
          selected={selected}
          onSelect={(date) => onSelect?.(date)}
          locale={locale}
          classNames={{
            root: s.root,
            months: s.months,
            nav: s.nav,
            button_previous: s.navButton,
            button_next: s.navButton,
            month_grid: s.monthGridTable,
            weekdays: s.weekdays,
            weekday: s.weekday,
            week: s.week,
            day: s.day,
            day_button: s.dayButton,
            footer: s.footer,
          }}
          components={{
            Chevron: CalendarChevron,
            Month: CalendarMonth,
            MonthCaption: CalendarMonthCaption,
          }}
        />
      </div>
    </CalendarSurfaceContext.Provider>
  );
}

export { Calendar };
