import { globalStyle, style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

// Trigger shell mirrors ui/input.css so the picker reads as a form field,
// with the clear action as a real sibling button instead of a nested control.

export const control = style({
  position: 'relative',
  display: 'block',
  width: '100%',
  minWidth: 0,
});

export const trigger = style({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  gap: themeVars.space2,
  height: '2.25rem',
  padding: '0 2.25rem 0 0.75rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  font: 'inherit',
  fontSize: themeVars.textSizeBase,
  lineHeight: themeVars.leadingNone,
  textAlign: 'left',
  outline: 'none',
  cursor: 'pointer',
  transition:
    'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
  selectors: {
    '&[data-empty]': {
      color: themeVars.muted,
    },
    '&:hover:not(:disabled)': {
      background: themeVars.bgSoft,
    },
    '&[aria-expanded="true"]': {
      background: themeVars.bgSoft,
      color: themeVars.ink,
    },
    '&:focus-visible': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
    '&[aria-invalid="true"]': {
      borderColor: themeVars.danger,
      boxShadow: `0 0 0 3px ${themeVars.dangerSoft}`,
    },
    '&:disabled': {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      background: themeVars.bgSoft,
      opacity: 0.5,
    },
  },
});

export const triggerIcon = style({
  width: '1rem',
  height: '1rem',
  flexShrink: 0,
  color: themeVars.muted,
});

export const value = style({
  flex: '1 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textAlign: 'left',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  selectors: {
    [`${trigger}[data-empty] &`]: {
      color: themeVars.muted,
    },
  },
});

export const clear = style({
  position: 'absolute',
  top: '50%',
  insetInlineEnd: '0.25rem',
  transform: 'translateY(-50%)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.75rem',
  height: '1.75rem',
  padding: 0,
  border: 0,
  borderRadius: themeVars.radius2,
  background: 'transparent',
  color: themeVars.muted,
  cursor: 'pointer',
  transition: 'background-color 140ms ease, color 140ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.lineSoft,
      color: themeVars.ink,
    },
    '&:focus-visible': {
      outline: `2px solid ${themeVars.accent}`,
      outlineOffset: '-1px',
    },
  },
});

globalStyle(`${clear} svg`, {
  width: '1rem',
  height: '1rem',
});

export const content = style({
  width: 'auto',
  minWidth: 'auto',
  padding: 0,
  gap: 0,
});
