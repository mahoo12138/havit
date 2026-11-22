import { style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

/*
 * Item edit dialog: a wider panel (the default 24rem dialog is too narrow
 * for two fields side by side) over a responsive two-column field grid.
 * Full-width rows — name, location picker, description, actions — span
 * both columns; the short facts pair up.
 */

// Double-class selector so the wider panel wins over dialog.css defaults.
export const content = style({
  selectors: {
    '&&': {
      '@media': {
        '(min-width: 40em)': {
          maxWidth: '36rem',
        },
      },
    },
  },
});

export const grid = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: themeVars.space4,
  alignItems: 'start',
  '@media': {
    '(min-width: 40em)': {
      gridTemplateColumns: '1fr 1fr',
    },
  },
});

export const full = style({
  gridColumn: '1 / -1',
});
