import { globalStyle, keyframes, style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

// Geometry ported from baseui-cn's date-picker stylesheet: 2rem day buttons on a
// 2px cell grid, a 2.5rem caption row and a fixed 6-week body (fixedWeeks) so the
// day view, year grid and month grid all share one stable popover height.

const dayButtonSize = '2rem';
const cellPadding = '2px';
const daySize = `calc(${dayButtonSize} + ${cellPadding} * 2)`;
const weekHeaderH = '1.75rem';
const gridBodyH = `calc(6 * ${daySize} + ${weekHeaderH})`;
const navRowH = '2.5rem';
const navButtonSize = '1.75rem';
const shellPadding = '0.75rem';
const controlRadius = themeVars.radius2;

const viewFade = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

export const shell = style({
  boxSizing: 'border-box',
  width: `calc(7 * ${daySize} + ${shellPadding} * 2)`,
  height: `calc(${gridBodyH} + ${navRowH} + ${shellPadding} * 2)`,
  maxWidth: '100%',
  overflow: 'hidden',
  padding: shellPadding,
  borderRadius: 'inherit',
  background: themeVars.panel,
  color: themeVars.text,
  fontSize: themeVars.textSizeBase,
});

export const root = style({
  display: 'block',
});

export const months = style({
  position: 'relative',
});

export const month = style({
  position: 'relative',
});

export const monthPicker = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

// ---------------------------------------------- caption row / toggle button

export const monthCaption = style({
  display: 'flex',
  alignItems: 'center',
  height: navRowH,
  fontWeight: themeVars.weightSemibold,
  // Leave room for the right-side prev/next nav cluster.
  paddingInlineEnd: `calc(${navButtonSize} * 2 + 0.5rem)`,
});

export const captionToggle = style({
  position: 'relative',
  zIndex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  height: navButtonSize,
  minHeight: navButtonSize,
  paddingInline: '0.5rem',
  border: 0,
  borderRadius: controlRadius,
  background: 'transparent',
  color: themeVars.text,
  font: 'inherit',
  fontWeight: themeVars.weightSemibold,
  fontSize: themeVars.textSizeBase,
  lineHeight: themeVars.leadingNone,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: `background-color 150ms ease, color 150ms ease`,
  selectors: {
    '&:hover, &[data-expanded], &:focus-visible': {
      background: themeVars.secondaryBg,
      color: themeVars.ink,
    },
    '&:focus-visible': {
      outline: `2px solid ${themeVars.accent}`,
      outlineOffset: '2px',
    },
  },
});

export const captionChevron = style({
  flexShrink: 0,
  width: '0.875rem',
  height: '0.875rem',
  transformOrigin: '50% 50%',
  transition: 'transform 160ms ease-in-out',
  selectors: {
    [`${captionToggle}[data-expanded] &`]: {
      transform: 'rotate(180deg)',
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
});

// --------------------------------------------------------------- navigation

export const nav = style({
  position: 'absolute',
  top: 0,
  insetInlineEnd: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  height: navRowH,
});

export const navButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: navButtonSize,
  height: navButtonSize,
  padding: 0,
  border: 0,
  borderRadius: controlRadius,
  background: 'transparent',
  color: themeVars.text,
  boxShadow: `inset 0 0 0 1px ${themeVars.line}`,
  font: 'inherit',
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none',
  transition: `background-color 150ms ease, box-shadow 150ms ease`,
  selectors: {
    '&:hover': {
      background: themeVars.secondaryBg,
      color: themeVars.ink,
    },
    '&:focus-visible': {
      boxShadow: `inset 0 0 0 2px ${themeVars.accent}`,
    },
    '&:disabled, &[aria-disabled="true"]': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
});

globalStyle(`${navButton} svg`, {
  width: '1rem',
  height: '1rem',
});

export const navChevron = style({
  display: 'inline-block',
  color: 'currentColor',
});

export const pickerHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
  height: navRowH,
  marginBottom: '0.75rem',
});

export const pickerNav = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  flexShrink: 0,
});

// ------------------------------------------------------- year / month panels

export const viewPanel = style({
  height: `calc(${gridBodyH} - 0.75rem)`,
  overflow: 'hidden',
  animationName: viewFade,
  animationDuration: '160ms',
  animationTimingFunction: 'ease-out',
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animationDuration: '0ms',
    },
  },
});

export const yearGrid = style({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gridAutoRows: '2.375rem',
  rowGap: '0.5rem',
  columnGap: '0.375rem',
  width: '100%',
  height: '100%',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  alignContent: 'start',
  padding: '0.25rem 0.25rem 0.5rem',
  scrollbarWidth: 'thin',
  scrollbarColor: `color-mix(in srgb, ${themeVars.muted} 70%, transparent) transparent`,
});

export const monthGridPanel = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gridAutoRows: '2.375rem',
  rowGap: '0.5rem',
  columnGap: '0.375rem',
  width: '100%',
  height: '100%',
  alignContent: 'center',
  padding: '0.25rem',
});

export const gridButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '2.375rem',
  padding: 0,
  border: 0,
  borderRadius: controlRadius,
  background: 'transparent',
  color: themeVars.text,
  font: 'inherit',
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightMedium,
  fontVariantNumeric: 'tabular-nums',
  cursor: 'pointer',
  transition: `background-color 150ms ease, color 150ms ease`,
  selectors: {
    '&:hover:not(:disabled)': {
      background: themeVars.secondaryBg,
      color: themeVars.ink,
    },
    '&:focus-visible': {
      position: 'relative',
      zIndex: 1,
      outline: `2px solid ${themeVars.accent}`,
      outlineOffset: '2px',
    },
    '&:disabled': {
      opacity: 0.4,
      cursor: 'not-allowed',
    },
  },
});

export const gridButtonSelected = style({
  background: themeVars.accent,
  color: themeVars.onAccent,
  fontWeight: themeVars.weightSemibold,
  selectors: {
    '&:hover:not(:disabled)': {
      background: themeVars.accent,
      color: themeVars.onAccent,
    },
  },
});

export const gridButtonCurrent = style({
  background: themeVars.secondaryBg,
  color: themeVars.ink,
  fontWeight: themeVars.weightSemibold,
});

// ----------------------------------------------------------------- day grid

export const monthGridTable = style({
  width: '100%',
  borderCollapse: 'collapse',
  borderSpacing: 0,
  tableLayout: 'fixed',
});

export const weekdays = style({});

export const weekday = style({
  height: weekHeaderH,
  padding: 0,
  textAlign: 'center',
  color: themeVars.muted,
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightMedium,
  userSelect: 'none',
});

export const week = style({});

export const day = style({
  width: daySize,
  height: daySize,
  padding: cellPadding,
  textAlign: 'center',
  userSelect: 'none',
});

export const dayButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: dayButtonSize,
  height: dayButtonSize,
  padding: 0,
  border: 0,
  borderRadius: controlRadius,
  background: 'none',
  color: themeVars.text,
  font: 'inherit',
  fontSize: themeVars.textSizeSm,
  lineHeight: themeVars.leadingNone,
  cursor: 'pointer',
  outline: 'none',
  transition: `background-color 150ms ease, color 150ms ease`,
  selectors: {
    '&:hover': {
      background: themeVars.secondaryBg,
      color: themeVars.ink,
    },
    '&:focus-visible': {
      boxShadow: `inset 0 0 0 2px ${themeVars.accent}`,
    },
    '&:disabled': {
      cursor: 'not-allowed',
    },
  },
});

// Day modifiers land as data attributes on the <td> (see DayPicker v10).

globalStyle(`${day}[data-selected="true"] ${dayButton}`, {
  background: themeVars.accent,
  color: themeVars.onAccent,
});

globalStyle(`${day}[data-selected="true"] ${dayButton}:hover`, {
  background: themeVars.accent,
  color: themeVars.onAccent,
});

globalStyle(
  `${day}[data-today="true"]:not([data-selected="true"]):not([data-outside="true"]) ${dayButton}`,
  {
    background: themeVars.secondaryBg,
    color: themeVars.ink,
    fontWeight: themeVars.weightSemibold,
  },
);

globalStyle(`${day}[data-outside="true"] ${dayButton}`, {
  opacity: 0.4,
  color: themeVars.muted,
});

globalStyle(`${day}[data-disabled="true"] ${dayButton}`, {
  opacity: 0.4,
  cursor: 'not-allowed',
});

globalStyle(`${day}[data-disabled="true"] ${dayButton}:hover`, {
  background: 'transparent',
});

globalStyle(`${day}[data-hidden="true"]`, {
  visibility: 'hidden',
});

export const footer = style({
  width: 0,
  minWidth: '100%',
  paddingTop: '0.5rem',
});
