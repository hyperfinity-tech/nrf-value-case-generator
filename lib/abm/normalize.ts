import type { AbmPackOutput } from "@/app/(chat)/api/abm-pack/schema";

type LooseObj = Record<string, unknown>;

/**
 * Check if a value is a plain object (not null, not array)
 */
function isObject(val: unknown): val is LooseObj {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}

/**
 * Extract a scalar value from an object that may wrap values in { value: X, confidence: Y }
 * Also handles valueGBP, valueUSD, valuePercent patterns
 */
function extractValue(obj: unknown): unknown {
  if (!isObject(obj)) return obj;
  
  // Common value wrapper patterns
  const valueKeys = ["value", "valueGBP", "valueUSD", "valuePercent", "valueEUR", "quote", "text"];
  for (const key of valueKeys) {
    if (key in obj && obj[key] !== undefined) {
      const val = obj[key];
      // Don't recurse infinitely - if the value is itself an object with a value, extract it
      if (isObject(val) && "value" in val) {
        return extractValue(val);
      }
      return val;
    }
  }
  
  // If no value key found, return the object itself
  return obj;
}

/**
 * Extract a string value, handling nested value objects
 */
function extractString(obj: unknown): string {
  const val = extractValue(obj);
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (Array.isArray(val)) return val.map(extractString).join(", ");
  if (isObject(val)) {
    // Try to stringify first relevant field
    const keys = ["description", "summary", "name", "label", "text"];
    for (const k of keys) {
      if (typeof val[k] === "string") return val[k] as string;
    }
  }
  return "";
}

/**
 * Extract a numeric value, handling nested value objects
 */
function extractNumber(obj: unknown): number {
  const val = extractValue(obj);
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const parsed = Number.parseFloat(val.replace(/[^0-9.-]/g, ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Normalize brand intake section
 */
function normalizeBrandIntake(raw: unknown): LooseObj {
  if (!isObject(raw)) return {};
  
  const result: LooseObj = {};
  
  // Brand name - direct string
  result.brand = typeof raw.brand === "string" ? raw.brand : "";
  
  // Website - may be nested in officialWebsite or website
  const website = raw.officialWebsite ?? raw.website;
  result.website = extractString(website);
  
  // Registry link - may be in companiesHouse, registryLink, or businessRegistry
  const registry = raw.companiesHouse ?? raw.registryLink ?? raw.businessRegistry;
  if (isObject(registry)) {
    // Extract useful registry fields
    result.registryLink = (registry.registryLink as string) ?? 
                          (registry.secEdgarLink as string) ?? 
                          (registry.link as string) ?? 
                          extractString(registry);
  } else {
    result.registryLink = extractString(registry);
  }
  
  // Category
  result.category = extractString(raw.category);
  
  // Brand type
  result.brandType = extractString(raw.brandType);
  
  // Contextual notes - may be contextNotes or contextualNotes
  result.contextualNotes = extractString(raw.contextNotes ?? raw.contextualNotes);
  
  return result;
}

/**
 * Normalize research section - flatten nested value objects
 */
function normalizeResearch(raw: unknown): LooseObj {
  if (!isObject(raw)) return {};
  
  const result: LooseObj = {};
  
  // Financials
  const fin = raw.financials as LooseObj | undefined;
  if (isObject(fin)) {
    // Latest revenue
    const revenue = fin.latestFiledRevenue ?? fin.revenue ?? fin.latestAnnualRevenue;
    if (isObject(revenue)) {
      const revenueVal = extractNumber(revenue);
      const fiscalPeriod = extractString((revenue as LooseObj).fiscalPeriod ?? (revenue as LooseObj).fiscalYear);
      result.latestAnnualRevenue = revenueVal > 0 
        ? `£${(revenueVal / 1_000_000).toFixed(1)}m (${fiscalPeriod})` 
        : extractString(revenue);
    } else {
      result.latestAnnualRevenue = extractString(revenue);
    }
    result.latestAnnualRevenueSource = extractString(fin.latestFiledRevenueSource ?? fin.revenueSource);
    
    // Gross margin
    const gm = fin.blendedGrossMarginPercent ?? fin.grossMargin ?? fin.blendedGMPercent;
    result.blendedGrossMarginPercent = extractNumber(gm);
    result.blendedGrossMarginSource = extractString(fin.blendedGrossMarginSource ?? fin.gmSource);
    
    // Keep full financials for renderers that need nested structure
    result.financials = fin;
  }
  
  // Loyalty programme
  const loyalty = raw.loyaltyProgramme ?? raw.loyaltyProgram ?? raw.loyalty;
  if (isObject(loyalty)) {
    result.loyaltyProgrammeDetails = extractString(loyalty.programmeName ?? loyalty.name);
    result.loyaltyProgrammePenetration = extractString(loyalty.penetrationEstimate ?? loyalty.penetration);
    result.loyaltyProgrammeLaunchDate = extractString(loyalty.launchDate);
    
    // Benefits can be array or string
    const benefits = loyalty.benefits;
    if (Array.isArray(benefits)) {
      result.loyaltyProgrammeBenefits = benefits.map(b => extractString(b)).join("; ");
    } else {
      result.loyaltyProgrammeBenefits = extractString(benefits);
    }
    
    result.activeLoyaltyMembers = extractString(loyalty.knownCustomerBase ?? loyalty.activeLoyaltyMembers ?? loyalty.activeMembers);
    
    // Keep full loyalty for renderers
    result.loyaltyProgramme = loyalty;
  }
  
  // Benchmarks
  const benchmarks = raw.benchmarks as LooseObj | undefined;
  if (isObject(benchmarks)) {
    const aov = benchmarks.aov ?? benchmarks.AOV;
    const aovVal = extractNumber(aov);
    result.aovBenchmark = aovVal > 0 ? `£${aovVal}` : extractString(aov);
    
    const freq = benchmarks.purchaseFrequencyPerYear ?? benchmarks.purchaseFrequency;
    const freqVal = extractNumber(freq);
    result.purchaseFrequencyBenchmark = freqVal > 0 ? `${freqVal} per year` : extractString(freq);
    
    // Keep for renderers
    result.benchmarks = benchmarks;
  }
  
  // Paid media channels - keep original object for renderers
  const paidMedia = raw.paidMediaChannels ?? raw.paidMedia;
  if (isObject(paidMedia)) {
    // Keep original nested structure
    result.paidMediaChannels = paidMedia;
    // Also create flattened string for convenience
    const channels = (paidMedia as LooseObj).channels;
    result.paidMediaChannelsFlat = Array.isArray(channels) 
      ? channels.map(c => extractString(c)).join(", ")
      : extractString(paidMedia);
  } else if (typeof paidMedia === "string") {
    result.paidMediaChannels = paidMedia;
    result.paidMediaChannelsFlat = paidMedia;
  }
  
  // Tech stack - keep original object for renderers
  const tech = raw.techStack as LooseObj | undefined;
  if (isObject(tech)) {
    // Keep original nested structure
    result.techStack = tech;
    // Also create flattened string for convenience
    const parts: string[] = [];
    for (const [key, val] of Object.entries(tech)) {
      if (key === "notes") continue;
      const valStr = extractString(val);
      if (valStr) parts.push(valStr);
    }
    result.techStackFlat = parts.join("; ");
  } else if (typeof tech === "string") {
    result.techStack = tech;
    result.techStackFlat = tech;
  }
  
  // Brand specific initiatives - keep original for renderers
  const initiatives = raw.brandSpecificInitiatives ?? raw.initiatives;
  if (isObject(initiatives)) {
    // Keep original nested structure
    result.brandSpecificInitiatives = initiatives;
    // Also create flattened string
    const parts: string[] = [];
    for (const [, val] of Object.entries(initiatives)) {
      const valStr = extractString(val);
      if (valStr) parts.push(valStr);
    }
    result.brandSpecificInitiativesFlat = parts.join("; ");
  } else if (typeof initiatives === "string") {
    result.brandSpecificInitiatives = initiatives;
    result.brandSpecificInitiativesFlat = initiatives;
  }
  
  // Loyalty sentiment - keep BOTH original and normalized versions
  const sentiment = raw.loyaltySentimentLast12Months ?? raw.loyaltySentiment ?? raw.sentiment;
  if (isObject(sentiment)) {
    // Keep the normalized version with proper structure
    result.loyaltySentiment = normalizeSentiment(sentiment);
    // Also keep the original for renderers that expect it
    result.loyaltySentimentLast12Months = sentiment;
  }
  
  // Research sources - keep as-is, renderers handle various formats
  result.researchSources = raw.researchSources ?? [];
  
  // Inference notes
  result.inferenceNotes = extractString(raw.inferenceNotes);
  
  return result;
}

/**
 * Normalize sentiment section
 */
function normalizeSentiment(raw: LooseObj): LooseObj {
  const result: LooseObj = {};
  
  result.overallSentimentRating = extractString(raw.overallSentiment ?? raw.overallSentimentRating);
  result.summaryNarrative = extractString(raw.summary ?? raw.summaryNarrative);
  result.feedbackDominatedBy = extractString(raw.dominantReviewerType ?? raw.feedbackDominatedBy);
  
  // Themes
  const themes = raw.themes as LooseObj | undefined;
  if (isObject(themes)) {
    const likes = themes.likes;
    const dislikes = themes.dislikes;
    result.themes = {
      likes: Array.isArray(likes) ? likes.map(l => extractString(l)) : [],
      dislikes: Array.isArray(dislikes) ? dislikes.map(d => extractString(d)) : [],
    };
  }
  
  // Sentiment evidence quotes -> sentimentTable
  const quotes = raw.sentimentEvidenceQuotes;
  if (Array.isArray(quotes)) {
    const aspectMap: Record<string, { aspect: string; aspectDisplayName: string; sentimentSummary: string; evidence: LooseObj[] }> = {};
    
    const aspectDisplayNames: Record<string, string> = {
      overall_satisfaction: "Overall satisfaction",
      perceived_value: "Perceived value",
      ease_of_use_ux: "Ease of use / UX",
      key_pain_points: "Key pain points",
    };
    
    for (const q of quotes) {
      if (!isObject(q)) continue;
      const aspect = extractString(q.aspect);
      if (!aspect) continue;
      
      if (!aspectMap[aspect]) {
        aspectMap[aspect] = {
          aspect,
          aspectDisplayName: aspectDisplayNames[aspect] ?? aspect,
          sentimentSummary: "",
          evidence: [],
        };
      }
      
      aspectMap[aspect].evidence.push({
        quote: extractString(q.quote),
        source: `Source [${extractString(q.sourceFootnote)}]`,
        monthYear: extractString(q.date),
      });
    }
    
    result.sentimentTable = Object.values(aspectMap);
  } else if (Array.isArray(raw.sentimentTable)) {
    // Already in correct format
    result.sentimentTable = raw.sentimentTable;
  }
  
  return result;
}

/**
 * Normalize modelling section
 */
function normalizeModelling(raw: unknown): LooseObj {
  if (!isObject(raw)) return {};
  
  const result: LooseObj = { ...raw };
  
  // Extract mode applied
  const finalMode = raw.finalCase ?? raw.thresholdRule;
  if (isObject(finalMode)) {
    result.modeApplied = extractString(finalMode.finalValueCaseMode ?? finalMode.mode) as "median" | "stretch_up" || "median";
    result.modeRationale = extractString(finalMode.explanation ?? finalMode.rationale);
  }
  
  // Base case GM uplift
  const baseCase = raw.baseCaseMidpoint ?? raw.baseCase;
  if (isObject(baseCase)) {
    const gmVal = extractNumber(baseCase.totalGMUpliftGBP_m ?? baseCase.totalGMUpliftUSD_m ?? baseCase.totalGMUpliftMillions);
    result.baseCaseGMUpliftMillions = gmVal;
  }
  
  return result;
}

/**
 * Normalize outputs section
 */
function normalizeOutputs(raw: unknown): LooseObj {
  if (!isObject(raw)) return {};
  
  const result: LooseObj = {};
  
  // Executive one-liner
  result.executiveOneLiner = extractString(raw.executiveOneLiner);
  
  // Executive summary
  result.executiveSummary = extractString(raw.executiveSummary);
  
  // CFO readiness panel
  const panel = raw.cfoReadinessPanel as LooseObj | undefined;
  if (isObject(panel)) {
    const gmUsed = panel.blendedGMPercentUsed;
    result.cfoReadinessPanel = {
      blendedGMPercentUsed: extractNumber(gmUsed),
      blendedGMSourceOrProxy: extractString(panel.blendedGMSourceOrProxy ?? panel.gmSource),
      brandType: extractString(panel.brandType),
      valueCaseMode: extractString(panel.valueCaseMode ?? panel.mode),
      valueCaseModeRationale: extractString(panel.valueCaseModeRationale ?? panel.rationale),
      dataConfidence: isObject(panel.dataConfidence) ? {
        revenue: extractString((panel.dataConfidence as LooseObj).revenue),
        loyalty: extractString((panel.dataConfidence as LooseObj).loyalty),
        aov: extractString((panel.dataConfidence as LooseObj).aov),
        frequency: extractString((panel.dataConfidence as LooseObj).frequency),
      } : {},
    };
  }
  
  // Slide 1 input table - normalize key name and structure
  const slide1 = raw.slide1_inputTable ?? raw.slide1InputTable;
  if (isObject(slide1)) {
    const table = (slide1 as LooseObj).table;
    if (Array.isArray(table)) {
      result.slide1InputTable = {
        rows: table.map((row: unknown) => {
          if (!isObject(row)) return null;
          const rowObj = row as LooseObj;
          return {
            metric: extractString(rowObj.Metric ?? rowObj.metric),
            valueOrEstimate: extractString(rowObj["Value / Estimate"] ?? rowObj.valueOrEstimate ?? rowObj.value),
            sourceOrLogic: extractString(rowObj["Source / Logic"] ?? rowObj.sourceOrLogic ?? rowObj.source),
          };
        }).filter(Boolean),
        notes: extractString((slide1 as LooseObj).notes),
      };
    } else {
      result.slide1InputTable = slide1;
    }
  }
  
  // Loyalty sentiment snapshot - normalize key name
  const sentiment = raw.slide2_loyaltySentimentSnapshot ?? raw.loyaltySentimentSnapshot;
  if (isObject(sentiment)) {
    const sentimentObj = sentiment as LooseObj;
    result.loyaltySentimentSnapshot = {
      overallSentimentRating: extractString(sentimentObj.overallSentimentRating ?? sentimentObj.overallSentiment),
      summaryNarrative: extractString(sentimentObj.summary ?? sentimentObj.summaryNarrative),
      feedbackDominatedBy: extractString(sentimentObj.feedbackDominatedBy) || "general_customers",
      sentimentTable: normalizeSentimentTable(sentimentObj.sentimentTable),
    };
  }
  
  // Slide 4 value case table - normalize key name and structure
  const slide4 = raw.slide4_valueCaseTable ?? raw.slide4ValueCaseTable;
  if (isObject(slide4)) {
    const table = (slide4 as LooseObj).table;
    if (Array.isArray(table)) {
      result.slide4ValueCaseTable = {
        rows: table.map((row: unknown) => {
          if (!isObject(row)) return null;
          const rowObj = row as LooseObj;
          return {
            areaOfImpact: extractString(rowObj["Area of Impact"] ?? rowObj.areaOfImpact),
            opportunityType: extractString(rowObj["Opportunity Type"] ?? rowObj.opportunityType),
            estimatedUpliftGM: extractString(rowObj["Estimated Uplift (£GM)"] ?? rowObj["Estimated Uplift ($GM)"] ?? rowObj.estimatedUpliftGM),
            assumptionsMethodology: extractString(rowObj["Assumptions / Methodology"] ?? rowObj.assumptionsMethodology ?? rowObj.assumptions),
          };
        }).filter(Boolean),
        notes: Array.isArray((slide4 as LooseObj).notes) 
          ? ((slide4 as LooseObj).notes as string[]).join("\n")
          : extractString((slide4 as LooseObj).notes),
      };
    } else {
      result.slide4ValueCaseTable = slide4;
    }
  }
  
  return result;
}

/**
 * Normalize sentiment table rows
 */
function normalizeSentimentTable(raw: unknown): LooseObj[] {
  if (!Array.isArray(raw)) return [];
  
  const aspectDisplayNames: Record<string, string> = {
    overall_satisfaction: "Overall satisfaction",
    perceived_value: "Perceived value",
    ease_of_use_ux: "Ease of use / UX",
    key_pain_points: "Key pain points",
  };
  
  return raw.map((row: unknown) => {
    if (!isObject(row)) return null;
    const rowObj = row as LooseObj;
    
    const aspect = extractString(rowObj.Aspect ?? rowObj.aspect);
    
    // Parse evidence from "Evidence (Quotes & Sources)" column
    const evidenceRaw = rowObj["Evidence (Quotes & Sources)"] ?? rowObj.evidence;
    let evidence: LooseObj[] = [];
    
    if (typeof evidenceRaw === "string" && evidenceRaw.length > 0) {
      // Parse quotes from string like '"Quote1" [1] "Quote2" [2]'
      // Handle straight quotes ("), curly/smart quotes (" "), and other Unicode quotes
      // Use Unicode escapes to ensure proper matching: \u201C = ", \u201D = ", \u0022 = "
      const quotePattern = /[\u201C\u201D\u0022][^\u201C\u201D\u0022]+[\u201C\u201D\u0022]/g;
      const quoteMatches = evidenceRaw.match(quotePattern) ?? [];
      
      if (quoteMatches.length > 0) {
        evidence = quoteMatches.map(q => ({
          quote: q.replace(/[\u201C\u201D\u0022]/g, "").trim(),
          source: "See appendix sources",
          monthYear: "",
        }));
      } else {
        // If no quotes found, use the whole string as a single evidence item
        evidence = [{ quote: evidenceRaw, source: "", monthYear: "" }];
      }
    } else if (Array.isArray(evidenceRaw)) {
      evidence = evidenceRaw.map((e: unknown) => {
        if (typeof e === "string") return { quote: e, source: "", monthYear: "" };
        if (isObject(e)) {
          return {
            quote: extractString(e.quote),
            source: extractString(e.source),
            monthYear: extractString(e.monthYear ?? e.date),
          };
        }
        return null;
      }).filter(Boolean) as LooseObj[];
    }
    
    return {
      aspect: aspect.toLowerCase().replace(/\s+/g, "_").replace(/\//g, "_"),
      aspectDisplayName: aspectDisplayNames[aspect.toLowerCase().replace(/\s+/g, "_").replace(/\//g, "_")] ?? aspect,
      sentimentSummary: extractString(rowObj["Sentiment Summary"] ?? rowObj.sentimentSummary),
      evidence,
    };
  }).filter(Boolean) as LooseObj[];
}

/**
 * Normalize appendices section
 */
function normalizeAppendices(raw: unknown): LooseObj {
  if (!isObject(raw)) return {};
  
  const result: LooseObj = {};
  
  // Assumptions block - can be:
  // 1. Direct array at assumptionsBlock
  // 2. Nested under assumptionsBlock.assumptions
  // 3. Direct at raw.assumptions
  let assumptions: unknown = raw.assumptionsBlock;
  if (isObject(assumptions) && Array.isArray((assumptions as LooseObj).assumptions)) {
    // Nested structure: assumptionsBlock.assumptions
    assumptions = (assumptions as LooseObj).assumptions;
  } else if (!Array.isArray(assumptions)) {
    assumptions = raw.assumptions;
  }
  
  if (Array.isArray(assumptions)) {
    result.assumptionsBlock = assumptions.map((item: unknown) => {
      if (!isObject(item)) return item;
      const itemObj = item as LooseObj;
      
      // Handle sixStepTemplate format
      const sixStep = itemObj.sixStepTemplate as LooseObj | undefined;
      if (isObject(sixStep)) {
        const calcDetail = itemObj.calculationDetail as LooseObj | undefined;
        return {
          leverId: extractString(itemObj.lever ?? itemObj.leverId),
          leverName: extractString(itemObj.lever ?? itemObj.leverName),
          upliftPercentageApplied: extractNumber(calcDetail?.upliftPercent ?? itemObj.upliftPercentageApplied),
          upliftPointDescription: extractString(sixStep["1_upliftPointApplied"] ?? sixStep.upliftPointApplied),
          credibleRange: {
            minPercent: 0,
            maxPercent: 0,
            source: extractString(sixStep["2_rangeAndSource"] ?? sixStep.rangeAndSource),
          },
          selectionRationale: extractString(sixStep["3_whySelected"] ?? sixStep.whySelected),
          mathsExplanation: extractString(sixStep["4_simpleMaths"] ?? sixStep.simpleMaths),
          resultGM: extractNumber(calcDetail?.upliftGM_GBP ?? itemObj.resultGM) / 1_000_000,
          resultStatement: extractString(sixStep["5_result"] ?? sixStep.result),
          reassuranceStatement: extractString(sixStep["6_reassurance"] ?? sixStep.reassurance),
          upliftMode: "median" as const,
        };
      }
      
      return item;
    });
  } else if (isObject(assumptions)) {
    result.assumptionsBlock = assumptions;
  }
  
  // Sources - keep as array of strings
  const sources = raw.sources;
  if (Array.isArray(sources)) {
    result.sources = sources.map((s: unknown) => extractString(s));
  }
  
  return result;
}

/**
 * Normalize ABM pack output for frontend consumption.
 * Handles various JSON structures including:
 * - Nested value objects like { value: X, confidence: Y }
 * - Different key naming conventions (snake_case vs camelCase)
 * - Deeply nested structures in research/outputs sections
 */
export function normalizeAbmPackOutput(data: AbmPackOutput): AbmPackOutput {
  // Deep clone to avoid mutation
  const raw: LooseObj = JSON.parse(JSON.stringify(data));

  const research = normalizeResearch(raw.research);
  const outputs = normalizeOutputs(raw.outputs);
  
  // Merge sentiment data from outputs into research if research version is incomplete
  // The outputs version typically has the formatted sentiment table with summaries
  if (isObject(outputs.loyaltySentimentSnapshot)) {
    const outputSentiment = outputs.loyaltySentimentSnapshot as LooseObj;
    const researchSentiment = (research.loyaltySentiment ?? {}) as LooseObj;
    
    const researchTable = researchSentiment.sentimentTable as LooseObj[] | undefined;
    // Output table is already normalized by normalizeOutputs -> normalizeSentimentTable
    const outputTable = outputSentiment.sentimentTable as LooseObj[] | undefined;
    
    // Check if research table has summaries (not empty strings)
    const researchHasSummaries = Array.isArray(researchTable) && researchTable.length > 0 &&
      researchTable.some(row => isObject(row) && typeof row.sentimentSummary === "string" && row.sentimentSummary.length > 0);
    
    // Check if output table has summaries (normalized key is sentimentSummary, raw key is "Sentiment Summary")
    const outputHasSummaries = Array.isArray(outputTable) && outputTable.length > 0 &&
      outputTable.some(row => isObject(row) && (
        (typeof row.sentimentSummary === "string" && row.sentimentSummary.length > 0) ||
        (typeof row["Sentiment Summary"] === "string" && (row["Sentiment Summary"] as string).length > 0)
      ));
    
    // Prefer outputs table if it has summaries but research doesn't
    if (!researchHasSummaries && outputHasSummaries) {
      // Check if table is already normalized (has camelCase keys like 'sentimentSummary')
      // vs raw (has spaced keys like 'Sentiment Summary')
      const isAlreadyNormalized = Array.isArray(outputTable) && outputTable.length > 0 &&
        outputTable.some(row => isObject(row) && "sentimentSummary" in row);
      
      // Only normalize if not already normalized
      const tableToUse = isAlreadyNormalized 
        ? outputTable 
        : (Array.isArray(outputTable) ? normalizeSentimentTable(outputTable) : []);
      
      // Use output sentiment table for research
      research.loyaltySentiment = {
        ...researchSentiment,
        overallSentimentRating: researchSentiment.overallSentimentRating || outputSentiment.overallSentimentRating,
        summaryNarrative: researchSentiment.summaryNarrative || outputSentiment.summaryNarrative,
        sentimentTable: tableToUse,
      };
    } else {
      // Just copy the narrative if missing
      research.loyaltySentiment = {
        ...researchSentiment,
        summaryNarrative: researchSentiment.summaryNarrative || outputSentiment.summaryNarrative,
      };
    }
  }

  let appendices = normalizeAppendices(raw.appendices);
  
  // If appendices is empty or has no assumptions, try to build from value case table
  const hasAssumptions = Array.isArray(appendices.assumptionsBlock) && appendices.assumptionsBlock.length > 0;
  if (!hasAssumptions) {
    // Try to extract assumptions from outputs.slide4ValueCaseTable
    const valueCaseTable = outputs.slide4ValueCaseTable as LooseObj | undefined;
    const valueCaseRows = (valueCaseTable?.rows ?? valueCaseTable?.table) as LooseObj[] | undefined;
    
    if (Array.isArray(valueCaseRows) && valueCaseRows.length > 0) {
      // Build assumptions from value case rows
      const builtAssumptions = valueCaseRows
        .filter(row => isObject(row) && row.assumptionsMethodology)
        .map(row => {
          const methodology = String(row.assumptionsMethodology || "");
          // Parse the 6-step breakdown from the methodology text
          const steps: Record<string, string> = {};
          const stepPatterns = [
            { key: "upliftPointApplied", pattern: /1\.\s*UPLIFT POINT APPLIED[:\s]*([^\n]+(?:\n(?![2-6]\.).*)*)/i },
            { key: "rangeAndSource", pattern: /2\.\s*RANGE\s*[&\+]?\s*SOURCE[:\s]*([^\n]+(?:\n(?![3-6]\.).*)*)/i },
            { key: "whySelected", pattern: /3\.\s*WHY THIS POINT WAS SELECTED[:\s]*([^\n]+(?:\n(?![4-6]\.).*)*)/i },
            { key: "simpleMaths", pattern: /4\.\s*SIMPLE MATHS EXPLANATION[:\s]*([^\n]+(?:\n(?![5-6]\.).*)*)/i },
            { key: "resultStatement", pattern: /5\.\s*RESULT[:\s]*([^\n]+(?:\n(?!6\.).*)*)/i },
            { key: "reassuranceStatement", pattern: /6\.\s*REASSURANCE[:\s]*([^\n]+)/i },
          ];
          
          for (const { key, pattern } of stepPatterns) {
            const match = methodology.match(pattern);
            if (match) {
              steps[key] = match[1].trim();
            }
          }
          
          return {
            leverName: String(row.areaOfImpact || row["Area of Impact"] || ""),
            upliftPointDescription: steps.upliftPointApplied || "",
            credibleRange: {
              source: steps.rangeAndSource || "",
            },
            selectionRationale: steps.whySelected || "",
            mathsExplanation: steps.simpleMaths || "",
            resultStatement: steps.resultStatement || "",
            reassuranceStatement: steps.reassuranceStatement || "",
            estimatedUpliftGM: String(row.estimatedUpliftGM || row["Estimated Uplift (£GM)"] || row["Estimated Uplift ($GM)"] || ""),
          };
        });
      
      if (builtAssumptions.length > 0) {
        appendices.assumptionsBlock = builtAssumptions;
      }
    }
  }
  
  // If no sources in appendices, try to build from research sources
  const hasSources = Array.isArray(appendices.sources) && appendices.sources.length > 0;
  if (!hasSources && Array.isArray(research.researchSources) && research.researchSources.length > 0) {
    appendices.sources = research.researchSources;
  }

  const normalized: LooseObj = {
    brandIntake: normalizeBrandIntake(raw.brandIntake),
    research,
    modelling: normalizeModelling(raw.modelling),
    outputs,
    appendices,
  };

  return normalized as unknown as AbmPackOutput;
}
