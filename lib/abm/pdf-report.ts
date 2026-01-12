import {
  PDFDocument,
  PDFFont,
  PDFPage,
  rgb,
  StandardFonts,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { branding } from "@/lib/branding";
import { type ConfidenceLevel, PDF_STYLES, type RGBColor } from "./pdf-report-styles";

// Type for the ABM Pack output - using loose typing to handle various formats
type AbmPackData = Record<string, unknown>;

type GeneratePdfReportOptions = {
  data: AbmPackData;
  infographicBase64?: string | null;
};

type FontSet = {
  regular: PDFFont;
  bold: PDFFont;
};

type RenderContext = {
  pdfDoc: PDFDocument;
  page: PDFPage;
  fonts: FontSet;
  currentY: number;
  addPage: () => PDFPage;
  checkPageBreak: (requiredHeight: number) => boolean;
};

// ============================================================================
// Main Export Function
// ============================================================================

export async function generateAbmPackPdfReport(
  options: GeneratePdfReportOptions
): Promise<Uint8Array> {
  const { data, infographicBase64 } = options;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Load fonts
  const fonts = await loadFonts(pdfDoc);

  // Load logo
  const logoBytes = await loadLogoBytes();

  let page = pdfDoc.addPage([PDF_STYLES.page.width, PDF_STYLES.page.height]);
  let currentY = PDF_STYLES.page.height - PDF_STYLES.page.margin;

  const addPage = (): PDFPage => {
    page = pdfDoc.addPage([PDF_STYLES.page.width, PDF_STYLES.page.height]);
    currentY = PDF_STYLES.page.height - PDF_STYLES.page.margin;
    return page;
  };

  const checkPageBreak = (requiredHeight: number): boolean => {
    if (currentY - requiredHeight < PDF_STYLES.page.margin) {
      addPage();
      return true;
    }
    return false;
  };

  const ctx: RenderContext = {
    pdfDoc,
    page,
    fonts,
    currentY,
    addPage,
    checkPageBreak,
  };

  // === PAGE 1: Infographic Cover (if available) ===
  if (infographicBase64) {
    await renderInfographicCover(ctx, data, infographicBase64);
    ctx.page = addPage();
    ctx.currentY = currentY;
  }

  // === Title Page ===
  await renderCoverPage(ctx, data, logoBytes);

  // === PAGE 2: Executive Summary ===
  ctx.page = addPage();
  ctx.currentY = currentY;
  currentY = renderExecutiveSummary(ctx, data);
  ctx.currentY = currentY;

  // === Brand Intake ===
  const brandIntake = data.brandIntake as Record<string, unknown> | undefined;
  if (brandIntake && Object.keys(brandIntake).length > 0) {
    checkPageBreak(170);
    currentY = renderBrandIntake(ctx, brandIntake);
    ctx.currentY = currentY;
  }

  // === Research ===
  const research = data.research as Record<string, unknown> | undefined;
  if (research && Object.keys(research).length > 0) {
    ctx.page = addPage();
    ctx.currentY = PDF_STYLES.page.height - PDF_STYLES.page.margin;
    currentY = ctx.currentY;
    currentY = renderResearch(ctx, research);
    ctx.currentY = currentY;
  }

  // === Value Case (from outputs) ===
  const outputs = data.outputs as Record<string, unknown> | undefined;
  if (outputs?.slide4ValueCaseTable) {
    ctx.page = addPage();
    ctx.currentY = PDF_STYLES.page.height - PDF_STYLES.page.margin;
    currentY = ctx.currentY;
    currentY = renderValueCase(ctx, outputs);
    ctx.currentY = currentY;
  }

  // === Modelling ===
  const modelling = data.modelling as Record<string, unknown> | undefined;
  if (modelling && Object.keys(modelling).length > 0) {
    checkPageBreak(230);
    currentY = renderModelling(ctx, modelling);
    ctx.currentY = currentY;
  }

  // === Appendices ===
  const appendices = data.appendices as Record<string, unknown> | undefined;
  if (appendices && Object.keys(appendices).length > 0) {
    ctx.page = addPage();
    ctx.currentY = PDF_STYLES.page.height - PDF_STYLES.page.margin;
    currentY = ctx.currentY;
    currentY = renderAppendices(ctx, appendices);
    ctx.currentY = currentY;
  }

  // Add page numbers to all pages (skip the first page if it's the infographic cover)
  addPageNumbers(pdfDoc, fonts, !!infographicBase64);

  return pdfDoc.save();
}

// ============================================================================
// Font & Asset Loaders
// ============================================================================

async function loadFonts(pdfDoc: PDFDocument): Promise<FontSet> {
  // Use standard Helvetica for consistent rendering (avoids ligature issues)
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  return { regular, bold };
}

async function loadLogoBytes(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch("/images/hyperfinity-logo-dark.png");
    return response.arrayBuffer();
  } catch {
    return null;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse a markdown table into structured data
 */
function parseMarkdownTable(
  markdown: string
): { headers: string[]; rows: string[][] } | null {
  const lines = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2 || !lines[0].includes("|")) return null;

  const headers = lines[0]
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);

  // Skip separator line (usually contains ---)
  const dataLines = lines.slice(2);
  const rows: string[][] = [];

  for (const line of dataLines) {
    if (!line.includes("|")) continue;
    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);
    if (cells.length > 0) rows.push(cells);
  }

  if (headers.length === 0 || rows.length === 0) return null;
  return { headers, rows };
}

function sanitizeText(text: string): string {
  return text
    // Replace newlines and carriage returns with spaces
    .replace(/[\r\n]+/g, " ")
    // Replace smart quotes with straight quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Replace various dashes with hyphen
    .replace(/[\u2013\u2014\u2011]/g, "-")
    // Replace ellipsis with three dots
    .replace(/\u2026/g, "...")
    // Replace non-breaking space with regular space
    .replace(/\u00A0/g, " ")
    // Replace bullet point with asterisk
    .replace(/\u2022/g, "*")
    // Remove zero-width characters
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // Collapse multiple spaces into one
    .replace(/\s+/g, " ")
    .trim();
}

function toRgb(color: RGBColor) {
  return rgb(color.r, color.g, color.b);
}

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const sanitized = sanitizeText(text);
  const words = sanitized.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

function renderConfidenceBadge(
  page: PDFPage,
  fonts: FontSet,
  level: ConfidenceLevel | string,
  x: number,
  y: number
): number {
  const labels: Record<string, string> = { H: "HIGH", M: "MEDIUM", L: "LOW" };
  const colors = {
    H: PDF_STYLES.colors.confidenceHigh,
    M: PDF_STYLES.colors.confidenceMedium,
    L: PDF_STYLES.colors.confidenceLow,
  };

  const normalizedLevel = level.toUpperCase().charAt(0) as "H" | "M" | "L";
  const label = labels[normalizedLevel] || String(level);
  const color = colors[normalizedLevel] || colors.L;

  const fontSize = 6;
  const textWidth = fonts.regular.widthOfTextAtSize(label, fontSize);
  const badgeWidth = textWidth + 8;
  const badgeHeight = 10;

  // Draw badge background
  page.drawRectangle({
    x,
    y: y - 2,
    width: badgeWidth,
    height: badgeHeight,
    color: toRgb(color),
  });

  // Draw text
  page.drawText(label, {
    x: x + 4,
    y: y + 1,
    size: fontSize,
    font: fonts.regular,
    color: toRgb(PDF_STYLES.colors.white),
  });

  return badgeWidth;
}

function renderKeyValue(
  ctx: RenderContext,
  key: string,
  value: string | number | null | undefined,
  x: number,
  y: number,
  confidence?: ConfidenceLevel | string
): number {
  if (value === null || value === undefined || value === "") return y;

  const { page, fonts } = ctx;
  const { fonts: fontStyles, page: pageStyles } = PDF_STYLES;

  const fontSize = fontStyles.body.size;
  const keyText = `${key}: `;
  const keyWidth = fonts.bold.widthOfTextAtSize(keyText, fontSize);

  // Draw key (bold)
  page.drawText(keyText, {
    x,
    y,
    size: fontSize,
    font: fonts.bold,
    color: toRgb(PDF_STYLES.colors.secondary),
  });

  // Handle long values with text wrapping
  const maxWidth = pageStyles.contentWidth - keyWidth - (confidence ? 60 : 10);
  const lines = wrapText(String(value), fonts.regular, fontSize, maxWidth);

  // Draw value lines
  let lineY = y;
  for (const line of lines) {
    page.drawText(line, {
      x: x + keyWidth,
      y: lineY,
      size: fontSize,
      font: fonts.regular,
      color: toRgb(PDF_STYLES.colors.secondary),
    });
    lineY -= fontSize * PDF_STYLES.spacing.lineHeight;
  }

  // Add confidence badge if provided
  if (confidence) {
    const badgeX = pageStyles.width - pageStyles.margin - 50;
    renderConfidenceBadge(page, fonts, confidence, badgeX, y);
  }

  return y - lines.length * fontSize * PDF_STYLES.spacing.lineHeight - 4;
}

function renderSectionHeader(
  ctx: RenderContext,
  title: string,
  y: number,
  level: 1 | 2 | 3 = 1
): number {
  const { page, fonts } = ctx;
  const fontConfigs = {
    1: PDF_STYLES.fonts.h1,
    2: PDF_STYLES.fonts.h2,
    3: PDF_STYLES.fonts.h3,
  };
  const font = fontConfigs[level];
  const safeTitle = sanitizeText(title);

  page.drawText(safeTitle, {
    x: PDF_STYLES.page.margin,
    y,
    size: font.size,
    font: fonts.bold,
    color: toRgb(PDF_STYLES.colors.primary),
  });

  // Underline for h1
  if (level === 1) {
    const textWidth = fonts.bold.widthOfTextAtSize(safeTitle, font.size);
    page.drawLine({
      start: { x: PDF_STYLES.page.margin, y: y - 3 },
      end: { x: PDF_STYLES.page.margin + textWidth, y: y - 3 },
      thickness: 1,
      color: toRgb(PDF_STYLES.colors.primary),
    });
  }

  return y - PDF_STYLES.spacing.sectionGap;
}

function renderParagraph(
  ctx: RenderContext,
  text: string,
  x: number,
  y: number,
  maxWidth: number
): number {
  const { page, fonts } = ctx;
  const fontSize = PDF_STYLES.fonts.body.size;

  const lines = wrapText(text, fonts.regular, fontSize, maxWidth);
  let lineY = y;

  for (const line of lines) {
    page.drawText(line, {
      x,
      y: lineY,
      size: fontSize,
      font: fonts.regular,
      color: toRgb(PDF_STYLES.colors.secondary),
    });
    lineY -= fontSize * PDF_STYLES.spacing.lineHeight;
  }

  return lineY - PDF_STYLES.spacing.paragraphGap;
}

/**
 * Render a parsed markdown table with basic formatting
 */
function renderParsedTable(
  ctx: RenderContext,
  tableData: { headers: string[]; rows: string[][] },
  y: number
): number {
  const { page, fonts, checkPageBreak } = ctx;
  const { page: pageStyles, fonts: fontStyles, colors, spacing } = PDF_STYLES;

  const { headers, rows } = tableData;
  const fontSize = fontStyles.small.size;
  const lineHeight = fontSize * 1.3;

  // Basic equal-width columns across the available content width
  const numCols = headers.length;
  const colWidth = pageStyles.contentWidth / numCols;

  // Header background
  page.drawRectangle({
    x: pageStyles.margin,
    y: y - 12,
    width: pageStyles.contentWidth,
    height: 16,
    color: toRgb(colors.background),
  });

  // Render headers
  let xPos = pageStyles.margin + 3;
  for (const header of headers) {
    page.drawText(header, {
      x: xPos,
      y: y - 8,
      size: fontSize,
      font: fonts.bold,
      color: toRgb(colors.secondary),
    });
    xPos += colWidth;
  }

  y -= 22;

  // Render rows
  for (const row of rows) {
    checkPageBreak(40);
    let cellX = pageStyles.margin + 3;
    let maxLines = 1;

    const wrappedCells = row.map((cell) =>
      wrapText(cell, fonts.regular, fontSize, colWidth - 6)
    );
    for (const lines of wrappedCells) {
      maxLines = Math.max(maxLines, lines.length);
    }

    for (let i = 0; i < wrappedCells.length; i++) {
      let cellY = y;
      for (const line of wrappedCells[i]) {
        page.drawText(line, {
          x: cellX,
          y: cellY,
          size: fontSize,
          font: fonts.regular,
          color: toRgb(colors.secondary),
        });
        cellY -= lineHeight;
      }
      cellX += colWidth;
    }

    y -= maxLines * lineHeight + spacing.paragraphGap;
  }

  return y - spacing.sectionGap;
}

// ============================================================================
// Section Renderers
// ============================================================================

async function renderCoverPage(
  ctx: RenderContext,
  data: AbmPackData,
  logoBytes: ArrayBuffer | null
): Promise<void> {
  const { pdfDoc, page, fonts } = ctx;
  const { page: pageStyles, fonts: fontStyles, colors } = PDF_STYLES;
  const centerX = pageStyles.width / 2;

  // Logo (centered, top)
  if (logoBytes) {
    try {
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const logoWidth = 170;
      const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
      page.drawImage(logoImage, {
        x: centerX - logoWidth / 2,
        y: pageStyles.height - 120,
        width: logoWidth,
        height: logoHeight,
      });
    } catch {
      // Logo load failed, continue without it
    }
  }

  // Brand name
  const brandIntake = data.brandIntake as Record<string, unknown> | undefined;
  const brandName = sanitizeText((brandIntake?.brand as string) || "Value Case Report");
  const brandNameWidth = fonts.bold.widthOfTextAtSize(
    brandName,
    fontStyles.title.size
  );
  page.drawText(brandName, {
    x: centerX - brandNameWidth / 2,
    y: pageStyles.height - 200,
    size: fontStyles.title.size,
    font: fonts.bold,
    color: toRgb(colors.primary),
  });

  // Subtitle
  const subtitle = sanitizeText("Strategic Value Case Report");
  const subtitleWidth = fonts.regular.widthOfTextAtSize(
    subtitle,
    fontStyles.h1.size
  );
  page.drawText(subtitle, {
    x: centerX - subtitleWidth / 2,
    y: pageStyles.height - 235,
    size: fontStyles.h1.size,
    font: fonts.regular,
    color: toRgb(colors.secondary),
  });

  // Horizontal line
  page.drawLine({
    start: { x: 140, y: pageStyles.height - 260 },
    end: { x: pageStyles.width - 140, y: pageStyles.height - 260 },
    thickness: 2,
    color: toRgb(colors.primary),
  });

  // Metadata
  const category = (brandIntake?.category as string) || "";
  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (category) {
    const categoryText = sanitizeText(`Category: ${category}`);
    const categoryWidth = fonts.regular.widthOfTextAtSize(
      categoryText,
      fontStyles.body.size
    );
    page.drawText(categoryText, {
      x: centerX - categoryWidth / 2,
      y: pageStyles.height - 310,
      size: fontStyles.body.size,
      font: fonts.regular,
      color: toRgb(colors.secondary),
    });
  }

  const dateText = sanitizeText(`Generated: ${date}`);
  const dateWidth = fonts.regular.widthOfTextAtSize(
    dateText,
    fontStyles.body.size
  );
  page.drawText(dateText, {
    x: centerX - dateWidth / 2,
    y: pageStyles.height - 330,
    size: fontStyles.body.size,
    font: fonts.regular,
    color: toRgb(colors.secondary),
  });

  // Footer branding
  const footerText = sanitizeText(`Prepared by ${branding.brandName}`);
  const footerWidth = fonts.regular.widthOfTextAtSize(
    footerText,
    fontStyles.small.size
  );
  page.drawText(footerText, {
    x: centerX - footerWidth / 2,
    y: 50,
    size: fontStyles.small.size,
    font: fonts.regular,
    color: toRgb(colors.muted),
  });
}

function renderExecutiveSummary(ctx: RenderContext, data: AbmPackData): number {
  const { page, fonts } = ctx;
  const { page: pageStyles, fonts: fontStyles, colors, spacing } = PDF_STYLES;
  let y = ctx.currentY;

  y = renderSectionHeader(ctx, "Executive Summary", y, 1);

  const outputs = data.outputs as Record<string, unknown> | undefined;

  // Executive one-liner (highlighted box)
  const oneLiner = outputs?.executiveOneLiner as string | undefined;
  if (oneLiner) {
    const lines = wrapText(
      oneLiner,
      fonts.bold,
      fontStyles.h3.size,
      pageStyles.contentWidth - 20
    );
    const boxHeight = Math.max(40, lines.length * 16 + 20);

    // Draw highlighted background
    page.drawRectangle({
      x: pageStyles.margin,
      y: y - boxHeight + 10,
      width: pageStyles.contentWidth,
      height: boxHeight,
      color: toRgb(colors.highlightBg),
    });

    // Draw text lines
    let lineY = y - 8;
    for (const line of lines) {
      page.drawText(line, {
        x: pageStyles.margin + 10,
        y: lineY,
        size: fontStyles.h3.size,
        font: fonts.bold,
        color: toRgb(colors.primary),
      });
      lineY -= 16;
    }

    y -= boxHeight + spacing.sectionGap;
  }

  // CFO Readiness Panel
  const panel = outputs?.cfoReadinessPanel as
    | Record<string, unknown>
    | undefined;
  if (panel) {
    y = renderSectionHeader(ctx, "CFO Readiness Panel", y, 2);

    if (panel.blendedGMPercentUsed !== undefined && panel.blendedGMPercentUsed !== null) {
      y = renderKeyValue(
        ctx,
        "Blended GM %",
        `${panel.blendedGMPercentUsed}%`,
        pageStyles.margin,
        y
      );
    }
    y = renderKeyValue(
      ctx,
      "GM Source",
      panel.blendedGMSourceOrProxy as string,
      pageStyles.margin,
      y
    );
    y = renderKeyValue(
      ctx,
      "Brand Type",
      panel.brandType as string,
      pageStyles.margin,
      y
    );
    y = renderKeyValue(
      ctx,
      "Value Case Mode",
      panel.valueCaseMode as string,
      pageStyles.margin,
      y
    );

    // Data confidence badges
    const conf = panel.dataConfidence as Record<string, string> | undefined;
    if (conf) {
      y -= spacing.paragraphGap;

      page.drawText("Data Confidence:", {
        x: pageStyles.margin,
        y,
        size: fontStyles.body.size,
        font: fonts.bold,
        color: toRgb(colors.secondary),
      });
      y -= 14;

      let badgeX = pageStyles.margin;
      for (const key of ["revenue", "loyalty", "aov", "frequency"]) {
        const level = conf[key];
        if (level) {
          const label = `${key.charAt(0).toUpperCase() + key.slice(1)}:`;
          page.drawText(label, {
            x: badgeX,
            y,
            size: fontStyles.small.size,
            font: fonts.regular,
            color: toRgb(colors.secondary),
          });
          badgeX += fonts.regular.widthOfTextAtSize(label, fontStyles.small.size) + 4;
          badgeX += renderConfidenceBadge(page, fonts, level, badgeX, y) + 16;
        }
      }
      y -= spacing.sectionGap;
    }
  }

  // Executive Summary narrative
  const summary = outputs?.executiveSummary as string | undefined;
  if (summary) {
    y = renderSectionHeader(ctx, "Strategic Overview", y, 2);
    y = renderParagraph(ctx, summary, pageStyles.margin, y, pageStyles.contentWidth);
  }

  return y - spacing.sectionGap;
}

function renderBrandIntake(
  ctx: RenderContext,
  brandIntake: Record<string, unknown>
): number {
  const { page: pageStyles, spacing } = PDF_STYLES;
  let y = ctx.currentY;

  ctx.checkPageBreak(140);
  y = renderSectionHeader(ctx, "Brand Intake", y, 1);

  const fields: [string, string][] = [
    ["Brand", brandIntake.brand as string],
    ["Website", brandIntake.website as string],
    ["Registry Link", brandIntake.registryLink as string],
    ["Category", brandIntake.category as string],
    ["Brand Type", formatBrandType(brandIntake.brandType as string)],
  ];

  for (const [label, value] of fields) {
    if (value) {
      y = renderKeyValue(ctx, label, value, pageStyles.margin, y);
    }
  }

  const notes = brandIntake.contextualNotes as string | undefined;
  if (notes) {
    y -= spacing.paragraphGap;
    y = renderSectionHeader(ctx, "Additional Context", y, 3);
    y = renderParagraph(ctx, notes, pageStyles.margin, y, pageStyles.contentWidth);
  }

  return y - spacing.sectionGap;
}

function renderResearch(
  ctx: RenderContext,
  research: Record<string, unknown>
): number {
  const { page: pageStyles, spacing } = PDF_STYLES;
  let y = ctx.currentY;

  y = renderSectionHeader(ctx, "Research Findings", y, 1);

  // Handle both flat schema and nested mock data format
  if (research.financials || research.latestAnnualRevenue) {
    y = renderResearchFinancials(ctx, research, y);
  }

  if (research.loyaltyProgramme || research.loyaltyProgrammeDetails) {
    ctx.checkPageBreak(170);
    y = renderResearchLoyalty(ctx, research, y);
  }

  if (research.benchmarks || research.aovBenchmark) {
    ctx.checkPageBreak(115);
    y = renderResearchBenchmarks(ctx, research, y);
  }

  if (
    research.techStack ||
    research.paidMediaAndChannels ||
    research.paidMediaChannels
  ) {
    ctx.checkPageBreak(115);
    y = renderResearchTech(ctx, research, y);
  }

  // Research sources
  const sources = research.researchSources as
    | Record<string, unknown>[]
    | undefined;
  if (sources && sources.length > 0) {
    ctx.checkPageBreak(140);
    y = renderResearchSources(ctx, sources, y);
  }

  return y - spacing.sectionGap;
}

function renderResearchFinancials(
  ctx: RenderContext,
  research: Record<string, unknown>,
  y: number
): number {
  const { page: pageStyles } = PDF_STYLES;

  ctx.checkPageBreak(115);
  y = renderSectionHeader(ctx, "Financial Data", y, 2);

  // Nested format (mock data)
  const financials = research.financials as Record<string, unknown> | undefined;
  if (financials) {
    const revenue = financials.totalRevenue as
      | Record<string, unknown>
      | undefined;
    if (revenue) {
      y = renderKeyValue(
        ctx,
        "Total Revenue",
        `$${revenue.valueUSD}M (${financials.latestFiscalYear || "Latest"})`,
        pageStyles.margin,
        y,
        revenue.confidence as string
      );
    }
    const gm = financials.grossMarginPercent as
      | Record<string, unknown>
      | undefined;
    if (gm) {
      y = renderKeyValue(
        ctx,
        "Gross Margin",
        `${gm.value}%`,
        pageStyles.margin,
        y,
        gm.confidence as string
      );
    }
  } else {
    // Flat schema format
    if (research.latestAnnualRevenue) {
      y = renderKeyValue(
        ctx,
        "Annual Revenue",
        research.latestAnnualRevenue as string,
        pageStyles.margin,
        y
      );
    }
    if (research.latestAnnualRevenueSource) {
      y = renderKeyValue(
        ctx,
        "Revenue Source",
        research.latestAnnualRevenueSource as string,
        pageStyles.margin,
        y
      );
    }
    if (research.blendedGrossMarginPercent !== undefined) {
      y = renderKeyValue(
        ctx,
        "Blended Gross Margin",
        `${research.blendedGrossMarginPercent}%`,
        pageStyles.margin,
        y
      );
    }
    if (research.blendedGrossMarginSource) {
      y = renderKeyValue(
        ctx,
        "GM Source",
        research.blendedGrossMarginSource as string,
        pageStyles.margin,
        y
      );
    }
  }

  return y - PDF_STYLES.spacing.paragraphGap;
}

function renderResearchLoyalty(
  ctx: RenderContext,
  research: Record<string, unknown>,
  y: number
): number {
  const { page, fonts } = ctx;
  const { page: pageStyles, fonts: fontStyles, spacing, colors } = PDF_STYLES;

  y = renderSectionHeader(ctx, "Loyalty Programme", y, 2);

  // Nested format
  const loyalty = research.loyaltyProgramme as
    | Record<string, unknown>
    | undefined;
  if (loyalty) {
    if (loyalty.name) {
      y = renderKeyValue(
        ctx,
        "Programme Name",
        loyalty.name as string,
        pageStyles.margin,
        y
      );
    }
    const launch = loyalty.launchDate as Record<string, unknown> | undefined;
    if (launch?.approx) {
      y = renderKeyValue(
        ctx,
        "Launch Date",
        launch.approx as string,
        pageStyles.margin,
        y,
        launch.confidence as string
      );
    }
    const scale = loyalty.penetrationAndScale as
      | Record<string, unknown>
      | undefined;
    if (scale?.activeMembers) {
      const members = scale.activeMembers as Record<string, unknown>;
      y = renderKeyValue(
        ctx,
        "Active Members",
        `${members.value}M`,
        pageStyles.margin,
        y,
        members.confidence as string
      );
    }
    const benefits = loyalty.coreBenefits as string[] | undefined;
    if (benefits && benefits.length > 0) {
      y -= spacing.paragraphGap;

      page.drawText("Core Benefits:", {
        x: pageStyles.margin,
        y,
        size: fontStyles.body.size,
        font: fonts.bold,
        color: toRgb(colors.secondary),
      });
      y -= 14;

      for (const benefit of benefits.slice(0, 5)) {
        ctx.checkPageBreak(20);
        const lines = wrapText(
          `• ${benefit}`,
          fonts.regular,
          fontStyles.body.size,
          pageStyles.contentWidth - 10
        );
        for (const line of lines) {
          page.drawText(line, {
            x: pageStyles.margin + 8,
            y,
            size: fontStyles.body.size,
            font: fonts.regular,
            color: toRgb(colors.secondary),
          });
          y -= 12;
        }
      }
    }
  } else {
    // Flat schema format
    if (research.loyaltyProgrammeDetails) {
      y = renderKeyValue(
        ctx,
        "Details",
        research.loyaltyProgrammeDetails as string,
        pageStyles.margin,
        y
      );
    }
    if (research.loyaltyProgrammePenetration) {
      y = renderKeyValue(
        ctx,
        "Penetration",
        research.loyaltyProgrammePenetration as string,
        pageStyles.margin,
        y
      );
    }
    if (research.loyaltyProgrammeLaunchDate) {
      y = renderKeyValue(
        ctx,
        "Launch Date",
        research.loyaltyProgrammeLaunchDate as string,
        pageStyles.margin,
        y
      );
    }
    if (research.activeLoyaltyMembers) {
      y = renderKeyValue(
        ctx,
        "Active Members",
        research.activeLoyaltyMembers as string,
        pageStyles.margin,
        y
      );
    }
    if (research.loyaltyProgrammeBenefits) {
      y = renderKeyValue(
        ctx,
        "Benefits",
        research.loyaltyProgrammeBenefits as string,
        pageStyles.margin,
        y
      );
    }
  }

  return y - spacing.paragraphGap;
}

function renderResearchBenchmarks(
  ctx: RenderContext,
  research: Record<string, unknown>,
  y: number
): number {
  const { page: pageStyles } = PDF_STYLES;

  y = renderSectionHeader(ctx, "Category Benchmarks", y, 2);

  // Nested format
  const benchmarks = research.benchmarks as Record<string, unknown> | undefined;
  if (benchmarks) {
    const aov = benchmarks.aov as Record<string, unknown> | undefined;
    if (aov) {
      y = renderKeyValue(
        ctx,
        "AOV",
        `$${aov.valueUSD}`,
        pageStyles.margin,
        y,
        aov.confidence as string
      );
    }
    const freq = benchmarks.purchaseFrequency as
      | Record<string, unknown>
      | undefined;
    if (freq) {
      y = renderKeyValue(
        ctx,
        "Purchase Frequency",
        `${freq.value} orders/year`,
        pageStyles.margin,
        y,
        freq.confidence as string
      );
    }
  } else {
    // Flat format
    if (research.aovBenchmark) {
      y = renderKeyValue(
        ctx,
        "AOV Benchmark",
        research.aovBenchmark as string,
        pageStyles.margin,
        y
      );
    }
    if (research.purchaseFrequencyBenchmark) {
      y = renderKeyValue(
        ctx,
        "Purchase Frequency",
        research.purchaseFrequencyBenchmark as string,
        pageStyles.margin,
        y
      );
    }
  }

  return y - PDF_STYLES.spacing.paragraphGap;
}

function renderResearchTech(
  ctx: RenderContext,
  research: Record<string, unknown>,
  y: number
): number {
  const { page: pageStyles } = PDF_STYLES;

  y = renderSectionHeader(ctx, "Tech & Media Stack", y, 2);

  // Paid media channels
  const paidMedia = research.paidMediaAndChannels as
    | Record<string, unknown>
    | undefined;
  if (paidMedia?.paidMediaChannels) {
    const channels = paidMedia.paidMediaChannels as Record<string, unknown>;
    const list = channels.list as string[] | undefined;
    if (list) {
      y = renderKeyValue(
        ctx,
        "Paid Media",
        list.slice(0, 3).join("; "),
        pageStyles.margin,
        y,
        channels.confidence as string
      );
    }
  } else if (research.paidMediaChannels) {
    y = renderKeyValue(
      ctx,
      "Paid Media",
      research.paidMediaChannels as string,
      pageStyles.margin,
      y
    );
  }

  // Tech stack
  const techStack = research.techStack as
    | Record<string, unknown>
    | string
    | undefined;
  if (typeof techStack === "string") {
    y = renderKeyValue(ctx, "Tech Stack", techStack, pageStyles.margin, y);
  } else if (techStack) {
    const commerce = techStack.commerce as Record<string, unknown> | undefined;
    if (commerce?.platform) {
      y = renderKeyValue(
        ctx,
        "Commerce",
        commerce.platform as string,
        pageStyles.margin,
        y,
        commerce.confidence as string
      );
    }
  }

  return y - PDF_STYLES.spacing.paragraphGap;
}

function renderResearchSources(
  ctx: RenderContext,
  sources: Record<string, unknown>[],
  y: number
): number {
  const { page, fonts } = ctx;
  const { page: pageStyles, fonts: fontStyles, colors } = PDF_STYLES;

  y = renderSectionHeader(ctx, "Research Sources", y, 2);

  for (const source of sources.slice(0, 10)) {
    ctx.checkPageBreak(28);
    const text = `• ${source.dataPoint}: ${source.sourceName} [${source.confidenceLevel}]`;
    const lines = wrapText(
      text,
      fonts.regular,
      fontStyles.small.size,
      pageStyles.contentWidth - 10
    );

    for (const line of lines) {
      page.drawText(line, {
        x: pageStyles.margin + 5,
        y,
        size: fontStyles.small.size,
        font: fonts.regular,
        color: toRgb(colors.secondary),
      });
      y -= 10;
    }
  }

  if (sources.length > 10) {
    page.drawText(`... and ${sources.length - 10} more sources`, {
      x: pageStyles.margin + 5,
      y,
      size: fontStyles.small.size,
      font: fonts.regular,
      color: toRgb(colors.muted),
    });
    y -= 14;
  }

  return y;
}

function renderValueCase(
  ctx: RenderContext,
  outputs: Record<string, unknown>
): number {
  const { page, fonts } = ctx;
  const { page: pageStyles, fonts: fontStyles, spacing, colors } = PDF_STYLES;
  let y = ctx.currentY;

  y = renderSectionHeader(ctx, "Value Case", y, 1);

  const valueTable = outputs.slide4ValueCaseTable as
    | Record<string, unknown>
    | undefined;
  if (!valueTable) return y;

  // Get rows from either 'rows' or 'table' property
  const rows = (valueTable.rows || valueTable.table) as
    | Record<string, unknown>[]
    | undefined;

  if (rows && rows.length > 0) {
    // Table header background
    page.drawRectangle({
      x: pageStyles.margin,
      y: y - 14,
      width: pageStyles.contentWidth,
      height: 20,
      color: toRgb(colors.background),
    });

    // Table headers
    page.drawText("Area of Impact", {
      x: pageStyles.margin + 5,
      y: y - 10,
      size: fontStyles.small.size,
      font: fonts.bold,
      color: toRgb(colors.secondary),
    });
    page.drawText("Opportunity", {
      x: pageStyles.margin + 160,
      y: y - 10,
      size: fontStyles.small.size,
      font: fonts.bold,
      color: toRgb(colors.secondary),
    });
    page.drawText("GM Uplift", {
      x: pageStyles.margin + 350,
      y: y - 10,
      size: fontStyles.small.size,
      font: fonts.bold,
      color: toRgb(colors.secondary),
    });

    y -= 30;

    // Table rows
    for (const row of rows) {
      ctx.checkPageBreak(42);

      const area = String(row.areaOfImpact || "").substring(0, 50);
      const opp = String(row.opportunityType || "").substring(0, 40);
      const uplift = row.estimatedUpliftGM;
      const upliftStr =
        typeof uplift === "number"
          ? `$${uplift.toFixed(1)}M`
          : String(uplift || "");

      page.drawText(area, {
        x: pageStyles.margin + 5,
        y,
        size: fontStyles.small.size,
        font: fonts.regular,
        color: toRgb(colors.secondary),
      });
      page.drawText(opp, {
        x: pageStyles.margin + 160,
        y,
        size: fontStyles.small.size,
        font: fonts.regular,
        color: toRgb(colors.secondary),
      });
      page.drawText(upliftStr, {
        x: pageStyles.margin + 350,
        y,
        size: fontStyles.small.size,
        font: fonts.regular,
        color: toRgb(colors.secondary),
      });

      // Methodology (if present)
      const methodology = row.assumptionsMethodology as string | undefined;
      if (methodology) {
        y -= 14;
        const methodLines = wrapText(
          methodology,
          fonts.regular,
          7,
          pageStyles.contentWidth - 20
        );
        for (const line of methodLines.slice(0, 3)) {
          page.drawText(line, {
            x: pageStyles.margin + 10,
            y,
            size: 7,
            font: fonts.regular,
            color: toRgb(colors.muted),
          });
          y -= 9;
        }
      }

      y -= spacing.tableRowHeight;
    }
  }

  // Markdown table fallback
  if (valueTable.tableMarkdown && !rows) {
    const parsed = parseMarkdownTable(valueTable.tableMarkdown as string);
    if (parsed) {
      y = renderParsedTable(ctx, parsed, y);
    } else {
      y = renderParagraph(
        ctx,
        valueTable.tableMarkdown as string,
        pageStyles.margin,
        y,
        pageStyles.contentWidth
      );
    }
  }

  return y - spacing.sectionGap;
}

function renderModelling(
  ctx: RenderContext,
  modelling: Record<string, unknown>
): number {
  const { page: pageStyles, spacing } = PDF_STYLES;
  let y = ctx.currentY;

  y = renderSectionHeader(ctx, "Modelling Details", y, 1);

  if (modelling.modeApplied) {
    y = renderKeyValue(
      ctx,
      "Mode Applied",
      modelling.modeApplied as string,
      pageStyles.margin,
      y
    );
  }
  if (modelling.modeRationale) {
    y = renderKeyValue(
      ctx,
      "Rationale",
      modelling.modeRationale as string,
      pageStyles.margin,
      y
    );
  }
  if (modelling.baseCaseGMUpliftMillions !== undefined) {
    y = renderKeyValue(
      ctx,
      "Base Case GM Uplift",
      `$${modelling.baseCaseGMUpliftMillions}M`,
      pageStyles.margin,
      y
    );
  }

  // Final mode if different structure
  const finalMode = modelling.finalModeApplied as
    | Record<string, unknown>
    | undefined;
  if (finalMode) {
    const mode =
      finalMode.valueCaseMode || finalMode.mode || finalMode.value_case_mode;
    if (mode) {
      y = renderKeyValue(ctx, "Final Mode", mode as string, pageStyles.margin, y);
    }
    if (finalMode.reason) {
      y = renderKeyValue(
        ctx,
        "Reason",
        finalMode.reason as string,
        pageStyles.margin,
        y
      );
    }
  }

  return y - spacing.sectionGap;
}

function renderAppendices(
  ctx: RenderContext,
  appendices: Record<string, unknown>
): number {
  const { page, fonts } = ctx;
  const { page: pageStyles, fonts: fontStyles, spacing, colors } = PDF_STYLES;
  let y = ctx.currentY;

  y = renderSectionHeader(ctx, "Appendices", y, 1);

  // Assumptions block
  const assumptions = appendices.assumptionsBlock;
  if (assumptions) {
    y = renderSectionHeader(ctx, "Detailed Assumptions", y, 2);

    if (Array.isArray(assumptions)) {
      for (const item of assumptions as Record<string, unknown>[]) {
        ctx.checkPageBreak(100);

        const leverName = `${item.leverId || ""}: ${item.leverName || "Lever"}`;
        page.drawText(leverName, {
          x: pageStyles.margin,
          y,
          size: fontStyles.h3.size,
          font: fonts.bold,
          color: toRgb(colors.secondary),
        });
        y -= 16;

        if (item.upliftPercentageApplied !== undefined) {
          page.drawText(`Uplift Applied: ${item.upliftPercentageApplied}%`, {
            x: pageStyles.margin + 8,
            y,
            size: fontStyles.small.size,
            font: fonts.regular,
            color: toRgb(colors.secondary),
          });
          y -= 12;
        }

        const range = item.credibleRange as Record<string, unknown> | undefined;
        if (range) {
          page.drawText(
            `Range: ${range.minPercent}% - ${range.maxPercent}% (${range.source})`,
            {
              x: pageStyles.margin + 8,
              y,
              size: fontStyles.small.size,
              font: fonts.regular,
              color: toRgb(colors.secondary),
            }
          );
          y -= 12;
        }

        if (item.resultGM !== undefined) {
          page.drawText(`Result: $${item.resultGM}M GM uplift`, {
            x: pageStyles.margin + 8,
            y,
            size: fontStyles.small.size,
            font: fonts.regular,
            color: toRgb(colors.secondary),
          });
          y -= 12;
        }

        y -= spacing.paragraphGap;
      }
    }
  }

  // Sources list
  const sources = appendices.sources as string[] | undefined;
  if (sources && sources.length > 0) {
    ctx.checkPageBreak(85);
    y = renderSectionHeader(ctx, "Sources", y, 2);

    for (const source of sources.slice(0, 15)) {
      ctx.checkPageBreak(17);
      const lines = wrapText(
        `• ${source}`,
        fonts.regular,
        fontStyles.small.size,
        pageStyles.contentWidth - 10
      );

      for (const line of lines) {
        page.drawText(line, {
          x: pageStyles.margin + 5,
          y,
          size: fontStyles.small.size,
          font: fonts.regular,
          color: toRgb(colors.secondary),
        });
        y -= 10;
      }
    }

    if (sources.length > 15) {
      page.drawText(`... and ${sources.length - 15} more sources`, {
        x: pageStyles.margin + 5,
        y,
        size: fontStyles.small.size,
        font: fonts.regular,
        color: toRgb(colors.muted),
      });
      y -= 14;
    }
  }

  return y - spacing.sectionGap;
}

async function renderInfographicCover(
  ctx: RenderContext,
  data: AbmPackData,
  imageSource: string
): Promise<void> {
  const { pdfDoc, page, fonts } = ctx;
  const { page: pageStyles, fonts: fontStyles, colors } = PDF_STYLES;

  try {
    let imageBytes: Uint8Array;

    // Check if it's a file path (starts with / or http) or base64 data
    if (imageSource.startsWith("/") || imageSource.startsWith("http")) {
      // It's a file path - fetch the image
      const response = await fetch(imageSource);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBytes = new Uint8Array(arrayBuffer);
    } else if (imageSource.startsWith("data:")) {
      // It's a data URL - extract base64
      const base64Data = imageSource.split(",")[1];
      imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    } else {
      // Assume it's raw base64
      imageBytes = Uint8Array.from(atob(imageSource), (c) => c.charCodeAt(0));
    }

    // Embed image (try PNG first, then JPEG)
    let image;
    try {
      image = await pdfDoc.embedPng(imageBytes);
    } catch {
      image = await pdfDoc.embedJpg(imageBytes);
    }

    // Calculate dimensions - make it as large as possible while maintaining aspect ratio
    const aspectRatio = image.width / image.height;
    const pageAspect = pageStyles.width / pageStyles.height;

    let imgWidth: number;
    let imgHeight: number;

    // Fill the page as much as possible
    if (aspectRatio > pageAspect) {
      // Image is wider than page - fit to width
      imgWidth = pageStyles.width;
      imgHeight = imgWidth / aspectRatio;
    } else {
      // Image is taller than page - fit to height
      imgHeight = pageStyles.height;
      imgWidth = imgHeight * aspectRatio;
    }

    // Center the image on the page
    const x = (pageStyles.width - imgWidth) / 2;
    const y = (pageStyles.height - imgHeight) / 2;

    // Draw the infographic as the main visual
    page.drawImage(image, {
      x,
      y,
      width: imgWidth,
      height: imgHeight,
    });

    // Add subtle branding at the bottom
    const brandIntake = data.brandIntake as Record<string, unknown> | undefined;
    const brandName = sanitizeText((brandIntake?.brand as string) || "");
    
    // Semi-transparent footer bar
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageStyles.width,
      height: 35,
      color: rgb(1, 1, 1),
      opacity: 0.85,
    });

    // Brand name on the left
    if (brandName) {
      page.drawText(brandName, {
        x: pageStyles.margin,
        y: 12,
        size: fontStyles.h2.size,
        font: fonts.bold,
        color: toRgb(colors.primary),
      });
    }

    // "Value Case Report" on the right
    const reportLabel = "Value Case Report";
    const labelWidth = fonts.regular.widthOfTextAtSize(reportLabel, fontStyles.body.size);
    page.drawText(reportLabel, {
      x: pageStyles.width - pageStyles.margin - labelWidth,
      y: 14,
      size: fontStyles.body.size,
      font: fonts.regular,
      color: toRgb(colors.muted),
    });

  } catch {
    // If infographic fails, just show a placeholder
    page.drawText("Infographic could not be rendered", {
      x: pageStyles.margin,
      y: pageStyles.height / 2,
      size: fontStyles.body.size,
      font: fonts.regular,
      color: toRgb(colors.muted),
    });
  }
}

async function renderInfographicPage(
  ctx: RenderContext,
  imageSource: string
): Promise<void> {
  const { pdfDoc, fonts } = ctx;
  const { page: pageStyles, fonts: fontStyles, colors } = PDF_STYLES;

  // Create new page
  const page = pdfDoc.addPage([pageStyles.width, pageStyles.height]);

  // Add header
  page.drawText("Infographic", {
    x: pageStyles.margin,
    y: pageStyles.height - pageStyles.margin - 10,
    size: fontStyles.h1.size,
    font: fonts.bold,
    color: toRgb(colors.primary),
  });

  try {
    let imageBytes: Uint8Array;

    // Check if it's a file path (starts with / or http) or base64 data
    if (imageSource.startsWith("/") || imageSource.startsWith("http")) {
      // It's a file path - fetch the image
      const response = await fetch(imageSource);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBytes = new Uint8Array(arrayBuffer);
    } else if (imageSource.startsWith("data:")) {
      // It's a data URL - extract base64
      const base64Data = imageSource.split(",")[1];
      imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    } else {
      // Assume it's raw base64
      imageBytes = Uint8Array.from(atob(imageSource), (c) => c.charCodeAt(0));
    }

    // Embed image (try PNG first, then JPEG)
    let image;
    try {
      image = await pdfDoc.embedPng(imageBytes);
    } catch {
      image = await pdfDoc.embedJpg(imageBytes);
    }

    // Calculate dimensions to fit page
    const maxWidth = pageStyles.contentWidth;
    const maxHeight = pageStyles.height - pageStyles.margin * 2 - 50;

    const aspectRatio = image.width / image.height;
    let imgWidth = maxWidth;
    let imgHeight = imgWidth / aspectRatio;

    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = imgHeight * aspectRatio;
    }

    // Center horizontally
    const x = pageStyles.margin + (pageStyles.contentWidth - imgWidth) / 2;
    const y = pageStyles.margin + 20;

    page.drawImage(image, {
      x,
      y,
      width: imgWidth,
      height: imgHeight,
    });
  } catch {
    page.drawText("Infographic could not be rendered", {
      x: pageStyles.margin,
      y: pageStyles.height - pageStyles.margin - 80,
      size: fontStyles.body.size,
      font: fonts.regular,
      color: toRgb(colors.muted),
    });
  }
}

function addPageNumbers(pdfDoc: PDFDocument, fonts: FontSet, hasInfographicCover: boolean): void {
  const pages = pdfDoc.getPages();
  const { page: pageStyles, fonts: fontStyles, colors } = PDF_STYLES;

  // Skip the first page if it's the infographic cover
  const startIndex = hasInfographicCover ? 1 : 0;
  const totalPages = pages.length - startIndex;

  for (let i = startIndex; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = i - startIndex + 1;
    const text = `Page ${pageNum} of ${totalPages}`;
    const textWidth = fonts.regular.widthOfTextAtSize(text, fontStyles.small.size);

    page.drawText(text, {
      x: pageStyles.width / 2 - textWidth / 2,
      y: 25,
      size: fontStyles.small.size,
      font: fonts.regular,
      color: toRgb(colors.muted),
    });
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatBrandType(brandType: string | undefined): string {
  if (!brandType) {
    return "";
  }
  const mapping: Record<string, string> = {
    own_brand_only: "Own-brand Only",
    multi_brand: "Multi-brand",
    mixed: "Mixed",
  };
  return mapping[brandType] || brandType;
}
