/**
 * Styling constants for PDF report generation using pdf-lib
 * Colors use 0-1 scale for pdf-lib's rgb() function
 */

// RGB color type for pdf-lib (0-1 scale)
export type RGBColor = { r: number; g: number; b: number };

// Helper to convert 0-255 to 0-1 scale
const toRgb = (r: number, g: number, b: number): RGBColor => ({
  r: r / 255,
  g: g / 255,
  b: b / 255,
});

export const PDF_STYLES = {
  // Page settings (A4 in points - pdf-lib uses points, 1 point = 1/72 inch)
  page: {
    width: 595.28, // A4 width in points
    height: 841.89, // A4 height in points
    margin: 42.52, // ~15mm in points
    contentWidth: 510.24, // width - 2*margin
  },

  // Colors (RGB 0-1 scale for pdf-lib)
  colors: {
    primary: toRgb(0, 102, 178), // HyperFinity blue
    secondary: toRgb(51, 51, 51), // Dark gray for text
    accent: toRgb(0, 153, 76), // Green for positive values
    muted: toRgb(128, 128, 128), // Gray for secondary text
    background: toRgb(245, 245, 245), // Light gray for boxes
    white: toRgb(255, 255, 255),
    highlightBg: toRgb(230, 244, 255), // Light blue for highlights
    // Confidence badges
    confidenceHigh: toRgb(34, 197, 94), // Green
    confidenceMedium: toRgb(251, 191, 36), // Amber
    confidenceLow: toRgb(239, 68, 68), // Red
  },

  // Typography (sizes in points)
  fonts: {
    title: { size: 24, style: "bold" as const },
    h1: { size: 16, style: "bold" as const },
    h2: { size: 13, style: "bold" as const },
    h3: { size: 11, style: "bold" as const },
    body: { size: 10, style: "normal" as const },
    small: { size: 8, style: "normal" as const },
    caption: { size: 9, style: "italic" as const },
  },

  // Spacing (in points)
  spacing: {
    sectionGap: 28, // ~10mm
    paragraphGap: 14, // ~5mm
    lineHeight: 1.4,
    tableRowHeight: 20, // ~7mm
  },
};

export type PDFColor = keyof typeof PDF_STYLES.colors;
export type ConfidenceLevel = "H" | "M" | "L";
