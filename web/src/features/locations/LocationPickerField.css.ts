import { globalStyle, style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const control = style({
  position: 'relative',
  display: 'flex',
  width: '100%',
  minWidth: 0,
  height: '2.25rem',
  alignItems: 'stretch',
  overflow: 'hidden',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  transition: 'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
  selectors: {
    '&:focus-within': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
    '&[data-open="true"]': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
    '&[data-invalid="true"]': {
      borderColor: themeVars.danger,
      boxShadow: `0 0 0 3px ${themeVars.dangerSoft}`,
    },
    '&[data-disabled="true"]': {
      background: themeVars.bgSoft,
      opacity: 0.5,
    },
  },
});

export const pathButton = style({
  position: 'absolute',
  left: themeVars.space3,
  top: '50%',
  zIndex: 1,
  width: '1rem',
  height: '1rem',
  transform: 'translateY(-50%)',
  display: 'inline-grid',
  placeItems: 'center',
  border: 0,
  borderRadius: themeVars.radius1,
  background: 'transparent',
  color: themeVars.muted,
  padding: 0,
  outline: 'none',
  cursor: 'pointer',
  transition: 'background-color 140ms ease, color 140ms ease',
  selectors: {
    '&:hover:not(:disabled), &[data-state="instant-open"], &[data-state="delayed-open"]': {
      color: themeVars.text,
    },
    '&:disabled': {
      cursor: 'not-allowed',
    },
  },
});

export const pathTooltip = style({
  width: 'fit-content',
  maxWidth: '20rem',
  gap: 0,
  borderRadius: '6px',
  background: themeVars.ink,
  color: themeVars.bg,
  padding: '0.375rem 0.75rem',
  fontSize: themeVars.textSizeXs,
  lineHeight: themeVars.leadingSnug,
});

// The trigger renders as a plain span wrapping the typeable search input —
// pointer events on the input are stopped in the component so Base UI's
// click-toggle never closes the panel while typing.
export const trigger = style({
  minWidth: 0,
  height: '100%',
  width: '100%',
  flex: '1 1 auto',
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space1,
  background: 'transparent',
  color: 'inherit',
  outline: 'none',
});

export const triggerInput = style({
  flex: '1 1 auto',
  minWidth: 0,
  height: '100%',
  border: 0,
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  fontSize: themeVars.textSizeBase,
  padding: `0 ${themeVars.space2} 0 2.25rem`,
  outline: 'none',
  selectors: {
    '&::placeholder': {
      color: themeVars.muted,
    },
    '&:disabled': {
      cursor: 'not-allowed',
    },
  },
});

export const triggerIcon = style({
  flex: '0 0 auto',
  display: 'inline-grid',
  placeItems: 'center',
  width: '1.5rem',
  height: '1.5rem',
  marginInlineEnd: themeVars.space1,
  color: themeVars.muted,
  cursor: 'text',
});

export const triggerClear = style({
  flex: '0 0 auto',
  display: 'inline-grid',
  placeItems: 'center',
  width: '1.25rem',
  height: '1.25rem',
  marginInlineEnd: themeVars.space2,
  border: 0,
  borderRadius: themeVars.radius1,
  background: 'transparent',
  color: themeVars.muted,
  padding: 0,
  cursor: 'pointer',
  transition: 'background-color 140ms ease, color 140ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.lineSoft,
      color: themeVars.text,
    },
    '&:focus-visible': {
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
      outline: 'none',
    },
  },
});

export const matchMark = style({
  margin: 0,
  padding: 0,
  borderRadius: '2px',
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
});

export const noResults = style({
  padding: `${themeVars.space3} ${themeVars.space3} ${themeVars.space4}`,
  color: themeVars.muted,
  fontSize: themeVars.textSizeBase,
  textAlign: 'center',
});

export const panel = style({
  width: 'max-content',
  minWidth: 'var(--anchor-width, 12rem)',
  maxWidth: 'min(34rem, var(--available-width, calc(100vw - 2rem)))',
  gap: 0,
  overflow: 'hidden',
  padding: 0,
});

export const treeBody = style({
  width: 'max-content',
  minWidth: '100%',
  maxWidth: 'inherit',
  maxHeight: '18rem',
});

export const treeInner = style({
  display: 'inline-flex',
  minWidth: '100%',
  flexDirection: 'column',
  padding: '2px 4px 4px',
});

globalStyle(`${treeInner} [data-slot="tree"]`, {
  width: 'max-content',
  minWidth: '100%',
});

globalStyle(`${treeInner} [data-slot="tree-group"]`, {
  width: 'max-content',
  minWidth: '100%',
  paddingBlock: '2px',
});

globalStyle(`${treeInner} [data-slot="tree-group-label"]`, {
  padding: '0.375rem 0.375rem 0.25rem',
});

globalStyle(`${treeInner} [data-slot="tree-item"]`, {
  width: 'max-content',
  minWidth: '100%',
  paddingBlock: '5px',
});

globalStyle(`${treeInner} [data-slot="tree-item"]`, {
  width: 'max-content',
  minWidth: '100%',
});

globalStyle(`${treeInner} [data-slot="tree-item-label"]`, {
  flex: '0 0 auto',
  minWidth: 'max-content',
  overflow: 'visible',
  textOverflow: 'clip',
});

export const empty = style({
  padding: themeVars.space4,
  color: themeVars.muted,
  fontSize: themeVars.textSizeBase,
  textAlign: 'center',
});
