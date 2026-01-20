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
// Generic Data Access Helpers (all use fuzzy key matching)
// ============================================================================

const isObject = (val: unknown): val is LooseData =>
  val !== null && typeof val === "object" && !Array.isArray(val);

// Normalize key for fuzzy matching: lowercase, remove underscores/hyphens/spaces
const normalizeKey = (key: string): string =>
  key.toLowerCase().replace(/[_\-\s]/g, "");

// Find a key in an object using fuzzy matching
const findKey = (obj: LooseData, pattern: string): string | undefined => {
  const normalized = normalizeKey(pattern);
  // Try exact match first
  if (pattern in obj) return pattern;
  // Then fuzzy match
  return Object.keys(obj).find((k) => normalizeKey(k) === normalized);
};

// Core fuzzy getter - traverses nested paths with fuzzy matching at each level
const $ = (source: unknown, ...keys: string[]): unknown => {
  let current: unknown = source;
  for (const key of keys) {
    if (!isObject(current)) return undefined;
    const actualKey = findKey(current, key);
    current = actualKey ? current[actualKey] : undefined;
  }
  return current;
};

// Typed fuzzy getters
const $str = (source: unknown, ...keys: string[]): string => {
  const val = $(source, ...keys);
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  return "";
};

const $num = (source: unknown, ...keys: string[]): number => {
  const val = $(source, ...keys);
  return typeof val === "number" ? val : 0;
};

const $obj = (source: unknown, ...keys: string[]): LooseData => {
  const val = $(source, ...keys);
  return isObject(val) ? val : {};
};

const $arr = (source: unknown, ...keys: string[]): unknown[] => {
  const val = $(source, ...keys);
  return Array.isArray(val) ? val : [];
};

// Try multiple key names at same level, return first match as object
const $anyObj = (source: unknown, ...keys: string[]): LooseData => {
  for (const key of keys) {
    const val = $obj(source, key);
    if (Object.keys(val).length > 0) return val;
  }
  return {};
};

// Try multiple key names at same level, return first match as string
const $anyStr = (source: unknown, ...keys: string[]): string => {
  for (const key of keys) {
    const val = $str(source, key);
    if (val) return val;
  }
  return "";
};

// Try multiple key names at same level, return first match as number
const $anyNum = (source: unknown, ...keys: string[]): number => {
  for (const key of keys) {
    const val = $num(source, key);
    if (val !== 0) return val;
  }
  return 0;
};

// Try multiple paths (each path is array of keys), return first truthy result
const $tryPaths = <T>(source: unknown, paths: string[][], transform: (val: unknown) => T, fallback: T): T => {
  for (const path of paths) {
    const val = $(source, ...path);
    if (val !== undefined && val !== null && val !== "" && val !== 0) {
      return transform(val);
    }
  }
  return fallback;
};

// Legacy aliases for compatibility
const get = $;
const getStr = $str;
const getNum = $num;
const getObj = $obj;
const getArr = $arr;
const getFuzzy = (source: unknown, key: string) => $(source, key);
const getObjFuzzy = (source: unknown, key: string) => $obj(source, key);
const getArrFuzzy = (source: unknown, key: string) => $arr(source, key);
const getStrFuzzy = (source: unknown, key: string) => $str(source, key);
const tryPaths = $tryPaths;

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
  const panel = $obj(outputs, "cfoReadinessPanel");
  const dataConfidence = $obj(panel, "dataConfidence");
  
  // Try multiple key names for blended GM
  const blendedGMRaw = $anyStr(panel, "blendedGMPercentUsed", "blendedGmPercentUsed", "blendedGM");
  const blendedGMNum = $anyNum(panel, "blendedGMPercentUsed", "blendedGmPercentUsed", "blendedGM");
  const blendedGM = blendedGMNum > 0 ? formatPercentage(blendedGMNum) : blendedGMRaw || "N/A";

  return `
    <section class="section">
      <h2>Executive Summary</h2>
      <div class="highlight-box">
        <p>${fmt($str(outputs, "executiveOneLiner"))}</p>
      </div>
      <div class="grid two">
        <div class="panel">
          <h3>CFO Readiness Panel</h3>
          <dl class="kv">
            <div><dt>Blended GM% Used</dt><dd>${fmt(blendedGM)}</dd></div>
            <div><dt>Brand Type</dt><dd>${fmt($str(panel, "brandType"))}</dd></div>
            <div><dt>Value Case Mode</dt><dd>${fmt($str(panel, "valueCaseMode"))}</dd></div>
          </dl>
        </div>
        <div class="panel">
          <h3>Data Confidence</h3>
          <dl class="kv">
            <div><dt>Revenue</dt><dd><span class="badge">${fmt($str(dataConfidence, "revenue"))}</span></dd></div>
            <div><dt>Loyalty</dt><dd><span class="badge">${fmt($str(dataConfidence, "loyalty"))}</span></dd></div>
            <div><dt>AOV</dt><dd><span class="badge">${fmt($anyStr(dataConfidence, "aov", "AOV"))}</span></dd></div>
            <div><dt>Frequency</dt><dd><span class="badge">${fmt($str(dataConfidence, "frequency"))}</span></dd></div>
          </dl>
        </div>
      </div>
      <div class="panel">
        <h3>Summary</h3>
        <p>${fmt($str(outputs, "executiveSummary"))}</p>
      </div>
    </section>
  `;
};

const renderBrandIntake = (brandIntake: LooseData) => {
  // businessRegistry can be string or object - handle both
  const registry = $(brandIntake, "businessRegistry");
  const registryText = typeof registry === "string" 
    ? registry 
    : isObject(registry) 
      ? $anyStr(registry, "description", "secEdgarLink", "link")
      : "";

  return `
    <section class="section">
      <h2>Brand Intake</h2>
      <div class="panel">
        <dl class="kv">
          <div><dt>Brand</dt><dd>${fmt($str(brandIntake, "brand"))}</dd></div>
          <div><dt>Website</dt><dd>${fmt($str(brandIntake, "website"))}</dd></div>
          <div><dt>Category</dt><dd>${fmt($str(brandIntake, "category"))}</dd></div>
          <div><dt>Brand Type</dt><dd>${fmt($str(brandIntake, "brandType"))}</dd></div>
          <div><dt>Business Registry</dt><dd>${fmt(registryText)}</dd></div>
          <div><dt>Contextual Notes</dt><dd>${fmt($str(brandIntake, "contextualNotes"))}</dd></div>
        </dl>
      </div>
    </section>
  `;
};

const renderResearchFindings = (research: LooseData) => {
  // Fuzzy match handles all naming variations automatically
  const financials = $anyObj(research, "financials", "financialsAndMargins");
  const loyaltyProgramme = $obj(research, "loyaltyProgramme");
  const benchmarks = $obj(research, "benchmarks");
  const sentiment = $obj(research, "loyaltySentiment");
  
  // Financials can be nested under latestRevenueGM or direct
  const finDataNested = $obj(financials, "latestRevenueGM");
  const finData = Object.keys(finDataNested).length > 0 ? finDataNested : financials;

  // Get fiscal year - try multiple key names
  const fiscalYear = $anyStr(finData, "fiscalYear", "latestFiscalYear", "latestFinancialYear") ||
                     $str(financials, "latestFinancialYear");

  // Recursively find a numeric value in an object matching key patterns
  const findNumericValue = (obj: unknown, patterns: string[]): number => {
    if (!isObject(obj)) return 0;
    for (const [key, val] of Object.entries(obj)) {
      const normKey = normalizeKey(key);
      if (patterns.some((p) => normKey.includes(normalizeKey(p)))) {
        if (typeof val === "number" && val > 0) return val;
        if (isObject(val)) {
          const nested = $anyNum(val, "value", "amount", "total");
          if (nested > 0) return nested;
        }
      }
    }
    // Search one level deeper
    for (const val of Object.values(obj)) {
      if (isObject(val)) {
        const found = findNumericValue(val, patterns);
        if (found > 0) return found;
      }
    }
    return 0;
  };

  // Get revenue - try multiple paths (handles various naming conventions)
  const getRevenueValue = (): string => {
    // Try specific paths first
    const specificPaths = [
      // Nested under revenue object (e.g., Ulta: financials.revenue.netSales)
      () => $num(finData, "revenue", "netSales"),
      () => $num(finData, "revenue", "value"),
      () => $num(financials, "revenue", "netSales"),
      // Direct paths
      () => $num(finData, "totalRevenueUSD", "value"),
      () => $num(finData, "totalRevenueUSD"),
      () => $num(finData, "netSales", "valueUsdBnApprox") * 1_000_000_000,
      () => $num(finData, "netSales", "valueEurBn") * 1_000_000_000,
      () => $num(finData, "netSalesUsdBn") * 1_000_000_000,
      () => $num(financials, "netSalesAndGMBase", "netSalesUsdBn") * 1_000_000_000,
      () => $anyNum(finData, "revenue", "totalRevenue", "netSales", "sales"),
      () => $anyNum(financials, "revenue", "totalRevenue", "netSales", "sales"),
    ];
    for (const fn of specificPaths) {
      const val = fn();
      if (val > 0) {
        // Determine scale (billions, millions, or raw)
        if (val >= 1_000_000_000) return `$${formatNumber(val / 1_000_000_000)}bn`;
        if (val >= 1_000_000) return `$${formatNumber(val / 1_000_000)}m`;
        return `$${formatNumber(val)}`;
      }
    }
    
    // Fallback: search for any revenue-like value in financials
    let found = findNumericValue(financials, ["revenue", "sales", "netsales"]);
    if (found === 0) {
      // Try searching the entire research object
      found = findNumericValue(research, ["revenue", "sales", "netsales"]);
    }
    if (found > 0) {
      if (found >= 1_000_000_000) return `$${formatNumber(found / 1_000_000_000)}bn`;
      if (found >= 1_000_000) return `$${formatNumber(found / 1_000_000)}m`;
      return `$${formatNumber(found)}`;
    }
    
    return "N/A";
  };
  const revenueVal = getRevenueValue();
  
  // Get GM% - try multiple paths
  const getGMPercent = (): string => {
    // Try nested under grossMargin object first (e.g., Ulta: financials.grossMargin.gmPercent)
    const nestedGM = $num(finData, "grossMargin", "gmPercent") ||
                     $num(financials, "grossMargin", "gmPercent") ||
                     $num(finData, "grossMargin", "percent") ||
                     $num(finData, "grossMargin", "value");
    if (nestedGM > 0) return formatPercentage(nestedGM);
    
    // Try direct paths
    const gmVal = $anyNum(finData, 
      "consolidatedGrossMarginPct", 
      "blendedGrossMarginPercent", 
      "grossMarginPercent",
      "grossMargin",
      "gmPercent",
      "segmentRetailPCWGrossMarginPct"
    ) || $num(financials, "netSalesAndGMBase", "grossMarginPercent");
    
    if (gmVal > 0) return formatPercentage(gmVal);
    
    // Try nested value paths
    const nestedVal = $num(finData, "consolidatedGrossMarginPct", "value") ||
                      $num(finData, "blendedGrossMarginPercent", "value");
    if (nestedVal > 0) return formatPercentage(nestedVal);
    
    // Fallback: search for any GM-like value (0-100 range)
    let foundGM = findNumericValue(financials, ["grossmargin", "gm", "margin"]);
    if (foundGM === 0) {
      foundGM = findNumericValue(research, ["grossmargin", "gm", "margin"]);
    }
    if (foundGM > 0 && foundGM <= 100) return formatPercentage(foundGM);
    
    return "N/A";
  };
  const gmPercent = getGMPercent();

  // Loyalty programme - handle nested structure
  const progName = $anyStr(loyaltyProgramme, "name", "programmeName");
  const launchEvolution = $(loyaltyProgramme, "launchAndEvolution");
  const launchText = typeof launchEvolution === "string" 
    ? launchEvolution 
    : isObject(launchEvolution) 
      ? $str(launchEvolution, "initialLaunch", "description") || extractText(launchEvolution)
      : "";

  // Benchmarks - handle different structures  
  const aovData = $anyObj(benchmarks, "aov", "AOV");
  const aovVal = $anyNum(aovData, "valueUSD", "value", "estimatedAovUsd") || 
                 $num(aovData, "brandOrCategoryAOV", "value");
  const freqData = $obj(benchmarks, "purchaseFrequency");
  const freqVal = $anyNum(freqData, "valuePerYear", "estimatedFrequencyPerYear") || 
                  $num(freqData, "estimatedAnnualPurchaseFrequencyPerActiveCustomer", "value");

  // Sentiment table - handle different field names
  const sentimentTable = $arr(sentiment, "sentimentTable");
  const sentimentRows = sentimentTable.map((row) => {
    if (!isObject(row)) return "";
    const aspect = $anyStr(row, "aspectLabel", "displayName", "aspectKey");
    const summary = $str(row, "sentimentSummary");
    
    // Evidence can be array of strings or array of objects with quote property
    const evidenceRaw = $arr(row, "evidenceQuotes");
    const evidenceItems = evidenceRaw.map((e) => {
      if (typeof e === "string") return e;
      if (isObject(e)) return $anyStr(e, "quote", "text", "content") || extractText(e);
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
            <div><dt>Fiscal Year</dt><dd>${fmt(fiscalYear)}</dd></div>
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
  // Fuzzy match handles: slide4ValueCaseTable, slide4_valueCaseTable, slide4_value_case_table, etc.
  const slide4 = getObjFuzzy(outputs, "slide4ValueCaseTable");
  
  // Try tableMarkdown first (string format)
  const tableMarkdown = $str(slide4, "tableMarkdown");
  if (tableMarkdown) {
    const table = parseMarkdownTable(tableMarkdown);
    if (table) {
      return `
        <section class="section page-break">
          <h2>Value Case</h2>
          <table class="table">
            <thead>
              <tr>${table.headers.map((header) => `<th>${fmt(header)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${fmt(cell)}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
        </section>
      `;
    }
  }
  
  // Try table array format (array of row objects)
  const tableArray = $arr(slide4, "table");
  if (tableArray.length > 0) {
    const firstRow = tableArray[0];
    if (isObject(firstRow)) {
      const keys = Object.keys(firstRow);
      const headers = keys.map((k) => formatLabel(k));
      
      const rows = tableArray.map((row) => {
        if (!isObject(row)) return "";
        return `<tr>${keys.map((k) => `<td>${fmt((row as LooseData)[k])}</td>`).join("")}</tr>`;
      }).join("");
      
      return `
        <section class="section page-break">
          <h2>Value Case</h2>
          <table class="table">
            <thead>
              <tr>${headers.map((h) => `<th>${fmt(h)}</th>`).join("")}</tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>
      `;
    }
  }

  return `
    <section class="section page-break">
      <h2>Value Case</h2>
      <p>No value case data available.</p>
    </section>
  `;
};

const renderModelling = (modelling: LooseData) => {
  // Try multiple paths for assumptions
  const assumptions = $anyObj(modelling, "assumptions", "baseAssumptions", "baseModellingAssumptions");
  const baseCaseMidpoints = $obj(modelling, "baseCaseUsingMidpoints");
  const stretchCase = $obj(modelling, "stretchCaseApplied");
  const finalValues = $obj(modelling, "finalValuesSelected");

  // Extract key values from assumptions
  const baseRevenue = $num(assumptions, "baseRetailRevenueScopeUSD", "value") || 
                      $num(assumptions, "totalRevenueUSD_m") * 1_000_000;
  const loyaltyMix = $anyNum(assumptions, "loyaltyRevenueMixPct", "loyaltyMix") || 
                     $num(assumptions, "loyaltyRevenueMixPct", "value");
  const gmPercent = $anyNum(assumptions, "gmPercentRetail", "blendedGrossMarginPercent", "grossMarginPercent");

  // Get category uplift ranges if present
  const categoryRanges = $obj(assumptions, "categoryUpliftRanges");

  return `
    <section class="section">
      <h2>Modelling Details</h2>
      <div class="grid two">
        <div class="panel">
          <h3>Base Assumptions</h3>
          <dl class="kv">
            <div><dt>Time Horizon</dt><dd>${fmt($num(assumptions, "timeHorizonYears") || 1)} year(s)</dd></div>
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
              <div><dt>Mode</dt><dd>${fmt($str(stretchCase, "mode"))}</dd></div>
              <div><dt>Total GM</dt><dd>${fmt(`$${formatNumber($num(stretchCase, "totalGMUSD") / 1_000_000)}m`)}</dd></div>
            </dl>
          ` : ""}
        </div>
      </div>
      ${Object.keys(categoryRanges).length > 0 ? `
      <div class="panel">
        <h3>Category Uplift Ranges</h3>
        ${Object.entries(categoryRanges).map(([key, val]) => {
          if (!isObject(val)) return "";
          const range = $obj(val as LooseData, "rangePct");
          const mid = $num(val as LooseData, "midpointPct");
          const stretch = $num(val as LooseData, "stretchPct");
          return `
            <div class="subsection">
              <h4>${escapeHtml(formatLabel(key))}</h4>
              <dl class="kv">
                <div><dt>Range</dt><dd>${fmt(`${$num(range, "min")}% - ${$num(range, "max")}%`)}</dd></div>
                <div><dt>Midpoint</dt><dd>${fmt(`${mid}%`)}</dd></div>
                <div><dt>Stretch</dt><dd>${fmt(`${stretch}%`)}</dd></div>
              </dl>
              <p>${fmt($str(val as LooseData, "description"))}</p>
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
  const assumptionsBlock = $obj(appendices, "assumptionsBlock");
  const sourcesRaw = $arr(appendices, "sources");

  // Sources can be strings or objects with citation property
  const sources = sourcesRaw.map((s) => {
    if (typeof s === "string") return s;
    if (isObject(s)) return $anyStr(s, "citation", "source", "reference") || extractText(s);
    return String(s);
  }).filter(Boolean);

  const assumptionMarkup = Object.keys(assumptionsBlock).length > 0
    ? Object.entries(assumptionsBlock)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key, value]) => {
          if (!isObject(value)) return "";
          const typedValue = value as LooseData;
          const breakdown = $arr(typedValue, "sixStepBreakdown") as string[];
          const uplift = $anyNum(typedValue, "upliftPointAppliedPct", "upliftPercentApplied", "uplift");
          const totalGM = $anyNum(typedValue, "totalGMUpliftUSD", "totalGMUpliftUSD_m", "totalGM");

          return `
            <div class="subsection">
              <h4>${escapeHtml(formatLabel(key))}</h4>
              ${uplift > 0 ? `<p><strong>Uplift Applied:</strong> ${formatNumber(uplift)}%</p>` : ""}
              ${totalGM > 0 ? `<p><strong>Total GM Uplift:</strong> $${formatNumber(totalGM / 1_000_000)}m</p>` : ""}
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
  
  // All section accessors use fuzzy matching
  const brandIntake = $obj(data, "brandIntake");
  const outputs = $obj(data, "outputs");
  const research = $obj(data, "research");
  const modelling = $obj(data, "modelling");
  const appendices = $obj(data, "appendices");

  const brandName = $str(brandIntake, "brand") || "Unknown Brand";
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
