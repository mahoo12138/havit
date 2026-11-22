import { style } from '@vanilla-extract/css';
import { themeVars } from './theme.css';

/*
 * Shared row vocabulary for detail-page section cards (see
 * `components/ui/detail-section.tsx`). Every small card composes its body
 * from these primitives instead of inventing its own row layouts:
 *
 * - kv rows        — label + right-aligned value for facts (warranty expiry,
 *                    timestamps, thresholds, custom attributes)
 * - list rows      — thumb/avatar + name + sub + right slot for records
 *                    (container contents, loans, credentials, tasks)
 * - timeline rows  — dotted icon + content, for chronological logs
 * - emptyState / blockLinkButton / mutedText — shared endings
 */

/* ── kv rows ── */

export const kvList = style({
  display: 'flex',
  flexDirection: 'column',
});

export const kvRow = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(6rem, 0.72fr) minmax(0, 1fr) auto',
  gap: themeVars.space3,
  alignItems: 'center',
  minHeight: '2rem',
  borderTop: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:first-child': {
      borderTop: 0,
    },
  },
});

export const kvLabel = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
});

export const kvValue = style({
  color: themeVars.text,
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
  textAlign: 'right',
  overflowWrap: 'anywhere',
});

export const kvValueButton = style({
  border: 0,
  background: 'transparent',
  color: themeVars.text,
  font: 'inherit',
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
  textAlign: 'right',
  cursor: 'pointer',
});

export const iconOnly = style({
  display: 'inline-grid',
  placeItems: 'center',
  width: '1.75rem',
  height: '1.75rem',
  border: 0,
  borderRadius: themeVars.radius1,
  background: 'transparent',
  color: themeVars.muted,
  cursor: 'pointer',
});

/* ── list rows ── */

export const listStack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
});

export const listRow = style({
  display: 'grid',
  gridTemplateColumns: '2.3rem minmax(0, 1fr) auto',
  gap: themeVars.space3,
  alignItems: 'center',
  color: themeVars.text,
  textDecoration: 'none',
});

export const listThumb = style({
  display: 'inline-grid',
  placeItems: 'center',
  width: '2.3rem',
  height: '2.3rem',
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  color: themeVars.muted,
});

export const listMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.1rem',
  minWidth: 0,
});

export const listName = style({
  color: themeVars.ink,
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const listSub = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeXs,
});

export const avatar = style({
  display: 'inline-grid',
  placeItems: 'center',
  width: '2.3rem',
  height: '2.3rem',
  borderRadius: '999px',
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightBold,
});

/* ── timeline rows ── */

export const timeline = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
});

export const timelineRow = style({
  display: 'grid',
  gridTemplateColumns: '2rem minmax(0, 1fr)',
  gap: themeVars.space3,
  alignItems: 'start',
});

export const timelineIcon = style({
  display: 'inline-grid',
  placeItems: 'center',
  width: '1.9rem',
  height: '1.9rem',
  borderRadius: '999px',
  background: themeVars.bgSoft,
  color: themeVars.muted,
});

export const timelineMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
});

export const payload = style({
  display: 'block',
  marginTop: themeVars.space1,
  padding: themeVars.space2,
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  color: themeVars.muted,
  fontFamily: themeVars.fontMono,
  fontSize: themeVars.textSizeXs,
  whiteSpace: 'pre-wrap',
});

/* ── shared endings ── */

export const emptyState = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
  padding: themeVars.space3,
  textAlign: 'center',
  background: themeVars.bgSoft,
  borderRadius: themeVars.radius2,
});

export const blockLinkButton = style({
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '2.2rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.panel,
  color: themeVars.info,
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
  cursor: 'pointer',
  textDecoration: 'none',
});

export const mutedText = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
});
