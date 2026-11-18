import { globalStyle, style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

// Stepper shell mirrors ui/input.css: one bordered group wrapping the
// decrement button, the centered value and the increment button.

export const root = style({
  display: 'flex',
  width: '100%',
  minWidth: 0,
});

export const group = style({
  display: 'flex',
  alignItems: 'stretch',
  width: '100%',
  height: '2.25rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  transition:
    'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
  selectors: {
    '&:has(input:focus-visible)': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
    '&:has(input[aria-invalid="true"]), &[data-invalid="true"]': {
      borderColor: themeVars.danger,
      boxShadow: `0 0 0 3px ${themeVars.dangerSoft}`,
    },
    '&[data-disabled="true"]': {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      background: themeVars.bgSoft,
      opacity: 0.5,
    },
    '&[data-readonly="true"]': {
      background: themeVars.bgSoft,
      cursor: 'default',
    },
  },
  '@media': {
    '(hover: hover)': {
      selectors: {
        '&:not([data-disabled="true"], [data-invalid="true"]):hover, &:not([data-disabled="true"]):has(input[aria-invalid="true"]):hover':
          {
            borderColor: `color-mix(in srgb, ${themeVars.line} 55%, ${themeVars.text})`,
          },
      },
    },
    '(pointer: coarse)': {
      minHeight: '2.875rem',
    },
  },
});

export const stepper = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'stretch',
  flexShrink: 0,
  width: '2.25rem',
  padding: 0,
  border: 0,
  borderRadius: 0,
  background: 'transparent',
  color: themeVars.text,
  font: 'inherit',
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none',
  transition: 'background-color 100ms ease, color 100ms ease',
  selectors: {
    '&:hover:not(:disabled)': {
      background: themeVars.secondaryBg,
    },
    '&:active:not(:disabled)': {
      background: `color-mix(in srgb, ${themeVars.secondaryBg} 70%, ${themeVars.ink})`,
    },
    '&:focus-visible': {
      outline: `2px solid ${themeVars.accent}`,
      outlineOffset: '-3px',
    },
    '&:disabled': {
      color: themeVars.muted,
      cursor: 'not-allowed',
    },
  },
  '@media': {
    '(pointer: coarse)': {
      minWidth: '2.75rem',
      minHeight: '2.75rem',
    },
    '(prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
});

globalStyle(`${stepper} svg`, {
  width: '1rem',
  height: '1rem',
  pointerEvents: 'none',
});

export const input = style({
  flex: '1 1 auto',
  width: '100%',
  minWidth: 0,
  textAlign: 'center',
  border: 0,
  background: 'transparent',
  color: themeVars.text,
  font: 'inherit',
  fontSize: themeVars.textSizeBase,
  lineHeight: themeVars.leadingNone,
  fontVariantNumeric: 'tabular-nums',
  padding: 0,
  outline: 'none',
  selectors: {
    '&::placeholder': {
      color: themeVars.muted,
    },
    '&:disabled': {
      cursor: 'not-allowed',
    },
    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
  },
});
