# ABM Pack Builder: Custom GPT vs Vercel App Comparison

## Executive Summary

Your Vercel app is producing less detailed responses because the system prompt is **significantly shorter** (~55 lines vs ~200+ lines in the custom GPT) and **missing critical instructions** that drive the depth and quality of output. Below is a systematic comparison.

---

## 1. Prompt Length Comparison

| Aspect | Custom GPT | Vercel App |
|--------|------------|------------|
| System prompt length | ~3,500+ words | ~500 words |
| Sections covered | 7 detailed sections | Abbreviated summary |
| Explicit rules | 50+ specific rules | ~15 rules |

---

## 2. Live Research Instructions

### Custom GPT ✅
```
Find and cite:
- Latest filed annual revenue (most recent FY), prioritising:
  - US SEC filings (10-K / 20-F / 10-Q) and annual reports for listed companies
  - Credible trade / analyst / news sources for private companies
- Loyalty programme details (penetration, benefits, launch date)
- Active loyalty members or active customers (if available)
- AOV and purchase frequency benchmarks (category-specific, US or closest available market)
- Paid media channels (ads, campaigns, job postings)
- Tech stack (commerce, CRM, loyalty, marketing automation)
- Brand-specific initiatives in loyalty, personalisation, pricing, markdowns
- Blended gross margin % (GM%) from filings or analyst notes; if unavailable, use a credible category proxy
- Loyalty sentiment (last 12 months):
  - Overall sentiment (positive / mixed / negative)
  - Key themes in what customers like and dislike about the loyalty programme
  - Short, representative quotes from customer reviews, app store reviews or public articles, each with clear source and date
```

### Vercel App ❌
```
Research the brand using your knowledge to gather accurate information.
```

**Impact**: The model has no guidance on WHAT to research, WHERE to look, or HOW to prioritize sources. This is the #1 reason for shallow responses.

---

## 3. Benchmark & Inference Logic

### Custom GPT ✅
```
- If brand data is missing, use credible category benchmarks (McKinsey, Bain, KPMG, Statista, trade press).
- Always explain inference briefly and cite the source.
- If only non-US data is available, use it as a proxy and clearly state this.
```

### Vercel App ❌
**Not mentioned at all.**

**Impact**: Model doesn't know how to handle missing data or what benchmark sources are acceptable.

---

## 4. Value Case Modelling Logic

### Custom GPT ✅
```
A) For each lever, determine the evidence-based credible range.
B) Compute the MIDPOINT (median uplift point).
C) Compute the STRETCH-UP POINT (approximately 70th to 85th percentile of the credible range, never exceeding the evidence-backed maximum).

BASE CASE VALUE = sum of all GM uplift using MIDPOINT values.

APPLY THIS RULE:
- If BASE CASE < $2,000,000 GM uplift:
    -> Use STRETCH-UP values for ALL levers equally.
- If BASE CASE ≥ $2,000,000 GM uplift:
    -> Use MIDPOINT values for ALL levers.

Never exceed credible evidence-based bounds.
Never include revenue uplift in the headline numbers.
The value case must never be reverse engineered to hit any predefined ROI multiple or fixed GM or revenue target.
```

### Vercel App ❌
```
Apply the $2m GM threshold rule:
- If base case GM uplift < $2m: use "median" mode with conservative estimates
- If base case GM uplift >= $2m: use "stretch_up" mode with optimistic but credible estimates
```

**Impact**: 
1. Logic is inverted (custom GPT uses stretch-up BELOW $2m, Vercel uses median below $2m)
2. No credible range methodology
3. No anti-gaming rules (ROI reverse engineering prohibition)

---

## 5. Assumptions Template (6-Step)

### Custom GPT ✅
```
1. UPLIFT POINT APPLIED
"We have applied a X% uplift, which represents the [median / upper-mid stretch] of the credible range for this lever."

2. RANGE & SOURCE
"This sits within the credible category range of A% to B%, based on [source]."

3. WHY THIS POINT WAS SELECTED
"We selected this point because the total value case [was above/below] the 2 million dollar threshold, which means the model uses the [median / stretch-up] rule."

4. SIMPLE MATHS EXPLANATION
"In practice, this means applying the X% uplift to [loyal customers / relevant revenue / supplier-funded portion], and converting this into gross margin using the blended GM% of Y%."

5. RESULT
"This results in an estimated gross margin uplift of $Z.Xm for this lever."

6. REASSURANCE
"All assumptions sit comfortably within evidence-based bounds and avoid reliance on extreme best-case scenarios."
```

### Vercel App ❌
```
1. Starting metric (e.g., "Starting from $X annual revenue")
2. Target segment (e.g., "Focusing on loyalty members who...")
3. Intervention (e.g., "By implementing personalized...")
4. Uplift percentage applied (e.g., "Applying a 3% uplift based on...")
5. Source/benchmark (e.g., "This aligns with industry benchmarks from...")
6. Final GM impact calculation (e.g., "Resulting in $Xm incremental GM")
```

**Impact**: The custom GPT template produces CFO-ready explanations with explicit credible ranges, methodology justification, and reassurance language. The Vercel version is generic and lacks the "defensibility" framing.

---

## 6. Loyalty Sentiment Requirements

### Custom GPT ✅
Covers 4 specific aspects with detailed quote requirements:
```
| Aspect | Sentiment Summary | Evidence (Quotes & Sources) |
| --- | --- | --- |
| Overall satisfaction | Short description | 1 to 2 short quotes with source and month/year |
| Perceived value | Short description | 1 to 2 short quotes with source and month/year |
| Ease of use / UX | Short description | 1 to 2 short quotes with source and month/year |
| Key pain points | Short description | 1 to 2 short quotes with source and month/year |

Rules for quotes:
- Use short, representative verbatim excerpts from customer reviews, app stores, public review sites or articles.
- Each quote should be clearly cited, for example: [Trustpilot, May 2025], [App Store review, March 2025], [Trade press article, July 2025].
- Focus on the last 12 months.
```

### Vercel App ❌
```
Cover 4 aspects: Rewards Value, Earning Experience, Redemption Experience, Overall Programme Perception
```

**Impact**: Different aspects covered, and no explicit quote sourcing requirements.

---

## 7. Style & Citation Requirements

### Custom GPT ✅
```
- UK English; authoritative but accessible.
- Tables must be complete with no missing rows.
- Always cite credible sources inline.
- Always state logic when using proxies or inferred values.
- For loyalty sentiment, always connect quotes directly to their platforms or sources with month and year.
```

### Vercel App ❌
**Not mentioned.**

---

## 8. Structured Output Constraint Issue

The Vercel app uses OpenAI's Structured Outputs feature (`response_format: { type: "json_schema" }`), which:

1. **Guarantees schema compliance** but may truncate rich narratives to fit constraints
2. **Forces concise responses** to stay within JSON structure
3. **Limits the model's ability** to provide long-form prose explanations

The custom GPT has no such constraint and can output rich, flowing text.

---

## Recommendations

### Option A: Enhance the Vercel App System Prompt (Recommended)

Port the full custom GPT prompt into the Vercel app. Key additions:

1. **Add explicit research instructions** with source hierarchy
2. **Add benchmark/inference logic** section
3. **Fix the $2m threshold logic** (it's inverted!)
4. **Replace the assumptions template** with the CFO-ready 6-step version
5. **Add style/citation requirements**
6. **Add the ROI anti-gaming rules**

### Option B: Consider Removing Structured Outputs

If you need maximum prose richness, consider:
1. Using regular `generateText` without schema constraints
2. Parsing the response manually
3. Validating structure post-hoc

However, this trades reliability for flexibility.

### Option C: Hybrid Approach

1. Use structured outputs for the data/numbers
2. Make narrative fields (like `executiveSummary`, `assumptionsMethodology`) more flexible with `max_length` guidance in the prompt

---

## Implementation Priority

| Priority | Change | Impact |
|----------|--------|--------|
| 🔴 Critical | Add live research instructions | Major quality improvement |
| 🔴 Critical | Fix $2m threshold logic (inverted!) | Correct modelling behaviour |
| 🟡 High | Add CFO-ready 6-step assumptions template | Better methodology explanations |
| 🟡 High | Add benchmark/inference logic | Better data handling |
| 🟢 Medium | Add style/citation requirements | Consistent tone |
| 🟢 Medium | Update sentiment aspects to match | Consistency with expectations |

---

## Questions Before Implementation

1. Should we port the **entire** custom GPT prompt verbatim, or adapt it for the structured output format?
2. Is the **inverted $2m threshold logic** intentional, or a bug to fix?
3. Do you want to keep structured outputs (reliable but constrained) or switch to free-form (flexible but needs parsing)?
4. Should the sentiment aspects stay as currently defined (`Rewards Value`, etc.) or match the custom GPT (`Overall satisfaction`, `Perceived value`, `Ease of use / UX`, `Key pain points`)?

