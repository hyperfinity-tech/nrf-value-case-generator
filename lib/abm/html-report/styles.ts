/**
 * CSS styles for HTML-to-PDF report generation
 * Uses a flowing document layout with branded headers/footers
 */
export const reportCss = `
:root {
  /* Page geometry (A4 landscape) */
  --page-width: 297mm;
  --page-height: 210mm;
  --page-margin-x: 20mm;
  --page-margin-top: 18mm;
  --page-margin-bottom: 22mm;

  /* Brand colors */
  --magenta: #fb368e;
  --teal: #03e1ba;
  --blue: #058dfd;
  --stop-1: 33.105%;
  --stop-2: 66.699%;

  /* Typography */
  --text: #0f172a;
  --muted: #475569;
  --border: #e2e8f0;
  --panel-bg: #f8fafc;
  --white: #ffffff;
}

@page {
  size: A4 landscape;
  margin: var(--page-margin-top) var(--page-margin-x) var(--page-margin-bottom);
}

/* Reset */
*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  background: var(--white);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 11px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* Page container for screen preview */
.page {
  width: var(--page-width);
  min-height: var(--page-height);
  padding: var(--page-margin-top) var(--page-margin-x) var(--page-margin-bottom);
  background: var(--white);
  position: relative;
}

/* Sections flow naturally and break across pages */
.section {
  page-break-inside: avoid;
  margin-bottom: 16px;
}

/* Force page break before major sections */
.page-break {
  page-break-before: always;
}

/* Typography */
h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
  color: var(--text);
}

h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 24px 0 12px;
  color: var(--text);
  border-bottom: 2px solid var(--blue);
  padding-bottom: 6px;
  page-break-after: avoid;
  break-after: avoid;
}

h3 {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--text);
  page-break-after: avoid;
  break-after: avoid;
}

h4 {
  font-size: 12px;
  font-weight: 600;
  margin: 12px 0 6px;
  color: var(--muted);
  page-break-after: avoid;
  break-after: avoid;
}

p {
  margin: 0 0 8px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted);
}

/* Header with logo and brand stripe */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 3px solid transparent;
  background: linear-gradient(var(--white), var(--white)) padding-box,
              linear-gradient(90deg, var(--magenta) 0%, var(--magenta) var(--stop-1), var(--teal) var(--stop-1), var(--teal) var(--stop-2), var(--blue) var(--stop-2), var(--blue) 100%) border-box;
}

.header-logo {
  width: 120px;
  height: 32px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: left center;
}

.header-title {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Cover section */
.cover {
  position: relative;
  text-align: center;
  padding: 40px 0 60px;
  min-height: calc(var(--page-height) - var(--page-margin-top) - var(--page-margin-bottom));
}

.cover h1 {
  font-size: 36px;
  margin-bottom: 12px;
}

.cover .subtitle {
  font-size: 16px;
  color: var(--muted);
  margin-bottom: 24px;
}

.cover .date {
  font-size: 12px;
  color: var(--muted);
}

/* Cover with infographic background */
.cover-with-infographic {
  position: relative;
  width: 100%;
  height: calc(var(--page-height) - var(--page-margin-top) - var(--page-margin-bottom));
  background-color: #ffffff; /* Fallback if image doesn't load */
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0;
}

.cover-with-infographic::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0) 60%);
}

.cover-with-infographic .cover-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32px;
  z-index: 1;
  color: var(--white);
}

.cover-with-infographic h1 {
  color: var(--white);
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.cover-with-infographic .subtitle {
  color: rgba(255,255,255,0.9);
}

/* Tricolour stripe at bottom of cover */
.cover-stripe {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 8px;
  z-index: 5;
  background: linear-gradient(
    90deg,
    var(--magenta) 0%,
    var(--magenta) var(--stop-1),
    var(--teal) var(--stop-1),
    var(--teal) var(--stop-2),
    var(--blue) var(--stop-2),
    var(--blue) 100%
  );
}

/* Highlight box for key metrics */
.highlight-box {
  background: linear-gradient(135deg, var(--blue) 0%, #0066b3 100%);
  color: var(--white);
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.highlight-box p {
  color: var(--white);
  font-size: 13px;
  font-weight: 500;
  margin: 0;
}

/* Panels */
.panel {
  background: var(--panel-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 12px;
  page-break-inside: avoid;
}

/* Grid layouts */
.grid {
  display: grid;
  gap: 12px;
  margin-bottom: 12px;
}

.grid.two {
  grid-template-columns: repeat(2, 1fr);
}

.grid.three {
  grid-template-columns: repeat(3, 1fr);
}

/* Key-value pairs */
.kv {
  display: grid;
  gap: 6px;
  font-size: 11px;
}

.kv > div {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 8px;
}

.kv dt {
  font-weight: 600;
  color: var(--muted);
}

.kv dd {
  margin: 0;
  color: var(--text);
  word-break: break-word;
}

/* Tables */
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
  margin-bottom: 12px;
}

.table th,
.table td {
  border: 1px solid var(--border);
  padding: 8px 10px;
  text-align: left;
  vertical-align: top;
}

.table th {
  background: #eef2f7;
  font-weight: 600;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Lists */
.list {
  margin: 0;
  padding-left: 16px;
  font-size: 10px;
  color: var(--muted);
}

.list li {
  margin-bottom: 4px;
}

/* Sources list (numbered) */
.sources-list {
  margin: 0;
  padding-left: 20px;
  font-size: 9px;
  color: var(--muted);
  list-style-type: decimal;
}

.sources-list li {
  margin-bottom: 6px;
  line-height: 1.4;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 600;
  background: #eef2f7;
  color: var(--text);
}

/* Print adjustments */
@media print {
  .page {
    width: auto;
    min-height: auto;
    padding: 0;
  }
}

/* Ensure tables don't break badly */
.table {
  page-break-inside: auto;
}

.table tr {
  page-break-inside: avoid;
  page-break-after: auto;
}

/* Keep panels together when possible */
.panel {
  page-break-inside: avoid;
}

/* Subsection styling */
.subsection {
  margin-bottom: 16px;
  page-break-inside: avoid;
}

.subsection:last-child {
  margin-bottom: 0;
}

/* Prevent orphaned headings - keep headings with at least some content */
.section > h2 + *,
.section > h3 + *,
.subsection > h3 + *,
.subsection > h4 + *,
.panel > h3 + *,
.panel > h4 + * {
  page-break-before: avoid;
  break-before: avoid;
}

/* Widow/orphan control for paragraphs */
p {
  orphans: 3;
  widows: 3;
}

/* Ensure grids stay together when possible */
.grid {
  page-break-inside: avoid;
}

/* ============================================================================
   Contact Page
   ============================================================================ */

.contact-page {
  position: relative;
  min-height: calc(var(--page-height) - var(--page-margin-top) - var(--page-margin-bottom));
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: linear-gradient(180deg, var(--white) 0%, #f8fafc 100%);
  padding: 40px;
}

.contact-content {
  max-width: 600px;
}

.contact-logo {
  width: 180px;
  height: 48px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  margin: 0 auto 32px;
}

.contact-page h2 {
  font-size: 32px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 8px;
}

.contact-tagline {
  font-size: 14px;
  color: var(--muted);
  margin: 0 0 32px;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

.contact-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  text-align: left;
}

.contact-card h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 8px;
}

.contact-card p {
  font-size: 11px;
  color: var(--muted);
  margin: 0 0 12px;
  line-height: 1.5;
}

.contact-link {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: var(--blue);
  text-decoration: none;
}

.contact-info {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 32px;
}

.contact-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
}

.contact-value {
  font-size: 11px;
  font-weight: 500;
  color: var(--text);
}

.contact-footer {
  font-size: 10px;
  color: var(--muted);
  margin: 0;
  line-height: 1.6;
}

.contact-copyright {
  font-size: 9px;
  opacity: 0.7;
}

.contact-page .cover-stripe {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}
`;
