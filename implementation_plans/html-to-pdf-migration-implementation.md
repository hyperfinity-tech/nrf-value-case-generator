# HTML-to-PDF Migration Implementation Plan

## Goal
Replace the current `pdf-lib`-based ABM pack PDF generation with an HTML-to-PDF pipeline (React -> HTML -> PDF) while keeping `pdf-lib` as a fallback during rollout.

## Source Plan
Follow `.claude/plans/rippling-wobbling-sprout.md` as the authoritative spec.

## Scope
- New HTML report renderer under `lib/abm/html-report/`
- New API endpoint for PDF generation: `app/(chat)/api/abm-pack-pdf/route.ts`
- Update `components/abm-pack-generator.tsx` to call the new endpoint
- Keep the existing `pdf-lib` report generator for fallback

## Non-Goals
- Visual parity perfection on day one (will target close alignment with `public/templates/html_template.html`)
- Replacing the infographic-only download flow
- Removing or refactoring existing `pdf-lib` code

## Approach
1. Create HTML report components and styles that mirror the existing template and slide layout.
2. Render the report to static HTML on the server.
3. Convert HTML to PDF using Browserless in production, Playwright in development.
4. Expose a POST API route that returns a PDF blob.
5. Update the client to download the PDF via the new API with a fallback to `pdf-lib`.

## Implementation Steps
### 1) HTML Report Structure
- Create `lib/abm/html-report/styles.ts` with CSS variables and print rules.
- Create `lib/abm/html-report/components/`:
  - `ReportLayout.tsx`
  - `CoverSlide.tsx`
  - `TitleSlide.tsx`
  - `ExecutiveSummary.tsx`
  - `BrandIntake.tsx`
  - `ResearchFindings.tsx`
  - `ValueCase.tsx`
  - `Modelling.tsx`
  - `Appendices.tsx`
- Use strict typed props from `AbmPackOutput`.
- Avoid `<img>` tags in JSX; use background images or data-URI styles for infographic/logo to comply with Next.js project rules.

### 2) HTML Renderer
- Add `lib/abm/html-report/index.ts` with `generateHtmlReport(data, infographic?)`.
- Use `renderToStaticMarkup` to build a full HTML document string.

### 3) PDF Renderer
- Add `lib/abm/html-report/render-to-pdf.ts`:
  - In production, use Browserless (`BROWSERLESS_URL`, `BROWSERLESS_TOKEN`).
  - In development, use Playwright locally.
  - Match A4 landscape + zero margins + print background.

### 4) API Route
- Create `app/(chat)/api/abm-pack-pdf/route.ts`.
- Accept `POST` with `{ data: AbmPackOutput, infographicBase64?: string }`.
- Return a PDF response with correct `Content-Type` and `Content-Disposition`.
- Guard with basic validation and error responses.

### 5) Client Integration
- Update `downloadFullReport()` in `components/abm-pack-generator.tsx`:
  - Call the new API endpoint to fetch the PDF blob.
  - If the request fails, fall back to `generateAbmPackPdfReport` from `pdf-lib`.
  - Keep file naming consistent with current behavior.

## Files to Add/Modify
- Add: `lib/abm/html-report/` (components, styles, renderer)
- Add: `app/(chat)/api/abm-pack-pdf/route.ts`
- Modify: `components/abm-pack-generator.tsx`
- Keep: `lib/abm/pdf-report.ts`, `lib/abm/pdf-report-styles.ts`

## Environment Variables
- `BROWSERLESS_URL` (production)
- `BROWSERLESS_TOKEN` (production)

## Risks & Mitigations
- **Visual differences vs pdf-lib**: Use `public/templates/html_template.html` as the styling source of truth.
- **Serverless Chromium**: Use Browserless in prod, Playwright in dev.
- **HTML images**: Use background images or data URIs to avoid direct `<img>` tags in JSX.

## Testing & Verification
- Generate a report for Lululemon mock data and compare layout.
- Confirm slide count, page breaks, and branding.
- Verify behavior with and without infographic.
- Run `pnpm build` after integration.

## Rollback
Keep `pdf-lib` as the fallback path in the client until the HTML-to-PDF output is validated.
