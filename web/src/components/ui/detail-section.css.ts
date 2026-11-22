import { style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

// Applied as a className on the Card component; head/body carry the padding.
export const sectionCard = style({
  selectors: {
    '&[data-slot="card"]': {
      padding: 0,
      gap: 0,
      minWidth: 0,
    },
  },
});

export const sectionHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  minHeight: '3.2rem',
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

export const sectionTitle = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space2,
  margin: 0,
  color: themeVars.ink,
  fontSize: themeVars.textSizeMd,
  fontWeight: themeVars.weightSemibold,
});

export const sectionIcon = style({
  display: 'inline-grid',
  placeItems: 'center',
  width: '1.65rem',
  height: '1.65rem',
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  color: themeVars.info,
});

export const sectionBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  padding: themeVars.space4,
});
