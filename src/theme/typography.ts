export const fontSizes = {
  display: 34,
  heading1: 28,
  heading2: 24,
  heading3: 20,
  body: 16,
  bodySmall: 14,
  label: 13,
  caption: 12,
  button: 15,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeights = {
  display: 40,
  heading1: 34,
  heading2: 30,
  heading3: 26,
  body: 24,
  bodySmall: 20,
  label: 18,
  caption: 16,
  button: 20,
} as const;

export const typography = {
  display: { fontSize: fontSizes.display, lineHeight: lineHeights.display, fontWeight: fontWeights.bold },
  heading1: { fontSize: fontSizes.heading1, lineHeight: lineHeights.heading1, fontWeight: fontWeights.bold },
  heading2: { fontSize: fontSizes.heading2, lineHeight: lineHeights.heading2, fontWeight: fontWeights.semibold },
  heading3: { fontSize: fontSizes.heading3, lineHeight: lineHeights.heading3, fontWeight: fontWeights.semibold },
  body: { fontSize: fontSizes.body, lineHeight: lineHeights.body, fontWeight: fontWeights.regular },
  bodySmall: { fontSize: fontSizes.bodySmall, lineHeight: lineHeights.bodySmall, fontWeight: fontWeights.regular },
  label: { fontSize: fontSizes.label, lineHeight: lineHeights.label, fontWeight: fontWeights.semibold },
  caption: { fontSize: fontSizes.caption, lineHeight: lineHeights.caption, fontWeight: fontWeights.medium },
  button: { fontSize: fontSizes.button, lineHeight: lineHeights.button, fontWeight: fontWeights.semibold },
} as const;

