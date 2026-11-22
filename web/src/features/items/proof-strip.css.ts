import { style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

/*
 * Purchase-proof attachment strip, shared by the desktop PurchasePanel and
 * the mobile PurchaseSection: image proofs show photo thumbnails, PDFs a
 * file tile, each with a hover delete control, plus a dashed upload tile.
 */

export const strip = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(7.5rem, 1fr))',
  gap: themeVars.space2,
});

export const thumb = style({
  position: 'relative',
  minHeight: '4.6rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space1,
  padding: themeVars.space2,
  textAlign: 'center',
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.bgSoft,
  color: themeVars.muted,
  overflow: 'hidden',
  textDecoration: 'none',
  cursor: 'pointer',
});

export const thumbImg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const thumbName = style({
  position: 'relative',
  maxWidth: '100%',
  fontSize: themeVars.textSizeXs,
  color: themeVars.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

// Fades the tile content behind a photo thumbnail so the filename stays legible.
export const thumbScrim = style({
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0) 55%)',
});

export const deleteButton = style({
  position: 'absolute',
  top: '0.3rem',
  right: '0.3rem',
  display: 'inline-grid',
  placeItems: 'center',
  width: '1.6rem',
  height: '1.6rem',
  border: 0,
  borderRadius: '999px',
  background: themeVars.panel,
  color: themeVars.muted,
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      color: themeVars.danger,
    },
  },
});

export const add = style({
  minHeight: '4.6rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space1,
  border: `1px dashed ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.info,
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightSemibold,
  cursor: 'pointer',
  selectors: {
    '&:disabled': {
      cursor: 'default',
      opacity: 0.6,
    },
  },
});

export const fileInput = style({
  display: 'none',
});

export const hint = style({
  gridColumn: '1 / -1',
  margin: 0,
  color: themeVars.muted,
  fontSize: themeVars.textSizeXs,
});
