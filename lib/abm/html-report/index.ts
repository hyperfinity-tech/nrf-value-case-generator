import { reportCss } from "./styles";
import {
  formatLabel,
  formatNumber,
  formatPercentage,
  parseMarkdownTable,
} from "./utils";

type LooseData = Record<string, unknown>;

type GenerateHtmlReportOptions = {
  data: LooseData;
  infographicBase64?: string | null;
  logoDataUrl?: string | null;
};

// ============================================================================
// Generic Data Access Helpers
// ============================================================================

const isObject = (val: unknown): val is LooseData =>
  val !== null && typeof val === "object" && !Array.isArray(val);

const get = (source: unknown, ...keys: string[]): unknown => {
  let current: unknown = source;
  for (const key of keys) {
    if (!isObject(current)) return undefined;
    current = current[key];
  }
  return current;
};

const getStr = (source: unknown, ...keys: string[]): string => {
  const val = get(source, ...keys);
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  return "";
};

const getNum = (source: unknown, ...keys: string[]): number => {
  const val = get(source, ...keys);
  return typeof val === "number" ? val : 0;
};

const getObj = (source: unknown, ...keys: string[]): LooseData => {
  const val = get(source, ...keys);
  return isObject(val) ? val : {};
};

const getArr = (source: unknown, ...keys: string[]): unknown[] => {
  const val = get(source, ...keys);
  return Array.isArray(val) ? val : [];
};

// Try multiple paths, return first truthy result
const tryPaths = <T>(source: unknown, paths: string[][], transform: (val: unknown) => T, fallback: T): T => {
  for (const path of paths) {
    const val = get(source, ...path);
    if (val !== undefined && val !== null && val !== "") {
      return transform(val);
    }
  }
  return fallback;
};

// ============================================================================
// HTML Helpers
// ============================================================================

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const fmt = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "string") return escapeHtml(value).replace(/\n/g, "<br />");
  if (typeof value === "number") return escapeHtml(formatNumber(value));
  if (Array.isArray(value)) {
    if (value.length === 0) return "N/A";
    // Array of strings
    if (value.every((v) => typeof v === "string")) {
      return `<ul class="list">${value.map((v) => `<li>${escapeHtml(v)}</li>`).join("")}</ul>`;
    }
    // Array of objects - try to extract meaningful text
    return `<ul class="list">${value.map((v) => `<li>${fmt(extractText(v))}</li>`).join("")}</ul>`;
  }
  if (isObject(value)) {
    return fmt(extractText(value));
  }
  return escapeHtml(String(value));
};

// Extract readable text from an object (looks for common text fields)
const extractText = (obj: unknown): string => {
  if (!isObject(obj)) return String(obj ?? "");
  // Common text field names
  const textKeys = ["quote", "text", "description", "value", "summary", "content", "label", "name", "title"];
  for (const key of textKeys) {
    const val = obj[key];
    if (typeof val === "string" && val.length > 0) return val;
  }
  // If has value + unit, combine them
  if (typeof obj.value === "number" && typeof obj.unit === "string") {
    return `${formatNumber(obj.value)} ${obj.unit}`;
  }
  // Fallback: stringify first few keys
  const entries = Object.entries(obj).slice(0, 3);
  return entries.map(([k, v]) => `${formatLabel(k)}: ${typeof v === "object" ? "[...]" : v}`).join(", ");
};

const formatReportDate = () =>
  new Date(Date.now()).toISOString().split("T").at(0) ?? "";

// Render any object as a key-value list
const renderKV = (obj: unknown): string => {
  if (!isObject(obj)) return "<p>N/A</p>";
  const entries = Object.entries(obj).filter(([, v]) => v !== null && v !== undefined);
  if (entries.length === 0) return "<p>N/A</p>";
  return `<dl class="kv">${entries
    .map(([key, value]) => `<div><dt>${escapeHtml(formatLabel(key))}</dt><dd>${fmt(value)}</dd></div>`)
    .join("")}</dl>`;
};

// ============================================================================
// Section Renderers
// ============================================================================

const renderHeader = (logoDataUrl?: string | null) => `
  <header class="header">
    ${logoDataUrl ? `<div class="header-logo" style="background-image: url('${logoDataUrl}')"></div>` : "<div></div>"}
    <span class="header-title">ABM Value Case Report</span>
  </header>
`;

const renderCoverWithInfographic = (brandName: string, infographicDataUrl: string) => `
  <div class="cover-with-infographic" style="background-image: url('${infographicDataUrl}')">
    <div class="cover-content">
      <h1>${fmt(brandName)} Strategic Value Case</h1>
      <p class="subtitle">FY2025 Gross Margin Opportunity Analysis</p>
    </div>
    <div class="cover-stripe"></div>
  </div>
`;

const renderCover = (brandIntake: LooseData) => `
  <section class="cover">
    <h1>${fmt(getStr(brandIntake, "brand") || "Value Case Report")}</h1>
    <p class="subtitle">${fmt(getStr(brandIntake, "category"))}</p>
    <p class="date">Generated ${formatReportDate()}</p>
    <div class="cover-stripe" style="position: absolute; bottom: 0; left: 0; right: 0;"></div>
  </section>
`;

const renderExecutiveSummary = (outputs: LooseData) => {
  const panel = getObj(outputs, "cfoReadinessPanel");
  const dataConfidence = getObj(panel, "dataConfidence");
  
  // Try multiple paths for blended GM
  const blendedGM = tryPaths(panel, 
    [["blendedGMPercentUsed"], ["blendedGmPercentUsed"], ["blendedGM"]],
    (v) => typeof v === "number" ? formatPercentage(v) : String(v),
    getStr(panel, "blendedGmPercentUsed") || "N/A"
  );

  return `
    <section class="section">
      <h2>Executive Summary</h2>
      <div class="highlight-box">
        <p>${fmt(getStr(outputs, "executiveOneLiner"))}</p>
      </div>
      <div class="grid two">
        <div class="panel">
          <h3>CFO Readiness Panel</h3>
          <dl class="kv">
            <div><dt>Blended GM% Used</dt><dd>${fmt(blendedGM)}</dd></div>
            <div><dt>Brand Type</dt><dd>${fmt(getStr(panel, "brandType"))}</dd></div>
            <div><dt>Value Case Mode</dt><dd>${fmt(getStr(panel, "valueCaseMode"))}</dd></div>
          </dl>
        </div>
        <div class="panel">
          <h3>Data Confidence</h3>
          <dl class="kv">
            <div><dt>Revenue</dt><dd><span class="badge">${fmt(getStr(dataConfidence, "revenue"))}</span></dd></div>
            <div><dt>Loyalty</dt><dd><span class="badge">${fmt(getStr(dataConfidence, "loyalty"))}</span></dd></div>
            <div><dt>AOV</dt><dd><span class="badge">${fmt(getStr(dataConfidence, "aov") || getStr(dataConfidence, "AOV"))}</span></dd></div>
            <div><dt>Frequency</dt><dd><span class="badge">${fmt(getStr(dataConfidence, "frequency"))}</span></dd></div>
          </dl>
        </div>
      </div>
      <div class="panel">
        <h3>Summary</h3>
        <p>${fmt(getStr(outputs, "executiveSummary"))}</p>
      </div>
    </section>
  `;
};

const renderBrandIntake = (brandIntake: LooseData) => {
  // businessRegistry can be string or object
  const registry = brandIntake.businessRegistry;
  const registryText = typeof registry === "string" 
    ? registry 
    : isObject(registry) 
      ? getStr(registry, "description") || getStr(registry, "secEdgarLink")
      : "";

  return `
    <section class="section">
      <h2>Brand Intake</h2>
      <div class="panel">
        <dl class="kv">
          <div><dt>Brand</dt><dd>${fmt(getStr(brandIntake, "brand"))}</dd></div>
          <div><dt>Website</dt><dd>${fmt(getStr(brandIntake, "website"))}</dd></div>
          <div><dt>Category</dt><dd>${fmt(getStr(brandIntake, "category"))}</dd></div>
          <div><dt>Brand Type</dt><dd>${fmt(getStr(brandIntake, "brandType"))}</dd></div>
          <div><dt>Business Registry</dt><dd>${fmt(registryText)}</dd></div>
          <div><dt>Contextual Notes</dt><dd>${fmt(getStr(brandIntake, "contextualNotes"))}</dd></div>
        </dl>
      </div>
    </section>
  `;
};

const renderResearchFindings = (research: LooseData) => {
  const financials = getObj(research, "financials");
  const loyaltyProgramme = getObj(research, "loyaltyProgramme");
  const benchmarks = getObj(research, "benchmarks");
  const sentiment = getObj(research, "loyaltySentiment");
  
  // Financials can be nested under latestRevenueGM or direct
  const finData = Object.keys(getObj(financials, "latestRevenueGM")).length > 0
    ? getObj(financials, "latestRevenueGM")
    : financials;

  // Get revenue - try multiple paths
  const revenueVal = tryPaths(finData,
    [["totalRevenueUSD", "value"], ["totalRevenueUSD"], ["totalRevenue", "value"]],
    (v) => typeof v === "number" ? formatNumber(v) : String(v),
    "N/A"
  );
  
  const gmPercent = tryPaths(finData,
    [["consolidatedGrossMarginPct", "value"], ["consolidatedGrossMarginPct"], ["blendedGrossMarginPercent", "value"], ["segmentRetailPCWGrossMarginPct", "value"]],
    (v) => typeof v === "number" ? formatPercentage(v) : String(v),
    "N/A"
  );

  // Loyalty programme - handle nested structure
  const progName = getStr(loyaltyProgramme, "name") || getStr(loyaltyProgramme, "programmeName");
  const launchEvolution = loyaltyProgramme.launchAndEvolution;
  const launchText = typeof launchEvolution === "string" 
    ? launchEvolution 
    : isObject(launchEvolution) 
      ? getStr(launchEvolution, "initialLaunch", "description") || extractText(launchEvolution)
      : "";

  // Benchmarks - handle different structures
  const aovData = getObj(benchmarks, "aov") || getObj(benchmarks, "AOV");
  const aovVal = getNum(aovData, "valueUSD") || getNum(aovData, "brandOrCategoryAOV", "value") || getNum(aovData, "value");
  const freqData = getObj(benchmarks, "purchaseFrequency");
  const freqVal = getNum(freqData, "valuePerYear") || getNum(freqData, "estimatedAnnualPurchaseFrequencyPerActiveCustomer", "value");

  // Sentiment table - handle different field names
  const sentimentTable = getArr(sentiment, "sentimentTable");
  const sentimentRows = sentimentTable.map((row) => {
    if (!isObject(row)) return "";
    const aspect = getStr(row, "aspectLabel") || getStr(row, "displayName") || getStr(row, "aspectKey");
    const summary = getStr(row, "sentimentSummary");
    
    // Evidence can be array of strings or array of objects with quote property
    const evidenceRaw = getArr(row, "evidenceQuotes");
    const evidenceItems = evidenceRaw.map((e) => {
      if (typeof e === "string") return e;
      if (isObject(e)) return getStr(e, "quote") || extractText(e);
      return String(e);
    }).filter(Boolean);

    return `
      <tr>
        <td>${fmt(aspect)}</td>
        <td>${fmt(summary)}</td>
        <td>${evidenceItems.length > 0 ? `<ul class="list">${evidenceItems.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>` : "N/A"}</td>
      </tr>
    `;
  }).join("");

  return `
    <section class="section page-break">
      <h2>Research Findings</h2>
      
      <div class="subsection">
        <h3>Financials</h3>
        <div class="panel">
          <dl class="kv">
            <div><dt>Fiscal Year</dt><dd>${fmt(getStr(finData, "fiscalYear") || getStr(finData, "latestFiscalYear"))}</dd></div>
            <div><dt>Total Revenue (USD)</dt><dd>${fmt(revenueVal)}</dd></div>
            <div><dt>Gross Margin %</dt><dd>${fmt(gmPercent)}</dd></div>
          </dl>
        </div>
      </div>

      <div class="subsection">
        <h3>Loyalty Programme</h3>
        <div class="panel">
          <dl class="kv">
            <div><dt>Programme Name</dt><dd>${fmt(progName)}</dd></div>
            <div><dt>Launch & Evolution</dt><dd>${fmt(launchText)}</dd></div>
          </dl>
        </div>
      </div>

      <div class="subsection">
        <h3>Benchmarks</h3>
        <div class="grid two">
          <div class="panel">
            <h4>Average Order Value</h4>
            <dl class="kv">
              <div><dt>AOV</dt><dd>${aovVal ? fmt(`$${formatNumber(aovVal)}`) : "N/A"}</dd></div>
            </dl>
          </div>
          <div class="panel">
            <h4>Purchase Frequency</h4>
            <dl class="kv">
              <div><dt>Frequency</dt><dd>${freqVal ? fmt(`${formatNumber(freqVal)} per year`) : "N/A"}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Loyalty Sentiment</h3>
        <div class="panel">
          <p><strong>Overall Rating:</strong> ${fmt(getStr(sentiment, "overallRating") || getStr(sentiment, "overallSentimentRating"))}</p>
          <p>${fmt(getStr(sentiment, "narrativeSummary"))}</p>
        </div>
        ${sentimentRows ? `
        <table class="table">
          <thead>
            <tr>
              <th style="width: 20%">Aspect</th>
              <th style="width: 35%">Sentiment Summary</th>
              <th style="width: 45%">Evidence</th>
            </tr>
          </thead>
          <tbody>${sentimentRows}</tbody>
        </table>
        ` : ""}
      </div>
    </section>
  `;
};

const renderValueCase = (outputs: LooseData) => {
  const slide4 = getObj(outputs, "slide4ValueCaseTable");
  const tableMarkdown = getStr(slide4, "tableMarkdown");
  const table = tableMarkdown ? parseMarkdownTable(tableMarkdown) : null;
  const tableMarkup = table
    ? `
      <table class="table">
        <thead>
          <tr>${table.headers.map((header) => `<th>${fmt(header)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${fmt(cell)}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    `
    : tableMarkdown
      ? `<p>${fmt(tableMarkdown)}</p>`
      : "<p>No value case data available.</p>";

  return `
    <section class="section page-break">
      <h2>Value Case</h2>
      ${tableMarkup}
    </section>
  `;
};

const renderModelling = (modelling: LooseData) => {
  // Try multiple paths for assumptions
  const assumptions = getObj(modelling, "assumptions") || getObj(modelling, "baseAssumptions");
  const baseCaseMidpoints = getObj(modelling, "baseCaseUsingMidpoints");
  const stretchCase = getObj(modelling, "stretchCaseApplied");
  const finalValues = getObj(modelling, "finalValuesSelected");

  // Extract key values from assumptions
  const baseRevenue = getNum(assumptions, "baseRetailRevenueScopeUSD", "value") || 
                      getNum(assumptions, "totalRevenueUSD_m") * 1_000_000;
  const loyaltyMix = getNum(assumptions, "loyaltyRevenueMixPct", "value") || getNum(assumptions, "loyaltyRevenueMixPct");
  const gmPercent = getNum(assumptions, "gmPercentRetail", "value") || getNum(assumptions, "gmPercentRetail") || 
                    getNum(assumptions, "blendedGrossMarginPercent");

  // Get category uplift ranges if present
  const categoryRanges = getObj(assumptions, "categoryUpliftRanges");

  return `
    <section class="section">
      <h2>Modelling Details</h2>
      <div class="grid two">
        <div class="panel">
          <h3>Base Assumptions</h3>
          <dl class="kv">
            <div><dt>Time Horizon</dt><dd>${fmt(getNum(assumptions, "timeHorizonYears") || 1)} year(s)</dd></div>
            <div><dt>Base Revenue Scope</dt><dd>${baseRevenue ? fmt(`$${formatNumber(baseRevenue / 1_000_000_000)}bn`) : "N/A"}</dd></div>
            <div><dt>Loyalty Revenue Mix</dt><dd>${loyaltyMix ? fmt(`${formatNumber(loyaltyMix)}%`) : "N/A"}</dd></div>
            <div><dt>Retail GM%</dt><dd>${gmPercent ? fmt(`${formatNumber(gmPercent)}%`) : "N/A"}</dd></div>
          </dl>
        </div>
        <div class="panel">
          <h3>Final Values / Stretch Case</h3>
          ${Object.keys(finalValues).length > 0 ? renderKV(finalValues) : ""}
          ${Object.keys(stretchCase).length > 0 ? `
            <dl class="kv">
              <div><dt>Mode</dt><dd>${fmt(getStr(stretchCase, "mode"))}</dd></div>
              <div><dt>Total GM</dt><dd>${fmt(`$${formatNumber(getNum(stretchCase, "totalGMUSD") / 1_000_000)}m`)}</dd></div>
            </dl>
          ` : ""}
        </div>
      </div>
      ${Object.keys(categoryRanges).length > 0 ? `
      <div class="panel">
        <h3>Category Uplift Ranges</h3>
        ${Object.entries(categoryRanges).map(([key, val]) => {
          if (!isObject(val)) return "";
          const range = getObj(val as LooseData, "rangePct");
          const mid = getNum(val as LooseData, "midpointPct");
          const stretch = getNum(val as LooseData, "stretchPct");
          return `
            <div class="subsection">
              <h4>${escapeHtml(formatLabel(key))}</h4>
              <dl class="kv">
                <div><dt>Range</dt><dd>${fmt(`${getNum(range, "min")}% - ${getNum(range, "max")}%`)}</dd></div>
                <div><dt>Midpoint</dt><dd>${fmt(`${mid}%`)}</dd></div>
                <div><dt>Stretch</dt><dd>${fmt(`${stretch}%`)}</dd></div>
              </dl>
              <p>${fmt(getStr(val as LooseData, "description"))}</p>
            </div>
          `;
        }).join("")}
      </div>
      ` : ""}
      ${Object.keys(baseCaseMidpoints).length > 0 ? `
      <div class="panel">
        <h3>Base Case Using Midpoints</h3>
        ${renderKV(baseCaseMidpoints)}
      </div>
      ` : ""}
    </section>
  `;
};

const renderContactPage = (logoDataUrl?: string | null) => `
  <section class="contact-page page-break">
    <div class="contact-content">
      ${logoDataUrl ? `<div class="contact-logo" style="background-image: url('${logoDataUrl}')"></div>` : ""}
      <h2>Let's Talk</h2>
      <p class="contact-tagline">Ready to unlock your gross margin opportunity?</p>
      
      <div class="contact-grid">
        <div class="contact-card">
          <h3>Schedule a Call</h3>
          <p>Book a 30-minute discovery call with our team to discuss your specific needs and how we can help.</p>
          <a href="https://hyperfinity.ai/contact-us" class="contact-link">hyperfinity.ai/contact-us</a>
        </div>
        
        <div class="contact-card">
          <h3>Email Us</h3>
          <p>Have questions about this report or want to learn more about our platform?</p>
          <a href="mailto:contact@hyperfinity.ai" class="contact-link">contact@hyperfinity.ai</a>
        </div>
      </div>
      
      <div class="contact-info">
        <div class="contact-item">
          <span class="contact-label">Website</span>
          <span class="contact-value">hyperfinity.ai</span>
        </div>
        <div class="contact-item">
          <span class="contact-label">LinkedIn</span>
          <span class="contact-value">linkedin.com/company/hyperfinity</span>
        </div>
      </div>
      
      <p class="contact-footer">
        Powered by HyperFinity Decision Intelligence<br />
        <span class="contact-copyright">© ${new Date().getFullYear()} HyperFinity. All rights reserved.</span>
      </p>
    </div>
    <div class="cover-stripe"></div>
  </section>
`;

const renderAppendices = (appendices: LooseData) => {
  const assumptionsBlock = getObj(appendices, "assumptionsBlock");
  const sourcesRaw = getArr(appendices, "sources");

  // Sources can be strings or objects with citation property
  const sources = sourcesRaw.map((s) => {
    if (typeof s === "string") return s;
    if (isObject(s)) return getStr(s, "citation") || extractText(s);
    return String(s);
  }).filter(Boolean);

  const assumptionMarkup = Object.keys(assumptionsBlock).length > 0
    ? Object.entries(assumptionsBlock)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key, value]) => {
          if (!isObject(value)) return "";
          const typedValue = value as LooseData;
          const breakdown = getArr(typedValue, "sixStepBreakdown") as string[];
          const uplift = typedValue.upliftPointAppliedPct ?? typedValue.upliftPercentApplied;
          const totalGM = typedValue.totalGMUpliftUSD ?? typedValue.totalGMUpliftUSD_m;

          return `
            <div class="subsection">
              <h4>${escapeHtml(formatLabel(key))}</h4>
              ${typeof uplift === "number" ? `<p><strong>Uplift Applied:</strong> ${formatNumber(uplift)}%</p>` : ""}
              ${typeof totalGM === "number" ? `<p><strong>Total GM Uplift:</strong> $${formatNumber(totalGM / 1_000_000)}m</p>` : ""}
              ${breakdown.length > 0 ? `<ul class="list">${breakdown.map((b) => `<li>${escapeHtml(String(b))}</li>`).join("")}</ul>` : ""}
            </div>
          `;
        })
        .join("")
    : "";

  return `
    <section class="section page-break">
      <h2>Appendices</h2>
      
      <div class="panel">
        <h3>Assumptions</h3>
        ${assumptionMarkup || "<p>No assumptions data available.</p>"}
      </div>
      
      <div class="panel">
        <h3>Sources</h3>
        ${sources.length > 0 ? `<ol class="sources-list">${sources.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>` : "<p>N/A</p>"}
      </div>
    </section>
  `;
};

// ============================================================================
// Main Export
// ============================================================================

export const generateHtmlReport = ({
  data,
  infographicBase64,
  logoDataUrl,
}: GenerateHtmlReportOptions): string => {
  const infographicDataUrl = infographicBase64 ?? null;
  
  const brandIntake = getObj(data, "brandIntake");
  const outputs = getObj(data, "outputs");
  const research = getObj(data, "research");
  const modelling = getObj(data, "modelling");
  const appendices = getObj(data, "appendices");

  const brandName = getStr(brandIntake, "brand") || "Unknown Brand";
  const reportTitle = `${brandName} ABM Pack Report`;

  const content = [
    infographicDataUrl
      ? renderCoverWithInfographic(brandName, infographicDataUrl)
      : renderCover(brandIntake),
    `<div class="page-break"></div>`,
    renderHeader(logoDataUrl),
    renderExecutiveSummary(outputs),
    renderBrandIntake(brandIntake),
    renderResearchFindings(research),
    renderValueCase(outputs),
    renderModelling(modelling),
    renderAppendices(appendices),
    renderContactPage(logoDataUrl),
  ].join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(reportTitle)}</title>
    <style>${reportCss}</style>
  </head>
  <body>
    <div class="page">${content}</div>
  </body>
</html>`;
};
