import { style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';
import { textStyles } from '../../styles/typography.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  width: '100%',
  minWidth: 0,
  paddingBottom: '5.5rem',
});

export const mobileTopActions = style({
  position: 'absolute',
  top: themeVars.space3,
  left: themeVars.space3,
  right: themeVars.space3,
  zIndex: 2,
  display: 'flex',
  justifyContent: 'space-between',
  gap: themeVars.space1,
  pointerEvents: 'none',
});

export const heroAction = style({
  pointerEvents: 'auto',
  background: `color-mix(in srgb, ${themeVars.panel} 84%, transparent)`,
  border: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.ink,
});

export const hero = style({
  position: 'relative',
  minWidth: 0,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  overflow: 'hidden',
  boxShadow: themeVars.shadowSoft,
});

export const photoFrame = style({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  height: 'min(64vw, 16.25rem)',
  minHeight: '10.5rem',
  aspectRatio: '16 / 9',
  background: `linear-gradient(180deg, ${themeVars.bgSoft}, ${themeVars.panel})`,
  overflow: 'hidden',
  selectors: {
    '&[data-empty]': {
      height: 'auto',
      minHeight: '6.25rem',
      aspectRatio: 'auto',
    },
  },
});

export const heroPhoto = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  objectPosition: 'center',
  background: themeVars.bgSoft,
});

export const photoEmpty = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space1,
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
});

export const photoCount = style({
  position: 'absolute',
  right: themeVars.space3,
  bottom: themeVars.space3,
  padding: '0.15rem 0.45rem',
  borderRadius: '999px',
  background: 'rgba(17, 24, 39, 0.72)',
  color: '#fff',
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightBold,
});

export const thumbStrip = style({
  display: 'flex',
  gap: themeVars.space2,
  overflowX: 'auto',
  padding: `${themeVars.space2} ${themeVars.space3} 0`,
  scrollbarWidth: 'none',
});

export const thumbButton = style({
  flex: '0 0 auto',
  width: '2.5rem',
  height: '2.5rem',
  padding: 0,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  overflow: 'hidden',
  selectors: {
    '&[data-active]': {
      borderColor: themeVars.info,
      boxShadow: `0 0 0 2px ${themeVars.infoSoft}`,
    },
  },
});

export const thumbImg = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const thumbAdd = style({
  flex: '0 0 auto',
  width: '2.5rem',
  height: '2.5rem',
  display: 'grid',
  placeItems: 'center',
  border: `1px dashed ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  color: themeVars.accentInk,
});

export const hiddenInput = style({
  display: 'none',
});

export const summary = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  padding: `${themeVars.space3} ${themeVars.space4} ${themeVars.space4}`,
  minWidth: 0,
});

export const title = textStyles.pageTitle;

export const badgeRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  flexWrap: 'wrap',
});

export const typeBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  height: '1.45rem',
  padding: '0 0.45rem',
  borderRadius: themeVars.radius1,
  background: themeVars.secondaryBg,
  color: themeVars.secondaryText,
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightSemibold,
});

export const categoryBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  height: '1.45rem',
  padding: '0 0.45rem',
  borderRadius: themeVars.radius1,
  background: themeVars.infoSoft,
  color: themeVars.info,
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightSemibold,
});

export const tagRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space2,
});

export const mutedText = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
});

export const specList = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  borderTop: `1px solid ${themeVars.lineSoft}`,
  marginTop: themeVars.space1,
});

export const specRow = style({
  display: 'grid',
  gridTemplateColumns: '5.75rem minmax(0, 1fr)',
  gap: themeVars.space2,
  alignItems: 'center',
  minHeight: '1.9rem',
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

export const specLabel = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
});

export const specValue = style({
  color: themeVars.text,
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
  textAlign: 'right',
  overflowWrap: 'anywhere',
  minWidth: 0,
});

export const qrChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space1,
  padding: '0.15rem 0.45rem',
  borderRadius: themeVars.radius1,
  background: themeVars.infoSoft,
  color: themeVars.info,
  fontFamily: themeVars.fontMono,
  fontSize: themeVars.textSizeXs,
});

// Applied as a className on the Card component; head/body carry the padding.
export const section = style({
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
  minHeight: '3rem',
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

export const sectionBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  padding: themeVars.space4,
});

export const sectionEmpty = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
  textAlign: 'center',
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
});

export const compactCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
});

export const compactTitle = style({
  color: themeVars.ink,
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightSemibold,
});

export const compactSub = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeXs,
});

export const compactHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space2,
});

export const compactActions = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  flex: '0 0 auto',
});

export const timelineRow = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
  paddingBottom: themeVars.space2,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:last-child': {
      borderBottom: 0,
      paddingBottom: 0,
    },
  },
});

export const timelineTitle = style({
  color: themeVars.ink,
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightSemibold,
});

export const timelineMeta = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeXs,
});

export const warningText = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.2rem',
  color: themeVars.danger,
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightSemibold,
});

export const bottomBar = style({
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 20,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr auto',
  gap: themeVars.space2,
  padding: `${themeVars.space2} ${themeVars.space4} calc(${themeVars.space2} + env(safe-area-inset-bottom, 0px))`,
  borderTop: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  boxShadow: '0 -6px 18px rgba(17, 24, 39, 0.08)',
});

export const tagAddButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.75rem',
  height: '1.75rem',
  borderRadius: themeVars.radius2,
  color: themeVars.muted,
  border: `1px dashed ${themeVars.line}`,
  background: 'transparent',
  cursor: 'pointer',
});

export const dialogStack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
});

export const tagList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space2,
  alignItems: 'center',
});

export const tagRemove = style({
  display: 'inline-flex',
  alignItems: 'center',
  marginLeft: '0.2rem',
  color: themeVars.muted,
  background: 'transparent',
  border: 0,
  cursor: 'pointer',
  padding: 0,
});

export const inlineForm = style({
  display: 'flex',
  gap: themeVars.space2,
  alignItems: 'flex-end',
});

export const metadataValueButton = style({
  textAlign: 'left',
  padding: 0,
  background: 'none',
  border: 0,
  cursor: 'pointer',
  color: themeVars.muted,
  fontSize: themeVars.textSizeXs,
});

export const dialogActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
});
