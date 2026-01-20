## Goal
Assess and outline a migration path from `pdf-lib` (manual drawing) to an
HTML-to-PDF pipeline that can improve typography and layout quality.

## What “HTML-to-PDF” Would Look Like
1. Build an HTML report template (React/JSX or string-based) that renders the
   ABM pack data.
2. Use a headless browser (Playwright or Puppeteer) to render the HTML and
   export to PDF.
3. Host or bundle fonts and assets (logos, charts, infographic) so rendering is
   consistent across environments.

## Expected Improvements
- Better typography, spacing, and automatic text flow.
- Flexible tables with CSS-based wrapping and layout.
- Easier to apply brand styling with CSS.

## Tradeoffs / Risks
- Heavier infrastructure (headless browser dependencies).
- Slower generation, especially for large reports.
- Asset and font loading must be deterministic to avoid layout shifts.
- Print CSS/page-break handling can still be tricky.

## Migration Phases (Suggested)
### Phase 1: Prototype (Low Risk)
- Create a minimal HTML report for the Value Case section only.
- Run it through a headless browser in a local script or server route.
- Compare PDF output to current `pdf-lib` output.

### Phase 2: Full HTML Report
- Implement the full report in HTML (cover, exec summary, tables, appendices).
- Ensure all assets are local or preloaded.
- Add print CSS (`@page`, `page-break-*` rules) for pagination.

### Phase 3: Swap & Harden
- Add feature flag to choose PDF generator: `pdf-lib` vs HTML.
- Add tests/snapshots for layout regressions.
- Measure generation time and memory in prod-like envs.

## Open Questions / Needed Inputs
1. Where does PDF generation run (serverless, Node server, edge)?
2. Are we okay adding Playwright/Puppeteer dependencies?
3. Any constraints on generation time and file size?
4. Do we need pixel-perfect brand typography (custom fonts)?
5. Must the report be generated in environments without a browser runtime?

