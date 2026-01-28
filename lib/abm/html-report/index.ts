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
  // Prioritize value+unit combo (e.g., {value: 13816.8, unit: "£m..."} → "13,816.8 £m...")
  if (typeof obj.value === "number" && typeof obj.unit === "string") {
    return `${formatNumber(obj.value)} ${obj.unit}`;
  }
  // Common text field names - include currency/percent variants
  const textKeys = [
    "quote", "text", "description", "value", "valueGBP", "valueUSD", "valueEUR", "valuePercent",
    "summary", "content", "label", "name", "title"
  ];
  for (const key of textKeys) {
    const val = obj[key];
    if (typeof val === "string" && val.length > 0) return val;
    // Also handle numeric values for currency fields
    if (typeof val === "number" && key.startsWith("value")) return String(val);
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
  const panel = $anyObj(outputs, "cfoReadinessPanel", "cfoPanelSnapshot");
  const dataConfidence = $obj(panel, "dataConfidence");
  
  // Try multiple key names for blended GM - may be a string, number, or nested object with valuePercent/value
  const blendedGMObj = $(panel, "blendedGMPercentUsed") || $(panel, "blendedGmPercentUsed") || $(panel, "blendedGM");
  let blendedGM = "N/A";
  if (typeof blendedGMObj === "number") {
    blendedGM = formatPercentage(blendedGMObj);
  } else if (typeof blendedGMObj === "string") {
    blendedGM = blendedGMObj;
  } else if (isObject(blendedGMObj)) {
    // Handle nested value object like { valuePercent: 48.1, ... }
    const numVal = $anyNum(blendedGMObj, "valuePercent", "value", "percent");
    if (numVal > 0) {
      blendedGM = formatPercentage(numVal);
    } else {
      blendedGM = $anyStr(blendedGMObj, "valuePercent", "value") || "N/A";
    }
  }

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

const renderInputMetrics = (outputs: LooseData, data: LooseData) => {
  // Try multiple paths for slide1InputTable (matches UI: outputs.slide1InputTable, outputs.slide1_inputTable, res.slide1InputTable)
  const slide1Table = $anyObj(outputs, "slide1InputTable", "slide1_inputTable") ||
                      $obj(data, "slide1InputTable");

  // Handle tableMarkdown format
  const tableMarkdown = $str(slide1Table, "tableMarkdown");

  // Handle array format - could be directly under outputs or nested
  // Check for both "rows" (normalized) and "table" (raw) keys
  const tableArray = Array.isArray(slide1Table)
    ? slide1Table
    : $arr(slide1Table, "rows").length > 0 
      ? $arr(slide1Table, "rows")
      : $arr(slide1Table, "table").length > 0
        ? $arr(slide1Table, "table")
        : $arr(outputs, "slide1InputTable");

  // Get notes - try multiple paths (matches UI)
  const slide1Notes = $str(slide1Table, "notes") ||
                      $str(outputs, "slide1Notes") ||
                      $str(data, "slide1InputTable", "notes");
  const notesObj = $obj(outputs, "slide1Notes");

  // If no data, skip section
  if (!tableMarkdown && (!Array.isArray(tableArray) || tableArray.length === 0) &&
      Object.keys(slide1Table).length === 0) {
    return "";
  }

  let tableHtml = "";

  // Render markdown table if present
  if (tableMarkdown) {
    const parsed = parseMarkdownTable(tableMarkdown);
    if (parsed) {
      tableHtml = `
        <table class="table">
          <thead>
            <tr>${parsed.headers.map((h) => `<th>${fmt(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${parsed.rows.map((row) => `<tr>${row.map((cell) => `<td>${fmt(cell)}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      `;
    }
  }

  // Render array format (matches UI: metric, valueOrEstimate/value, sourceOrLogic/source)
  // Also handle raw spaced keys from un-normalized data
  if (Array.isArray(tableArray) && tableArray.length > 0) {
    const rows = tableArray.map((row) => {
      if (!isObject(row)) return "";
      const metric = $anyStr(row, "metric", "Metric");
      const value = $anyStr(row, "valueOrEstimate", "value", "Value / Estimate");
      const source = $anyStr(row, "sourceOrLogic", "source", "Source / Logic");
      return `
        <tr>
          <td>${fmt(metric)}</td>
          <td>${fmt(value)}</td>
          <td class="source-cell">${fmt(source)}</td>
        </tr>
      `;
    }).join("");

    tableHtml += `
      <table class="table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  // Render notes section (matches UI handling of string, array, and object formats)
  let notesHtml = "";
  if (slide1Notes && typeof slide1Notes === "string") {
    notesHtml = `<p class="notes">${fmt(slide1Notes)}</p>`;
  }
  if (Array.isArray($arr(outputs, "slide1Notes"))) {
    const notesArr = $arr(outputs, "slide1Notes") as string[];
    notesHtml = notesArr.map((note) => `<p class="notes">${fmt(note)}</p>`).join("");
  }
  if (Object.keys(notesObj).length > 0 && !Array.isArray(notesObj)) {
    const keyProxies = $str(notesObj, "keyProxies");
    const dataGaps = $str(notesObj, "dataGapsAndInference");
    if (keyProxies) {
      notesHtml += `<p class="notes"><strong>Key Proxies:</strong> ${fmt(keyProxies)}</p>`;
    }
    if (dataGaps) {
      notesHtml += `<p class="notes"><strong>Data Gaps:</strong> ${fmt(dataGaps)}</p>`;
    }
  }

  return `
    <section class="section">
      <h2>Input Metrics</h2>
      <div class="panel">
        ${tableHtml || "<p>No input metrics data available.</p>"}
        ${notesHtml}
      </div>
    </section>
  `;
};

const renderResearchFindings = (research: LooseData) => {
  // Fuzzy match handles all naming variations automatically
  const financials = $anyObj(research, "financials", "financialsAndMargins");
  const loyaltyProgramme = $obj(research, "loyaltyProgramme");
  const benchmarks = $obj(research, "benchmarks");
  // Handle both loyaltySentiment and loyaltySentimentLast12Months
  const sentiment = $anyObj(research, "loyaltySentiment", "loyaltySentimentLast12Months", "sentiment");
  
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
          // Include currency-specific value keys: valueGBP, valueUSD, valueEUR, valuePercent
          const nested = $anyNum(val, "value", "valueGBP", "valueUSD", "valueEUR", "valuePercent", "amount", "total");
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
    // Helper to format a revenue value with the appropriate currency symbol
    const formatRevenue = (val: number, isGBP: boolean): string => {
      const symbol = isGBP ? "£" : "$";
      if (val >= 1_000_000_000) return `${symbol}${formatNumber(val / 1_000_000_000)}bn`;
      if (val >= 1_000_000) return `${symbol}${formatNumber(val / 1_000_000)}m`;
      return `${symbol}${formatNumber(val)}`;
    };
    
    // Try GBP paths first (e.g., New Look: financials.latestFiledRevenue.valueGBP)
    // Also handle M&S synthetic financials where totalRevenue.value is in £m and unit contains "£m"
    const totalRevObj = $obj(financials, "totalRevenue");
    const totalRevUnit = $str(totalRevObj, "unit");
    if ($num(totalRevObj, "value") > 0 && (totalRevUnit.includes("£m") || totalRevUnit.includes("£M"))) {
      return `£${formatNumber($num(totalRevObj, "value"))}m`;
    }
    const gbpPaths = [
      () => $num(finData, "latestFiledRevenue", "valueGBP"),
      () => $num(financials, "latestFiledRevenue", "valueGBP"),
      () => $num(finData, "latestFiledAnnualRevenue", "valueGBP"),
      () => $num(financials, "latestFiledAnnualRevenue", "valueGBP"),
      () => $num(finData, "revenue", "valueGBP"),
      () => $num(finData, "totalRevenueGBP"),
    ];
    for (const fn of gbpPaths) {
      const val = fn();
      if (val > 0) return formatRevenue(val, true);
    }
    
    // Try USD/general paths
    const usdPaths = [
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
    for (const fn of usdPaths) {
      const val = fn();
      if (val > 0) return formatRevenue(val, false);
    }
    
    // Fallback: search for any revenue-like value in financials
    let found = findNumericValue(financials, ["revenue", "sales", "netsales"]);
    if (found === 0) {
      // Try searching the entire research object
      found = findNumericValue(research, ["revenue", "sales", "netsales"]);
    }
    if (found > 0) {
      // Check if we're dealing with GBP data by looking for GBP indicators
      const isGBP = Object.keys(financials).some(k => k.toLowerCase().includes("gbp"));
      return formatRevenue(found, isGBP);
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
    
    // Try nested valuePercent paths (e.g., New Look: blendedGrossMarginPercent.valuePercent)
    const nestedValuePercent = $num(finData, "blendedGrossMarginPercent", "valuePercent") ||
                               $num(financials, "blendedGrossMarginPercent", "valuePercent") ||
                               $num(financials, "blendedGMPercentUsed", "value");
    if (nestedValuePercent > 0) return formatPercentage(nestedValuePercent);
    
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

  // Loyalty programme - handle nested structure (may be { programmeName: { value: "..." } })
  const progNameObj = $(loyaltyProgramme, "programmeName");
  const progName = typeof progNameObj === "string" 
    ? progNameObj 
    : isObject(progNameObj) 
      ? $anyStr(progNameObj, "value", "name") 
      : $anyStr(loyaltyProgramme, "name", "programmeName");
  
  // Launch date - may be nested object or string
  const launchDateObj = $(loyaltyProgramme, "launchDate");
  const launchEvolution = $(loyaltyProgramme, "launchAndEvolution");
  const launchText = typeof launchDateObj === "string"
    ? launchDateObj
    : isObject(launchDateObj)
      ? $anyStr(launchDateObj, "value", "date", "description")
      : typeof launchEvolution === "string" 
        ? launchEvolution 
        : isObject(launchEvolution) 
          ? $str(launchEvolution, "initialLaunch", "description") || extractText(launchEvolution)
          : "";

  // Benchmarks - handle different structures (including GBP values, descriptive text, and array formats)
  const aovData = $anyObj(benchmarks, "aov", "AOV", "categoryAOV_benchmark", "categoryAOVBenchmark", "categoryAovBenchmark");
  const aovVal = $anyNum(aovData, "estimateUsd", "valueUSD", "valueGBP", "value", "estimatedAovUsd") ||
                 $num(aovData, "brandOrCategoryAOV", "value");
  // Determine if this is GBP data
  const aovIsGBP = "valueGBP" in aovData || Object.keys(benchmarks).some(k => k.toLowerCase().includes("gbp"));
  // Fallback: descriptive string (from normalization, single-object value field, or array format)
  const aovBenchmarksArr = $arr(benchmarks, "aovBenchmarks");
  const aovDescription = !aovVal
    ? ($anyStr(aovData, "value") ||
       $anyStr(research, "aovBenchmark") ||
       (aovBenchmarksArr.length > 0 ? $anyStr(aovBenchmarksArr[0], "value", "metric") : ""))
    : "";

  const freqData = $anyObj(benchmarks, "purchaseFrequency", "purchaseFrequencyPerYear", "purchaseFrequency_benchmark", "purchaseFrequencyBenchmark");
  const freqVal = $anyNum(freqData, "transactionsPerActiveCustomerPerYear", "valuePerYear", "estimatedFrequencyPerYear", "frequency", "value") ||
                  $num(freqData, "estimatedAnnualPurchaseFrequencyPerActiveCustomer", "value");
  // Fallback: descriptive text for frequency benchmark (including array format)
  const freqBenchmarksArr = $arr(benchmarks, "purchaseFrequencyBenchmarks");
  const freqDescription = !freqVal
    ? ($anyStr(freqData, "value") ||
       $anyStr(research, "purchaseFrequencyBenchmark") ||
       (freqBenchmarksArr.length > 0 ? $anyStr(freqBenchmarksArr[0], "value", "metric") : ""))
    : "";

  // Sentiment table - handle different field names (matches UI: aspectDisplay, aspectDisplayName, aspect)
  const sentimentTable = $arr(sentiment, "sentimentTable");
  const sentimentRows = sentimentTable.map((row) => {
    if (!isObject(row)) return "";
    // Match UI field names: aspectDisplay, aspectDisplayName, aspect (plus spaced: Aspect)
    const aspect = $anyStr(row, "aspectDisplay", "aspectDisplayName", "aspect", "Aspect", "aspectLabel", "displayName", "aspectKey");
    // Handle both camelCase and spaced keys for summary
    const summary = $anyStr(row, "sentimentSummary", "Sentiment Summary");

    // Evidence can be array of strings, array of objects with quote property, or a string
    // Match UI: tries "evidence" first, then "evidenceQuotes" for legacy compatibility
    // Also handle "evidenceQuotesAndSources" (M&S shape) and spaced key "Evidence (Quotes & Sources)"
    let evidenceRaw = $arr(row, "evidence");
    if (evidenceRaw.length === 0) {
      evidenceRaw = $arr(row, "evidenceQuotes");
    }
    if (evidenceRaw.length === 0) {
      evidenceRaw = $arr(row, "evidenceQuotesAndSources");
    }
    // If still empty, check for string format
    const evidenceStr = $anyStr(row, "evidenceQuotesAndSources", "Evidence (Quotes & Sources)");
    
    let evidenceItems: string[] = [];
    if (evidenceRaw.length > 0) {
      evidenceItems = evidenceRaw.map((e) => {
        if (typeof e === "string") return e;
        // Match UI: checks for .quote property on objects
        if (isObject(e)) return $anyStr(e, "quote", "text", "content") || extractText(e);
        return String(e);
      }).filter(Boolean) as string[];
    } else if (evidenceStr) {
      // Parse quotes from string like '"Quote1" [1] "Quote2" [2]'
      evidenceItems = [evidenceStr];
    }

    return `
      <tr>
        <td>${fmt(aspect)}</td>
        <td>${fmt(summary)}</td>
        <td>${evidenceItems.length > 0 ? `<ul class="list">${evidenceItems.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>` : "N/A"}</td>
      </tr>
    `;
  }).join("");

  // Paid Media & Tech - handle both combined (paidMediaAndTech) and separate (paidMediaChannels, techStack)
  const paidMediaAndTech = $obj(research, "paidMediaAndTech");
  const paidMediaChannelsObj = $anyObj(research, "paidMediaChannels", "paidMedia");
  const techStackObj = $anyObj(research, "techStack", "technology");
  
  // Get paid media channels - may be string, array, or nested object with channels array
  let paidMediaChannels = $anyStr(paidMediaAndTech, "paidMediaChannels", "channels");
  if (!paidMediaChannels && Object.keys(paidMediaChannelsObj).length > 0) {
    const channelsArr = $arr(paidMediaChannelsObj, "channels");
    if (channelsArr.length > 0) {
      paidMediaChannels = channelsArr.map(c => typeof c === "string" ? c : extractText(c)).join(", ");
    } else {
      paidMediaChannels = extractText(paidMediaChannelsObj);
    }
  }
  
  // Get tech stack - may be combined string or object with multiple components
  let techStack = $anyStr(paidMediaAndTech, "techStack", "stack");
  if (!techStack && Object.keys(techStackObj).length > 0) {
    // Extract values from each tech stack component (commerce, marketingAutomation, etc.)
    const techParts: string[] = [];
    for (const [key, val] of Object.entries(techStackObj)) {
      if (key === "notes") continue;
      const valStr = isObject(val) ? $anyStr(val, "value", "name", "description") : String(val);
      if (valStr) techParts.push(valStr);
    }
    techStack = techParts.join("; ");
  }
  
  // Combine for rendering
  const hasPaidMediaOrTech = paidMediaChannels || techStack || Object.keys(paidMediaAndTech).length > 0;

  // Data Confidence Summary (matches UI: research.dataConfidenceSummary)
  const dataConfidenceSummary = $obj(research, "dataConfidenceSummary");

  return `
    <section class="section page-break">
      <h2>Research Findings</h2>
      
      <div class="subsection">
        <h3>Financials</h3>
        <div class="panel">
          <dl class="kv">
            <div><dt>Fiscal Year</dt><dd>${fmt(fiscalYear)}</dd></div>
            <div><dt>Total Revenue</dt><dd>${fmt(revenueVal)}</dd></div>
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
              <div><dt>AOV</dt><dd>${aovVal ? fmt(`${aovIsGBP ? "£" : "$"}${formatNumber(aovVal)}`) : fmt(aovDescription || "N/A")}</dd></div>
            </dl>
          </div>
          <div class="panel">
            <h4>Purchase Frequency</h4>
            <dl class="kv">
              <div><dt>Frequency</dt><dd>${freqVal ? fmt(`${formatNumber(freqVal)} per year`) : fmt(freqDescription || "N/A")}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Loyalty Sentiment</h3>
        <div class="panel">
          <p><strong>Overall Rating:</strong> ${fmt($anyStr(sentiment, "overallSentimentRating", "overallSentiment", "overallRating"))}</p>
          <p>${fmt($anyStr(sentiment, "summaryNarrative", "summary", "narrativeSummary"))}</p>
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

      ${hasPaidMediaOrTech ? `
      <div class="subsection">
        <h3>Paid Media & Tech Stack</h3>
        <div class="panel">
          <dl class="kv">
            ${paidMediaChannels ? `<div><dt>Paid Media Channels</dt><dd>${fmt(paidMediaChannels)}</dd></div>` : ""}
            ${techStack ? `<div><dt>Tech Stack</dt><dd>${fmt(techStack)}</dd></div>` : ""}
          </dl>
          ${!paidMediaChannels && !techStack && Object.keys(paidMediaAndTech).length > 0 ? renderKV(paidMediaAndTech) : ""}
        </div>
      </div>
      ` : ""}

      ${Object.keys(dataConfidenceSummary).length > 0 ? `
      <div class="subsection">
        <h3>Data Confidence Summary</h3>
        <div class="panel">
          <div class="badge-grid">
            ${Object.entries(dataConfidenceSummary).map(([key, level]) => `
              <div class="badge-item">
                <span class="badge-label">${escapeHtml(formatLabel(key))}</span>
                <span class="badge ${String(level).toLowerCase()}">${fmt(level)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
      ` : ""}
    </section>
  `;
};

const renderValueCase = (outputs: LooseData) => {
  // Fuzzy match handles: slide4ValueCaseTable, slide4_valueCaseTable, slide4_value_case_table, etc.
  const slide4 = getObjFuzzy(outputs, "slide4ValueCaseTable");

  let contentHtml = "";

  // Try tableMarkdown first (string format) - matches UI
  const tableMarkdown = $str(slide4, "tableMarkdown");
  if (tableMarkdown) {
    const table = parseMarkdownTable(tableMarkdown);
    if (table) {
      contentHtml += `
        <table class="table">
          <thead>
            <tr>${table.headers.map((header) => `<th>${fmt(header)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${fmt(cell)}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      `;
    }
  }

  // Helper to render value case cards (matches UI card-style rendering)
  const renderValueCaseCards = (rows: unknown[]): string => {
    return rows.map((row) => {
      if (!isObject(row)) return "";

      // Handle both normalized (camelCase) and raw (spaced keys) formats
      const areaOfImpact = $anyStr(row, "areaOfImpact", "Area of Impact");
      const opportunityType = $anyStr(row, "opportunityType", "Opportunity Type");

      // Match UI: multiple uplift field variants (including spaced GBP keys)
      const uplift = $anyNum(row,
        "estimatedUpliftGM",
        "estimatedUpliftGmUsd",
        "estimatedUpliftGmGbp",
        "estimatedUpliftGMGBP",
        "estimatedUpliftGm",
        "Estimated Uplift (£GM)",
        "Estimated Uplift ($GM)"
      );
      const upliftStr = $anyStr(row,
        "estimatedUpliftGM",
        "estimatedUpliftGmUsd",
        "estimatedUpliftGmGbp",
        "estimatedUpliftGMGBP",
        "estimatedUpliftGm",
        "Estimated Uplift (£GM)",
        "Estimated Uplift ($GM)"
      );

      // Format uplift like UI: $X.XXm (or use string value if already formatted)
      const upliftFormatted = uplift > 0
        ? `$${formatNumber(uplift, 2)}m`
        : upliftStr || "N/A";

      // Match UI: multiple methodology field variants (including spaced keys)
      const methodology = $anyStr(row,
        "assumptionsMethodology",
        "assumptionsAndMethodology",
        "assumptions",
        "methodology",
        "Assumptions / Methodology"
      );

      return `
        <div class="value-case-card">
          <div class="value-case-header">
            <div class="value-case-info">
              <p class="value-case-area">${fmt(areaOfImpact)}</p>
              <p class="value-case-type">${fmt(opportunityType)}</p>
            </div>
            <div class="value-case-uplift">
              <p class="uplift-value">${escapeHtml(upliftFormatted)}</p>
              <p class="uplift-label">GM Uplift</p>
            </div>
          </div>
          ${methodology ? `
          <div class="value-case-methodology">
            <p class="methodology-title">Methodology</p>
            <p class="methodology-content">${fmt(methodology)}</p>
          </div>
          ` : ""}
        </div>
      `;
    }).join("");
  };

  // Try table array format (matches UI: valueCase.table)
  const tableArray = $arr(slide4, "table");
  if (tableArray.length > 0) {
    contentHtml += renderValueCaseCards(tableArray);
  }

  // Try rows array format (matches UI: valueCase.rows)
  const rowsArray = $arr(slide4, "rows");
  if (rowsArray.length > 0) {
    contentHtml += renderValueCaseCards(rowsArray);
  }

  // If no card data but we have the slide4 object, try to render it as a generic table
  if (!contentHtml && Object.keys(slide4).length > 0) {
    // Fall back to rendering as key-value if it's a simple object
    const entries = Object.entries(slide4).filter(([k]) => k !== "tableMarkdown" && k !== "table" && k !== "rows");
    if (entries.length > 0) {
      contentHtml = renderKV(Object.fromEntries(entries));
    }
  }

  return `
    <section class="section page-break">
      <h2>Value Case</h2>
      ${contentHtml || "<p>No value case data available.</p>"}
    </section>
  `;
};

const renderModelling = (modelling: LooseData, appendices?: LooseData) => {
  // Match UI: Extract mode applied from various possible locations
  const getModeApplied = (): { valueCaseMode: string; reason: string } | null => {
    // Try finalModeApplied first
    const finalModeApplied = $obj(modelling, "finalModeApplied");
    if (Object.keys(finalModeApplied).length > 0) {
      return {
        valueCaseMode: $anyStr(finalModeApplied, "valueCaseMode", "mode", "value_case_mode"),
        reason: $anyStr(finalModeApplied, "reason", "rationale"),
      };
    }
    // Try finalAppliedUplifts.modeApplied
    const finalAppliedUplifts = $obj(modelling, "finalAppliedUplifts");
    if ($str(finalAppliedUplifts, "modeApplied")) {
      return {
        valueCaseMode: $str(finalAppliedUplifts, "modeApplied"),
        reason: $str(finalAppliedUplifts, "rationale"),
      };
    }
    // Try calculations.finalMode
    const calcsFinalMode = $obj(modelling, "calculations", "finalMode");
    if ($str(calcsFinalMode, "valueCaseMode")) {
      return {
        valueCaseMode: $str(calcsFinalMode, "valueCaseMode"),
        reason: $str(calcsFinalMode, "reason"),
      };
    }
    // Try modeApplied directly
    const modeApplied = $str(modelling, "modeApplied");
    if (modeApplied) {
      return {
        valueCaseMode: modeApplied,
        reason: $str(modelling, "modeRationale"),
      };
    }
    // Try thresholdRule.valueCaseModeApplied (M&S shape)
    const thresholdRule = $obj(modelling, "thresholdRule");
    const thresholdMode = $anyStr(thresholdRule, "valueCaseModeApplied", "mode");
    if (thresholdMode) {
      return {
        valueCaseMode: thresholdMode,
        reason: $anyStr(thresholdRule, "ruleCompliance", "baseCaseVsThreshold", "rationale"),
      };
    }
    return null;
  };

  const modeApplied = getModeApplied();

  // Match UI: multiple sources for key inputs
  const keyInputs = $anyObj(modelling, "keyInputs", "setup", "baseInputs");
  const upliftRanges = $anyObj(modelling, "upliftRanges", "credibleRanges");
  const levers = $obj(modelling, "levers");
  const baseCaseMidpoints = $anyObj(modelling, "baseCaseUsingMidpoints") ||
                            $obj(modelling, "calculations", "baseCaseUsingMidpoints");
  const finalAppliedUplifts = $obj(modelling, "finalAppliedUplifts");
  const finalUpliftsGM = $obj(modelling, "calculations", "finalUpliftsGM");
  const baseModellingAssumptions = $obj(modelling, "baseModellingAssumptions");
  const scopeAndBaseAssumptions = $obj(modelling, "scopeAndBaseAssumptions");
  const upliftRangesAndChosenPoints = $obj(modelling, "upliftRangesAndChosenPoints");
  const detailedCalculations = $obj(modelling, "detailedCalculations");
  const thresholdRuleApplication = $anyObj(modelling, "thresholdRuleApplication", "thresholdRule");
  const finalUpliftUsingStretchUp = $anyObj(modelling, "finalUpliftUsingStretchUp", "stretchUpApplied");
  // M&S-shape: additional modelling sections
  const midpointsApplied = $obj(modelling, "midpointsApplied");
  const baseCaseCalcMidpoint = $anyObj(modelling, "baseCaseCalculation_midpoint", "baseCaseCalculationMidpoint");
  const finalValueCaseMidpoint = $anyObj(modelling, "finalValueCase_midpoint", "finalValueCaseMidpoint");

  // Legacy fields
  const assumptions = $anyObj(modelling, "assumptions", "baseAssumptions");
  const stretchCase = $obj(modelling, "stretchCaseApplied");
  const finalValues = $obj(modelling, "finalValuesSelected");
  const categoryRanges = $obj(assumptions, "categoryUpliftRanges");

  // Extract key values from assumptions
  const baseRevenue = $num(assumptions, "baseRetailRevenueScopeUSD", "value") ||
                      $num(assumptions, "totalRevenueUSD_m") * 1_000_000;
  const loyaltyMix = $anyNum(assumptions, "loyaltyRevenueMixPct", "loyaltyMix") ||
                     $num(assumptions, "loyaltyRevenueMixPct", "value");
  const gmPercent = $anyNum(assumptions, "gmPercentRetail", "blendedGrossMarginPercent", "grossMarginPercent");

  // Modelling fallback from appendices (matches UI)
  const modellingFallback = appendices
    ? $obj(appendices, "assumptionsBlock", "overallModel")
    : {};

  // Check if we have any modelling data
  const hasModellingData = Object.keys(modelling).length > 0;

  let contentHtml = "";

  // Mode Applied - show prominently at top (matches UI)
  if (modeApplied && modeApplied.valueCaseMode) {
    contentHtml += `
      <div class="panel mode-panel">
        <h3>Mode Applied</h3>
        <p class="mode-value">${fmt(modeApplied.valueCaseMode)}</p>
        ${modeApplied.reason ? `<p class="mode-reason">${fmt(modeApplied.reason)}</p>` : ""}
      </div>
    `;
  }

  // Key Inputs / Setup (matches UI)
  if (Object.keys(keyInputs).length > 0) {
    contentHtml += `
      <div class="panel">
        <h3>Key Inputs</h3>
        ${renderKV(keyInputs)}
      </div>
    `;
  }

  // Uplift Ranges (matches UI)
  if (Object.keys(upliftRanges).length > 0) {
    contentHtml += `
      <div class="panel">
        <h3>Uplift Ranges (Evidence-Based)</h3>
        ${renderKV(upliftRanges)}
      </div>
    `;
  }

  // Levers (matches UI)
  if (Object.keys(levers).length > 0) {
    contentHtml += `
      <div class="panel">
        <h3>Lever Definitions</h3>
        ${renderKV(levers)}
      </div>
    `;
  }

  // Midpoints Applied (M&S shape)
  if (Object.keys(midpointsApplied).length > 0) {
    contentHtml += `
      <div class="panel">
        <h3>Midpoints Applied</h3>
        ${renderKV(midpointsApplied)}
      </div>
    `;
  }

  // Base Case Calculations (matches UI) - also covers baseCaseCalculation_midpoint (M&S shape)
  const baseCaseToRender = Object.keys(baseCaseMidpoints).length > 0 ? baseCaseMidpoints : baseCaseCalcMidpoint;
  if (Object.keys(baseCaseToRender).length > 0) {
    contentHtml += `
      <div class="panel">
        <h3>Base Case Calculations (Midpoints)</h3>
        ${renderKV(baseCaseToRender)}
      </div>
    `;
  }

  // Final Applied Uplifts (matches UI)
  if (Object.keys(finalAppliedUplifts).length > 0 && $obj(finalAppliedUplifts, "levers")) {
    contentHtml += `
      <div class="panel highlight-panel">
        <h3>Final Applied Uplifts</h3>
        ${renderKV(finalAppliedUplifts)}
      </div>
    `;
  }

  // Final GM Uplifts (matches UI)
  if (Object.keys(finalUpliftsGM).length > 0) {
    contentHtml += `
      <div class="panel highlight-panel">
        <h3>Final GM Uplifts</h3>
        ${renderKV(finalUpliftsGM)}
      </div>
    `;
  }

  // Final Value Case Midpoint (M&S shape)
  if (Object.keys(finalValueCaseMidpoint).length > 0) {
    contentHtml += `
      <div class="panel highlight-panel">
        <h3>Final Value Case (Midpoint)</h3>
        ${renderKV(finalValueCaseMidpoint)}
      </div>
    `;
  }

  // Base Modelling Assumptions (matches UI legacy)
  if (Object.keys(baseModellingAssumptions).length > 0) {
    contentHtml += `
      <div class="panel">
        <h3>Base Modelling Assumptions</h3>
        ${renderKV(baseModellingAssumptions)}
      </div>
    `;
  }

  // Scope & Base Assumptions (matches UI)
  if (Object.keys(scopeAndBaseAssumptions).length > 0) {
    contentHtml += `
      <div class="panel">
        <h3>Scope & Base Assumptions</h3>
        ${renderKV(scopeAndBaseAssumptions)}
      </div>
    `;
  }

  // Uplift Ranges & Chosen Points (matches UI)
  if (Object.keys(upliftRangesAndChosenPoints).length > 0) {
    contentHtml += `
      <div class="panel">
        <h3>Uplift Ranges & Chosen Points</h3>
        ${renderKV(upliftRangesAndChosenPoints)}
      </div>
    `;
  }

  // Detailed Calculations (matches UI)
  if (Object.keys(detailedCalculations).length > 0) {
    contentHtml += `
      <div class="panel">
        <h3>Detailed Calculations</h3>
        ${renderKV(detailedCalculations)}
      </div>
    `;
  }

  // Threshold Rule Application (matches UI)
  if (Object.keys(thresholdRuleApplication).length > 0) {
    contentHtml += `
      <div class="panel">
        <h3>Threshold Rule Application</h3>
        ${renderKV(thresholdRuleApplication)}
      </div>
    `;
  }

  // Final Uplift Using Stretch Up (matches UI)
  if (Object.keys(finalUpliftUsingStretchUp).length > 0) {
    contentHtml += `
      <div class="panel highlight-panel">
        <h3>Final Uplift Calculations</h3>
        ${renderKV(finalUpliftUsingStretchUp)}
      </div>
    `;
  }

  // Legacy: Base Assumptions panel
  if (Object.keys(assumptions).length > 0 && !contentHtml.includes("Key Inputs")) {
    contentHtml += `
      <div class="panel">
        <h3>Base Assumptions</h3>
        <dl class="kv">
          <div><dt>Time Horizon</dt><dd>${fmt($num(assumptions, "timeHorizonYears") || 1)} year(s)</dd></div>
          ${baseRevenue ? `<div><dt>Base Revenue Scope</dt><dd>${fmt(`$${formatNumber(baseRevenue / 1_000_000_000)}bn`)}</dd></div>` : ""}
          ${loyaltyMix ? `<div><dt>Loyalty Revenue Mix</dt><dd>${fmt(`${formatNumber(loyaltyMix)}%`)}</dd></div>` : ""}
          ${gmPercent ? `<div><dt>Retail GM%</dt><dd>${fmt(`${formatNumber(gmPercent)}%`)}</dd></div>` : ""}
        </dl>
      </div>
    `;
  }

  // Legacy: Final Values / Stretch Case
  if (Object.keys(finalValues).length > 0 || Object.keys(stretchCase).length > 0) {
    contentHtml += `
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
    `;
  }

  // Legacy: Category Uplift Ranges
  if (Object.keys(categoryRanges).length > 0) {
    contentHtml += `
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
    `;
  }

  // Fallback: Show overallModel from appendices if no modelling data (matches UI)
  if (!hasModellingData && Object.keys(modellingFallback).length > 0) {
    contentHtml += `
      <div class="panel">
        <h3>Overall Model Summary</h3>
        ${$str(modellingFallback, "thresholdRuleApplication") ? `
          <div class="subsection">
            <h4>Threshold Rule</h4>
            <p>${fmt($str(modellingFallback, "thresholdRuleApplication"))}</p>
          </div>
        ` : ""}
        ${$str(modellingFallback, "sensitivityNotes") ? `
          <div class="subsection">
            <h4>Sensitivity</h4>
            <p>${fmt($str(modellingFallback, "sensitivityNotes"))}</p>
          </div>
        ` : ""}
        ${Object.keys($obj(modellingFallback, "dataConfidenceSummary")).length > 0 ? `
          <div class="subsection">
            <h4>Data Confidence</h4>
            ${renderKV($obj(modellingFallback, "dataConfidenceSummary"))}
          </div>
        ` : ""}
      </div>
    `;
  }

  return `
    <section class="section">
      <h2>Modelling Details</h2>
      ${contentHtml || "<p>No modelling data available.</p>"}
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
          <a href="https://meetings.hubspot.com/tom-rigden" class="contact-link">Book a Call</a>
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
        Powered by HyperFinity Actionable Intelligence for Retail<br />
        <span class="contact-copyright">© ${new Date().getFullYear()} HyperFinity. All rights reserved.</span>
      </p>
    </div>
    <div class="cover-stripe"></div>
  </section>
`;

const renderAppendices = (appendices: LooseData) => {
  const assumptionsBlockRaw = $(appendices, "assumptionsBlock");
  const sourcesRaw = $arr(appendices, "sources");
  const sourcesAppendix = $obj(appendices, "sourcesAppendix");

  // Helper to extract source text from various formats
  const extractSourceText = (source: unknown): string => {
    if (typeof source === "string") return source;
    if (isObject(source)) {
      return $anyStr(source, "citation", "source", "reference", "description", "url") || extractText(source);
    }
    return String(source);
  };

  // Sources can be strings or objects with citation property (matches UI)
  const sources = sourcesRaw.map(extractSourceText).filter(Boolean);

  // Render assumptions - handle both object format and array format (matches UI)
  let assumptionMarkup = "";

  // Object format: {leverKey: {leverName, sixStepBreakdown, ...}} (matches UI)
  if (isObject(assumptionsBlockRaw) && !Array.isArray(assumptionsBlockRaw)) {
    const assumptionsBlock = assumptionsBlockRaw as LooseData;
    assumptionMarkup = Object.entries(assumptionsBlock)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => {
        if (!isObject(value)) return "";
        const typedValue = value as LooseData;
        // Match UI: leverName or formatted key
        const leverName = $str(typedValue, "leverName") || formatLabel(key);
        const breakdown = $arr(typedValue, "sixStepBreakdown") as string[];
        const uplift = $anyNum(typedValue, "upliftPointAppliedPct", "upliftPercentApplied", "uplift", "upliftPercentageApplied");
        const totalGM = $anyNum(typedValue, "totalGMUpliftUSD", "totalGMUpliftUSD_m", "totalGM");

        return `
          <div class="assumption-item">
            <h4>${escapeHtml(leverName)}</h4>
            ${uplift > 0 ? `<p><strong>Uplift Applied:</strong> ${formatNumber(uplift)}%</p>` : ""}
            ${totalGM > 0 ? `<p><strong>Total GM Uplift:</strong> $${formatNumber(totalGM / 1_000_000)}m</p>` : ""}
            ${breakdown.length > 0
              ? `<ul class="list">${breakdown.map((b) => `<li>${escapeHtml(String(b))}</li>`).join("")}</ul>`
              : renderKV(typedValue)}
          </div>
        `;
      })
      .join("");
  }

  // Array format: [{leverName, ...}] (matches UI)
  if (Array.isArray(assumptionsBlockRaw) && assumptionsBlockRaw.length > 0) {
    assumptionMarkup = (assumptionsBlockRaw as LooseData[]).map((item, idx) => {
      if (!isObject(item)) return "";
      const leverName = $str(item, "leverName") || `Lever ${idx + 1}`;
      const breakdown = $arr(item, "sixStepBreakdown") as string[];
      const uplift = $anyNum(item, "upliftPointAppliedPct", "upliftPercentApplied", "uplift", "upliftPercentageApplied");
      const totalGM = $anyNum(item, "totalGMUpliftUSD", "totalGMUpliftUSD_m", "totalGM");
      const estimatedUpliftGM = $str(item, "estimatedUpliftGM");
      
      // Check for step-by-step fields (from value case table extraction)
      const upliftDesc = $str(item, "upliftPointDescription");
      const rangeSource = $str(item, "credibleRange", "source") || $str(item, "rangeAndSource");
      const rationale = $str(item, "selectionRationale");
      const mathsExplain = $str(item, "mathsExplanation");
      const resultStmt = $str(item, "resultStatement");
      const reassurance = $str(item, "reassuranceStatement");
      
      const hasStepFields = upliftDesc || rangeSource || rationale || mathsExplain || resultStmt || reassurance;

      // Build step-by-step list if we have those fields
      let stepsHtml = "";
      if (hasStepFields) {
        const steps = [
          upliftDesc ? `<li><strong>Uplift Applied:</strong> ${escapeHtml(upliftDesc)}</li>` : "",
          rangeSource ? `<li><strong>Range & Source:</strong> ${escapeHtml(rangeSource)}</li>` : "",
          rationale ? `<li><strong>Why Selected:</strong> ${escapeHtml(rationale)}</li>` : "",
          mathsExplain ? `<li><strong>Calculation:</strong> ${escapeHtml(mathsExplain)}</li>` : "",
          resultStmt ? `<li><strong>Result:</strong> ${escapeHtml(resultStmt)}</li>` : "",
          reassurance ? `<li><strong>Reassurance:</strong> ${escapeHtml(reassurance)}</li>` : "",
        ].filter(Boolean).join("");
        stepsHtml = `<ul class="list">${steps}</ul>`;
      }

      return `
        <div class="assumption-item">
          <h4>${escapeHtml(leverName)}</h4>
          ${estimatedUpliftGM ? `<p><strong>Estimated GM Uplift:</strong> ${escapeHtml(estimatedUpliftGM)}</p>` : ""}
          ${uplift > 0 ? `<p><strong>Uplift Applied:</strong> ${formatNumber(uplift)}%</p>` : ""}
          ${totalGM > 0 ? `<p><strong>Total GM Uplift:</strong> $${formatNumber(totalGM / 1_000_000)}m</p>` : ""}
          ${breakdown.length > 0
            ? `<ul class="list">${breakdown.map((b) => `<li>${escapeHtml(String(b))}</li>`).join("")}</ul>`
            : hasStepFields 
              ? stepsHtml
              : renderKV(item)}
        </div>
      `;
    }).join("");
  }

  // Render sources - handle both sourcesAppendix (categorized) and sources (flat array) (matches UI)
  let sourcesMarkup = "";

  // sourcesAppendix: categorized format (matches UI)
  if (Object.keys(sourcesAppendix).length > 0) {
    sourcesMarkup = Object.entries(sourcesAppendix).map(([category, categorySources]) => {
      const categoryHtml = `<h4>${escapeHtml(formatLabel(category))}</h4>`;
      if (Array.isArray(categorySources)) {
        const sourcesList = (categorySources as unknown[]).map(extractSourceText).filter(Boolean);
        return `
          <div class="source-category">
            ${categoryHtml}
            <ul class="list">${sourcesList.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
          </div>
        `;
      }
      return `
        <div class="source-category">
          ${categoryHtml}
          <p>${escapeHtml(String(categorySources))}</p>
        </div>
      `;
    }).join("");
  }

  // Flat sources array (matches UI)
  if (sources.length > 0 && !sourcesMarkup) {
    sourcesMarkup = `<ol class="sources-list">${sources.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>`;
  }

  return `
    <section class="section page-break">
      <h2>Appendices</h2>

      <div class="panel">
        <h3>A) Detailed Assumptions</h3>
        ${assumptionMarkup || "<p>No assumptions data available.</p>"}
      </div>

      <div class="panel">
        <h3>B) Sources</h3>
        ${sourcesMarkup || "<p>N/A</p>"}
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
    renderInputMetrics(outputs, data),  // Added: matches UI Input Metrics tab
    renderResearchFindings(research),
    renderValueCase(outputs),
    renderModelling(modelling, appendices),  // Pass appendices for fallback handling
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
