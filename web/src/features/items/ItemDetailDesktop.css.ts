import { globalStyle, style, styleVariants } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';
import { textStyles } from '../../styles/typography.css';

/*
 * Item detail page chrome (top bar, hero card, gallery, spec grid, location
 * route card, warranty documents, dialogs). The small content cards are
 * composed from the shared primitives in `styles/detail.css.ts` inside the
 * `DetailSection` shell.
 */

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  minWidth: 0,
});

export const errorText = style({
  color: themeVars.danger,
});

export const topBar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space4,
  padding: `${themeVars.space1} 0`,
  '@media': {
    '(max-width: 64em)': {
      alignItems: 'stretch',
      flexDirection: 'column',
    },
  },
});

export const breadcrumb = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space1,
  minWidth: 0,
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

globalStyle(`${breadcrumb} a`, {
  color: themeVars.muted,
  textDecoration: 'none',
});

globalStyle(`${breadcrumb} a:hover`, {
  color: themeVars.accentInk,
});

globalStyle(`${breadcrumb} [data-current]`, {
  color: themeVars.ink,
  fontWeight: themeVars.weightSemibold,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const topActions = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
  flexWrap: 'wrap',
});

export const heroCard = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(16rem, 0.9fr) minmax(28rem, 1.35fr) minmax(15rem, 0.7fr)',
  gap: 0,
  overflow: 'hidden',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
  '@media': {
    '(max-width: 86em)': {
      gridTemplateColumns: 'minmax(15rem, 0.9fr) minmax(0, 1.25fr)',
    },
    '(max-width: 64em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const gallery = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  padding: themeVars.space5,
  borderRight: `1px solid ${themeVars.lineSoft}`,
  minWidth: 0,
  '@media': {
    '(max-width: 64em)': {
      borderRight: 0,
      borderBottom: `1px solid ${themeVars.lineSoft}`,
    },
  },
});

export const mainPhoto = style({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  minHeight: '17rem',
  aspectRatio: '4 / 3',
  borderRadius: themeVars.radius2,
  background: `linear-gradient(180deg, ${themeVars.bgSoft}, ${themeVars.panel})`,
  overflow: 'hidden',
});

export const mainPhotoImg = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
});

export const photoEmpty = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: themeVars.space5,
  color: themeVars.muted,
  textAlign: 'center',
  fontSize: themeVars.textSizeSm,
});

globalStyle(`${photoEmpty} strong`, {
  color: themeVars.ink,
  fontSize: themeVars.textSizeMd,
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
  minWidth: 0,
  overflowX: 'auto',
  paddingBottom: themeVars.space1,
});

export const thumbButton = style({
  width: '3rem',
  height: '3rem',
  flex: '0 0 auto',
  overflow: 'hidden',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  padding: 0,
  cursor: 'pointer',
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
  width: '3rem',
  height: '3rem',
  flex: '0 0 auto',
  display: 'grid',
  placeItems: 'center',
  border: `1px dashed ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  color: themeVars.accentInk,
  cursor: 'pointer',
});

export const hiddenInput = style({
  display: 'none',
});

export const heroInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  padding: themeVars.space5,
  minWidth: 0,
});

export const titleRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: themeVars.space3,
});

export const title = textStyles.pageTitle;

export const badgeRow = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: themeVars.space2,
  marginTop: themeVars.space2,
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

export const iconBadge = style({
  width: '1.45rem',
  height: '1.45rem',
  display: 'inline-grid',
  placeItems: 'center',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.panel,
  color: themeVars.muted,
  cursor: 'pointer',
});

export const tagRow = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: themeVars.space2,
});

export const tagList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space2,
});

export const tagRemove = style({
  display: 'inline-grid',
  placeItems: 'center',
  width: '1rem',
  height: '1rem',
  border: 0,
  borderRadius: '999px',
  background: 'transparent',
  color: 'currentColor',
  cursor: 'pointer',
  padding: 0,
});

export const specGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: `${themeVars.space3} ${themeVars.space5}`,
  '@media': {
    '(max-width: 40em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const specCell = style({
  display: 'grid',
  gridTemplateColumns: '6rem minmax(0, 1fr)',
  gap: themeVars.space3,
  alignItems: 'baseline',
  minWidth: 0,
  selectors: {
    '&[data-span]': {
      gridColumn: '1 / -1',
    },
  },
});

export const specLabel = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
  whiteSpace: 'nowrap',
});

export const specValue = style({
  color: themeVars.text,
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
  minWidth: 0,
  overflowWrap: 'anywhere',
});

export const inlineCode = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space1,
  padding: '0.15rem 0.45rem',
  borderRadius: themeVars.radius1,
  background: themeVars.infoSoft,
  color: themeVars.info,
  fontFamily: themeVars.fontMono,
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightBold,
});

export const copyButton = style({
  border: 0,
  background: 'transparent',
  color: 'currentColor',
  padding: 0,
  display: 'inline-grid',
  placeItems: 'center',
  cursor: 'pointer',
});

export const locationCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  padding: themeVars.space5,
  borderLeft: `1px solid ${themeVars.lineSoft}`,
  minWidth: 0,
  '@media': {
    '(max-width: 86em)': {
      gridColumn: '1 / -1',
      borderLeft: 0,
      borderTop: `1px solid ${themeVars.lineSoft}`,
    },
  },
});

export const cardTitleRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
});

export const cardTitle = style({
  margin: 0,
  color: themeVars.ink,
  fontSize: themeVars.textSizeMd,
  fontWeight: themeVars.weightSemibold,
});

export const routeList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
});

export const routeItem = style({
  display: 'grid',
  gridTemplateColumns: '1.65rem minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: themeVars.space2,
  minHeight: '2rem',
  padding: `0 ${themeVars.space2}`,
  borderRadius: themeVars.radius1,
  color: themeVars.text,
  fontSize: themeVars.textSizeSm,
  selectors: {
    '&[data-current]': {
      background: themeVars.infoSoft,
      color: themeVars.info,
      fontWeight: themeVars.weightSemibold,
    },
  },
});

export const routeIcon = style({
  display: 'inline-grid',
  placeItems: 'center',
  color: 'currentColor',
});

export const routeCode = style({
  color: themeVars.info,
  fontFamily: themeVars.fontMono,
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightBold,
});

export const blockLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space1,
  minHeight: '2.2rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  color: themeVars.info,
  textDecoration: 'none',
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
    },
  },
});

// Main column (wide content) and rail column (compact meta): both stack
// cards in a single column so the reading order matches the visual order.
export const contentGrid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 20rem',
  gap: themeVars.space4,
  alignItems: 'start',
  '@media': {
    '(max-width: 78em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const mainColumn = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  minWidth: 0,
});

export const railColumn = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  minWidth: 0,
});

// Warranty summary text tone, keyed by getWarrantyView tones (neutral→info).
export const warrantySummary = styleVariants({
  success: { color: themeVars.success },
  warning: { color: themeVars.warning },
  danger: { color: themeVars.danger },
  info: { color: themeVars.muted },
});

export const rowActions = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
});

// Stack wrapper for external ReminderRow rows, which carry their own borders.
export const taskList = style({
  display: 'flex',
  flexDirection: 'column',
});

export const stockHero = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: themeVars.space2,
  color: themeVars.muted,
});

export const stockValue = textStyles.metricLg;

export const warningText = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.2rem',
  color: themeVars.warningText,
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightSemibold,
});

export const dialogStack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
});

export const inlineForm = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: themeVars.space2,
  alignItems: 'end',
  '@media': {
    '(max-width: 38em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const dialogActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
});
