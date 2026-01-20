# HTML-to-PDF Migration Plan

## Overview
Migrate from `pdf-lib` (manual coordinate-based drawing) to an HTML-based approach where we:
1. Generate HTML from React components
2. Convert to PDF using Playwright

This leverages the now-standardized ABM pack schema, allowing direct property access without defensive extraction.

## Current State
- **`lib/abm/pdf-report.ts`** (~1650 lines): Manual PDF construction with pdf-lib
- **`lib/abm/pdf-report-styles.ts`**: Style constants for pdf-lib
- **`public/templates/html_template.html`**: Branded slide template (16:9, HyperFinity colors)
- **Playwright**: Already installed for testing
- **Schema**: Now strict - direct property access is safe

## Architecture

```
components/abm-pack-generator.tsx
    │
    └─► downloadFullReport()
            │
            ├─► [OLD] lib/abm/pdf-report.ts (pdf-lib)
            │
            └─► [NEW] API route → HTML generation → Playwright PDF
```

### New File Structure
```
lib/abm/
├── pdf-report.ts          # Keep for fallback during transition
├── pdf-report-styles.ts   # Keep for fallback
├── html-report/
│   ├── index.ts           # Main export: generateHtmlReport()
│   ├── styles.ts          # CSS-in-JS styles matching branded template
│   ├── components/
│   │   ├── ReportLayout.tsx      # Page wrapper with branding
│   │   ├── CoverSlide.tsx        # Cover page with infographic
│   │   ├── TitleSlide.tsx        # Brand name and metadata
│   │   ├── ExecutiveSummary.tsx  # One-liner, CFO panel, summary
│   │   ├── BrandIntake.tsx       # Brand intake section
│   │   ├── ResearchFindings.tsx  # Research with subsections
│   │   ├── ValueCase.tsx         # Value case table
│   │   ├── Modelling.tsx         # Modelling details
│   │   └── Appendices.tsx        # Assumptions and sources
│   └── render-to-pdf.ts   # Playwright PDF generation

app/(chat)/api/abm-pack-pdf/
└── route.ts               # API endpoint for PDF generation
```

## Implementation Steps

### Phase 1: HTML Report Components

**1.1 Create base styles (`lib/abm/html-report/styles.ts`)**
- CSS variables matching `html_template.html` (colors, spacing, typography)
- Print-specific styles (`@page`, `page-break-*`)
- Slide dimensions (A4 landscape: 297mm × 210mm)

**1.2 Create ReportLayout component**
- Renders full HTML document with `<head>` styles
- Accepts children for slide content
- Includes brand stripe, logo positioning

**1.3 Create individual slide components**
Each component receives typed props from `AbmPackOutput`:

| Component | Data Source | Key Elements |
|-----------|-------------|--------------|
| CoverSlide | infographicBase64 | Full-bleed infographic, subtle branding footer |
| TitleSlide | brandIntake | Brand name centered, subtitle, date |
| ExecutiveSummary | outputs | One-liner highlight box, CFO panel, data confidence badges |
| BrandIntake | brandIntake | Key-value pairs in clean layout |
| ResearchFindings | research | Subsections for financials, loyalty, benchmarks, tech, sentiment |
| ValueCase | outputs.slide4ValueCaseTable | 3-column table with styling |
| Modelling | modelling | Base assumptions, levers, final values |
| Appendices | appendices | Assumptions breakdown, numbered sources |

### Phase 2: Server-Side Rendering

**2.1 Create `generateHtmlReport()` function**
```typescript
// lib/abm/html-report/index.ts
export function generateHtmlReport(data: AbmPackOutput, infographic?: string): string {
  // Use React's renderToStaticMarkup for server-side HTML generation
  return renderToStaticMarkup(
    <ReportLayout>
      {infographic && <CoverSlide src={infographic} brand={data.brandIntake.brand} />}
      <TitleSlide data={data.brandIntake} />
      <ExecutiveSummary data={data.outputs} />
      {/* ... more slides */}
    </ReportLayout>
  );
}
```

**2.2 Create Playwright PDF renderer (`lib/abm/html-report/render-to-pdf.ts`)**
```typescript
import { chromium } from 'playwright';

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  const pdf = await page.pdf({
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  await browser.close();
  return pdf;
}
```

### Phase 3: API Integration

**3.1 Create API route (`app/(chat)/api/abm-pack-pdf/route.ts`)**
- Accepts POST with `AbmPackOutput` JSON + optional infographic
- Generates HTML → PDF
- Returns PDF as blob

**3.2 Update `abm-pack-generator.tsx`**
- Modify `downloadFullReport()` to call new API route
- Keep `pdf-lib` import as fallback with feature flag

### Phase 4: Asset Handling

**4.1 Fonts**
- Use system fonts initially (matches template: ui-sans-serif, system-ui, etc.)
- Option to embed custom fonts via `@font-face` with base64-encoded WOFF2

**4.2 Logo**
- Embed logo as base64 data URL in HTML to avoid network requests
- Source: `/images/hyperfinity-logo-dark.png`

**4.3 Infographic**
- Already received as base64 - embed directly in `<img src="data:...">`

## Files to Modify

| File | Change |
|------|--------|
| `lib/abm/html-report/` | NEW: Create entire directory |
| `app/(chat)/api/abm-pack-pdf/route.ts` | NEW: PDF generation endpoint |
| `components/abm-pack-generator.tsx` | Update `downloadFullReport()` to use new endpoint |
| `package.json` | No changes needed (Playwright already installed) |

## CSS Approach

Inline styles in the HTML using CSS variables from the template:

```css
:root {
  --magenta: #fb368e;
  --teal: #03e1ba;
  --blue: #058dfd;
  --text: #0f172a;
  --muted: #475569;
}

@page {
  size: A4 landscape;
  margin: 0;
}

.slide {
  width: 297mm;
  height: 210mm;
  page-break-after: always;
  position: relative;
}

.brand-stripe {
  /* Bottom gradient stripe */
}
```

## Simplifications Due to Strict Schema

With the standardized output, component code becomes much cleaner:

```typescript
// OLD (defensive):
const revenue = findValue(data, "financials", "totalRevenue", "revenue");
const revenueNum = extractNumber(revenue);

// NEW (direct):
const revenue = data.research.financials.totalRevenueUSD;
// revenue is { value: number, unit: string, confidence: string, note: string }
```

## Testing Strategy

1. **Visual regression**: Generate PDFs for test fixtures, compare outputs
2. **Unit tests**: Test individual components render correctly
3. **Integration test**: Full flow from API request to PDF download

## Verification Steps

1. Run `pnpm build` to ensure all components compile
2. Generate PDF for Lululemon test data
3. Compare visual output with current pdf-lib version
4. Verify page breaks occur correctly
5. Test with and without infographic
6. Check file size is reasonable (similar to current output)

## Rollback Plan

Keep `lib/abm/pdf-report.ts` intact. If issues arise:
```typescript
const USE_HTML_PDF = process.env.USE_HTML_PDF === 'true';

if (USE_HTML_PDF) {
  // New HTML approach
} else {
  // Existing pdf-lib approach
}
```

## PDF Rendering Approach

Use **Browserless.io** (or similar service) for PDF generation. This avoids bundling Chromium in the serverless deployment.

```typescript
// lib/abm/html-report/render-to-pdf.ts
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const response = await fetch(`${process.env.BROWSERLESS_URL}/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BROWSERLESS_TOKEN}`,
    },
    body: JSON.stringify({
      html,
      options: {
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      },
    }),
  });
  return Buffer.from(await response.arrayBuffer());
}
```

**Environment Variables Required**:
- `BROWSERLESS_URL`: API endpoint (e.g., `https://chrome.browserless.io`)
- `BROWSERLESS_TOKEN`: API key

**Fallback for Local Development**: Use Playwright directly when `NODE_ENV=development`.
