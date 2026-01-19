/**
 * Mock ABM Pack data for Lululemon - used for testing UI without LLM calls
 */
export const LULULEMON_MOCK_RESPONSE = {
  "brandIntake": {
    "brand": "Lululemon",
    "website": "https://shop.lululemon.com",
    "businessRegistry": {
      "description": "Public company listed on Nasdaq; SEC EDGAR issuer \"lululemon athletica inc.\"",
      "sec_edgar_link": "https://www.sec.gov/edgar/browse/?CIK=0001397187"
    },
    "category": "Premium athleisure and performance activewear (yoga, running, training, lifestyle apparel and accessories) [H]",
    "brandType": "own-brand only [H] - Lululemon predominantly sells its own-branded products rather than a multi-brand assortment. (en.wikipedia.org)",
    "contextualNotes": "Global premium athletic apparel retailer focused on yoga-inspired athleisure and performance wear, serving 767 company-operated stores and ecommerce channels as of fiscal 2024. (en.wikipedia.org)"
  },
  "research": {
    "financials": {
      "latestFiscalYear": "Fiscal 2024 (year ended 2 February 2025, referred to as \"2024\" in company reporting) [H]",
      "totalRevenueUSD": {
        "value": 10588.1,
        "unit": "USD millions",
        "confidence": "H",
        "note": "Net revenue $10,588.1m for fiscal 2024. (sec.gov)"
      },
      "grossProfitUSD": {
        "value": 6270.8,
        "unit": "USD millions",
        "confidence": "H",
        "note": "Gross profit $6,270.8m for fiscal 2024. (sec.gov)"
      },
      "blendedGrossMarginPercent": {
        "value": 59.2,
        "confidence": "H",
        "note": "Gross margin 59.2% for fiscal 2024 per company results; used as blended GM% in modelling. (sec.gov)"
      },
      "additionalContext": "Net revenue increased 10% year-on-year to $10.6bn with gross margin up 90bps to 59.2%, reflecting strong product margin and disciplined inventory management despite emerging tariff headwinds. (sec.gov)",
      "dataConfidence": "H"
    },
    "loyaltyProgramme": {
      "programmeName": "Lululemon Membership (free tier) plus Sweat Collective (select professional community) [M]",
      "launchAndEvolution": "Lululemon has progressively formalised membership features in its app and digital ecosystem over the last several years, with 2024-2025 initiatives including app-based \"Membership Madness\" campaigns and expanded partner offers. Sweat Collective, a separate but related community programme for fitness professionals, predates these and continues to offer a 25% discount on full-price product. (lululemon.de)",
      "coreBenefits": {
        "membership": [
          "Early access and app-first activations for product drops and promotions (e.g., \"Membership Madness\" sweeps and partner-led offers rather than straightforward discounts). (reddit.com)",
          "Partner perks (e.g., health-tech and event-related sweepstakes) delivered via the app. (reddit.com)"
        ],
        "sweatCollective": [
          "25% discount on full-price, regular merchandise for eligible fitness professionals in-store and online. (lululemon.de)",
          "Access to exclusive events, community networking and opportunities to provide product feedback. (mypursestrings.com)"
        ]
      },
      "penetrationAndMembers": {
        "activeMembersEstimate": {
          "value": 12,
          "unit": "millions",
          "confidence": "L",
          "logic": "Lululemon does not disclose total membership or active loyalty members. The subreddit r/lululemon references \"almost 900k people\" in the community alone, while app-based campaigns (e.g., Membership Madness) are run across a broad customer base. (reddit.com) Using McKinsey benchmarks for leading athleisure brands, where 50-70% of digital customers are enrolled in some form of account-based or app-based membership, we infer an order-of-magnitude of c.10-15m global active members; we adopt 12m as a conservative working estimate. (media.market.us)",
          "penetrationOfSalesPercent": {
            "value": 65,
            "confidence": "M",
            "note": "For digitally led athleisure brands, 60-75% of sales typically come from identifiable members or account-holders. We adopt 65% as a midpoint proxy for Lululemon. (media.market.us)"
          }
        }
      },
      "loyaltyRevenueAttribution": {
        "estimatedRevenueFromMembersUSD": {
          "value": 6882,
          "unit": "USD millions",
          "confidence": "M",
          "note": "65% of $10,588m FY2024 net revenue assumed attributable to identifiable members (app/account-based customers and Sweat Collective where applicable). (sec.gov)"
        }
      },
      "dataConfidence": "M (structure and benefits high; penetration and member counts inferred)"
    },
    "benchmarks": {
      "AOV": {
        "brandOrCategoryAOV": {
          "value": 160,
          "currency": "USD",
          "confidence": "M",
          "note": "External ecommerce intelligence estimates lululemon.com AOV between $150-175; we adopt $160 as a midpoint. (gripsintelligence.com)"
        },
        "categoryContext": "Athleisure and premium activewear ecommerce AOVs cluster between ~$90 and $160 depending on brand positioning, with Lululemon sitting at the upper end reflecting premium price points. (media.market.us)"
      },
      "purchaseFrequency": {
        "estimatedAnnualPurchaseFrequencyPerActiveCustomer": {
          "value": 3,
          "unit": "orders per year",
          "confidence": "M",
          "note": "US sportswear consumers typically purchase sports apparel a few times per year, with Statista surveys indicating a substantial share buying in-store every 3-6 months and a portion buying monthly online. (statista.com) Premium brand loyalists tend to buy more frequently; we assume 3 orders per year for active Lululemon members."
        }
      },
      "dataConfidence": "M"
    },
    "paidMediaAndChannels": {
      "paidMediaChannels": {
        "channelsObservedOrInferred": [
          "Paid social (Instagram, TikTok, Facebook) - heavy use for brand storytelling, influencer collaborations and product launches. (voguebusiness.com)",
          "Search and shopping ads (Google/Bing) - common for ecommerce traffic capture in this category; inferred for Lululemon given scale and digital mix. (gripsintelligence.com)",
          "Programmatic display and video (YouTube, OTT) - used to promote seasonal campaigns and brand films. (voguebusiness.com)",
          "Influencer and creator partnerships across wellness, yoga, running and \"pink Pilates\" culture. (voguebusiness.com)",
          "Email, app push and onsite personalisation as owned/paid-like engagement channels, especially around sales events (Year-End, \"We Made Too Much\", \"Summer Scores\" etc.). (people.com)"
        ],
        "confidence": "M"
      }
    },
    "techStack": {
      "commerce": {
        "description": "Proprietary, in-house ecommerce platform for shop.lululemon.com and regional sites, integrated with global inventory and store network. (en.wikipedia.org)",
        "confidence": "M"
      },
      "crmAndLoyalty": {
        "description": "First-party customer data platform and CRM built around account-based profiles and app IDs, supporting membership features, Sweat Collective accounts, targeted email and app campaigns. Specific vendors are not publicly disclosed; likely combination of in-house systems with enterprise marketing cloud tooling. (sec.gov)",
        "confidence": "L"
      },
      "marketingAutomation": {
        "description": "Sophisticated lifecycle marketing via email, app push and onsite personalisation to promote sales events, new drops and membership activations; vendor stack undisclosed but behaviour is consistent with leading marketing automation platforms. (people.com)",
        "confidence": "M"
      }
    },
    "brandInitiatives": {
      "loyaltyAndMembership": [
        "Expansion of app-based membership activations such as \"Membership Madness\" in 2025, offering sweepstakes and partner benefits to members rather than straightforward discounts, prompting strong discussion in the Lululemon subreddit. (reddit.com)",
        "Continuation of Sweat Collective as a 25% discount and community programme for fitness professionals, frequently highlighted in store communications and local press. (lululemon.de)"
      ],
      "personalisation": [
        "Use of app, email and digital storefront to surface \"We Made Too Much\" markdowns, curated collections (e.g., \"Summer Scores\" sale, year-end sale assortments) and style edits relevant to customer segments. (goodhousekeeping.com)"
      ],
      "pricingAndMarkdowns": [
        "Historically positioned as a low-promo, premium brand, but 2024-2025 commentary indicates growing reliance on sales and markdowns, including large \"We Made Too Much\" assortments and seasonal mega-sales. (people.com)",
        "Tariff pressures and inventory dynamics have driven more surgical use of markdowns to clear stock while seeking to protect overall gross margin in the 58-59% range. (ainvest.com)"
      ]
    },
    "loyaltySentiment": {
      "overallSentimentRating": "Mixed to negative among vocal loyalty and subreddit communities; general customers remain positive on product quality but underwhelmed by loyalty and membership perks.",
      "narrativeSummary": "Over the last 12 months, the most vocal loyalty-related feedback has come from highly engaged customers on r/lululemon responding to app-based membership campaigns. Many expected a traditional loyalty programme with tangible benefits such as member-only discounts, guaranteed access to restocks or birthday offers, but instead encountered a sweepstakes-led \"Membership Madness\" activation with limited winners and a focus on partner promotions. Typical reactions describe the programme as \"insanely disappointing\" and \"a case study in how to mislead and disappoint your best customers\" when only a small subset of members receive rewards. [1] Customers also criticise the perceived overuse of promotions and price increases without commensurate loyalty perks, with some stating they plan to \"stop shopping\" as a result. [2] This feedback is predominantly from existing, high-intent Lululemon customers rather than casual shoppers, indicating a risk to the brand's most valuable cohort.",
      "feedbackDominantFrom": "Existing engaged customers and subreddit members who are highly familiar with Lululemon's product and price architecture.",
      "sentimentTable": [
        {
          "aspectKey": "overall_satisfaction",
          "displayName": "Overall satisfaction",
          "sentimentSummary": "Engaged customers express frustration and disappointment with the current membership and rewards approach, feeling that recent app campaigns over-promised and under-delivered compared with expectations for a premium brand.",
          "evidenceQuotes": [
            "\"This is insanely disappointing I'm low key salty at all the educators and other staff who hyped this up so much.\" [1]",
            "\"This is like a case study in how to mislead and disappoint your best customers. It actually made me feel bad. I don't think this brand really cares about us anymore.\" [1]"
          ]
        },
        {
          "aspectKey": "perceived_value",
          "displayName": "Perceived value",
          "sentimentSummary": "Members question the value exchange, noting that only a tiny fraction of participants win sweepstakes prizes and that there are no meaningful ongoing discounts or guaranteed benefits, especially against the backdrop of higher prices.",
          "evidenceQuotes": [
            "\"Why can't they just give us a members only sale/discount or finally introduce a decent loyalty program? Only 64 PEOPLE actually win something?\" [1]",
            "\"I already planned to stop shopping after the price increases. Now I'm done for sure. The reward system is useless could've kept it.\" [2]"
          ]
        },
        {
          "aspectKey": "ease_of_use_ux",
          "displayName": "Ease of use / UX",
          "sentimentSummary": "UX issues are less prominent than value concerns, but some users describe confusion about what the membership event actually offers and feel the app is primarily being used to push promotions rather than deliver clear benefits.",
          "evidenceQuotes": [
            "\"I actually re-downloaded the app thinking there might be something good. I kept searching like...this is it? But what is it???\" [1]",
            "\"Why are they pushing people to use their app?\" [1]"
          ]
        },
        {
          "aspectKey": "key_pain_points",
          "displayName": "Key pain points",
          "sentimentSummary": "Key pain points include lack of straightforward loyalty rewards, limited winners in sweepstakes, perception of being \"advertised to\" rather than rewarded, and a sense that the brand is prioritising flashy partnerships over broad-based member value.",
          "evidenceQuotes": [
            "\"Lame use of the app for advertising other brands. I don't like to participate in promotions that make me feel like a total peasant, so I'll sit this one out.\" [1]",
            "\"Lululemon perception of perks is so lame.\" [2]"
          ]
        }
      ],
      "quoteSources": {
        "footnotes": {
          "1": "Reddit r/lululemon - \"Membership Madness Info Just Dropped in App\", March-May 2025. (reddit.com)",
          "2": "Reddit r/Lululemen - \"Did anybody else think the updated membership program read like early access to disappointment?\", September 2025. (reddit.com)"
        }
      }
    },
    "dataConfidenceSummary": {
      "revenue": "H (direct SEC/company disclosure)",
      "loyalty": "M (programme structure high, penetration inferred)",
      "AOV": "M (3rd-party ecommerce benchmark)",
      "frequency": "M (category benchmark and Statista surveys)",
      "gmPercent": "H"
    }
  },
  "modelling": {
    "baseAssumptions": {
      "currency": "USD",
      "fiscalYearBasis": "FY2024 (ended 2 February 2025)",
      "totalRevenueUSD_m": 10588.1,
      "blendedGrossMarginPercent": 59.2,
      "revenueFromMembersPercent": 65,
      "revenueFromMembersUSD_m": 6882.3,
      "averageOrderValueUSD": 160,
      "ordersPerActiveMemberPerYear": 3,
      "estimatedActiveMembers_m": 12,
      "confidenceNotes": "Revenue and GM% from company results [H]; loyalty revenue share, member count and frequency inferred from category benchmarks [M/L]. (sec.gov)"
    },
    "levers": {
      "personalisedLoyalty": {
        "description": "Incremental gross margin from better targeting of offers, increased member frequency/AOV, and reduced discount waste across members.",
        "credibleRangePercentGM": {
          "low": 1,
          "high": 3,
          "sourceNote": "McKinsey and Bain analyses of advanced personalisation and loyalty in apparel suggest 1-3% incremental sales uplift on identified revenue, with margin enhancement from lower discount leakage. (media.market.us)",
          "confidence": "M"
        },
        "midpointUpliftPercent": 2,
        "stretchUpliftPercent": 2.5
      },
      "supplierFundedLoyalty": {
        "applicable": false,
        "reason": "Lululemon is an own-brand retailer designing and producing its own products; there is limited scope for classical supplier-funded offers compared with multi-brand retailers. (en.wikipedia.org)"
      },
      "priceOptimisation": {
        "description": "GM uplift from improved price architecture, markdown management, and more precise promo depth and cadence (especially across \"We Made Too Much\" and seasonal sales).",
        "credibleRangePercentGM": {
          "low": 0.8,
          "high": 2.5,
          "sourceNote": "Retail pricing and markdown optimisation case studies in fashion/apparel indicate 0.8-2.5% GM uplift on total sales for well-executed initiatives, especially in markdown-heavy environments. (people.com)",
          "confidence": "M"
        },
        "midpointUpliftPercent": 1.65,
        "stretchUpliftPercent": 2.1
      }
    },
    "baseCaseUsingMidpoints": {
      "personalisedLoyaltyGMUpliftUSD_m": {
        "value": 81.3,
        "calculationNote": "2.0% uplift applied to revenue from members ($6,882.3m), then multiplied by 59.2% GM%: 0.02 x 6,882.3 x 0.592 = ~$81.3m."
      },
      "priceOptimisationGMUpliftUSD_m": {
        "value": 103.4,
        "calculationNote": "1.65% uplift applied to total revenue ($10,588.1m), then multiplied by 59.2% GM%: 0.0165 x 10,588.1 x 0.592 = ~$103.4m."
      },
      "totalBaseCaseGMUpliftUSD_m": 184.7,
      "thresholdAssessment": "Base case total GM uplift of ~$184.7m is below the $2,000,000 ($2.0m) threshold? No - it is significantly above. However, the user's threshold rule is expressed in dollars, not millions. On an absolute basis, $184.7m > $2.0m. Therefore, per the rules, we should retain MIDPOINT values. To align with the spirit of the framework (using stretch-up only when the base case is very small), we continue with MIDPOINT values.",
      "valueCaseModeSelected": "Median (midpoint) values retained for all applicable levers."
    },
    "finalValuesSelected": {
      "mode": "Median",
      "reason": "Base case GM uplift (~$184.7m) exceeds the $2.0m threshold, so we do not switch to stretch-up values.",
      "selectedUpliftsPercent": {
        "personalisedLoyalty": 2,
        "priceOptimisation": 1.65
      },
      "totalGMUpliftUSD_m": 184.7
    }
  },
  "outputs": {
    "executiveOneLiner": "Headline value (Gross Margin): approximately $184.7m - all figures expressed on a gross-margin basis.",
    "cfoReadinessPanel": {
      "blendedGMPercentUsed": 59.2,
      "blendedGMSource": "FY2024 reported gross margin. (sec.gov)",
      "brandType": "Own-brand only",
      "dataConfidence": {
        "revenue": "H",
        "loyalty": "M",
        "AOV": "M",
        "frequency": "M"
      },
      "valueCaseMode": "Median (midpoint) - applied because the base-case GM uplift using midpoints (~$184.7m) exceeds the $2m threshold, so no stretch-up adjustment was triggered."
    },
    "executiveSummary": "This value case for Lululemon quantifies gross-margin uplift from two levers: personalised loyalty (including offer-waste reduction) and price optimisation. We anchor the model in FY2024 net revenue of $10.6bn and a blended gross margin of 59.2%. [3] Using category benchmarks and ecommerce data, we estimate that 65% of revenue is generated by identifiable members, at an AOV of c.$160 and around three orders per active member per year. [4][5] For personalised loyalty, we apply a 2.0% uplift to member revenue - the midpoint of a 1-3% credible range for advanced personalisation in premium apparel - then convert to gross margin, yielding around $81m GM uplift. [4] For price and markdown optimisation, we apply a 1.65% uplift (midpoint of a 0.8-2.5% range for fashion pricing programmes) to total revenue and again convert at 59.2% GM, generating approximately $103m. [6] Because the combined base case exceeds the $2m threshold, we retain median uplift points rather than stretch scenarios. Strategically, this matters now because margin pressure from tariffs, elevated markdowns and mixed US demand makes protecting and optimising gross margin a board-level priority while sustaining brand equity and member loyalty. [4][6][7]",
    "slide1_inputTable": {
      "tableMarkdown": "| Metric | Value / Estimate | Source / Logic |\n| --- | --- | --- |\n| 1. Total Revenue | $10,588m (FY2024 net revenue) | Company FY2024 results and SEC filing. [3] |\n| 2. Revenue from Loyalty Members | ~$6,882m (65% of total revenue) | Lululemon does not disclose loyalty share; we apply a 65% share of revenue generated by identifiable members/app users, consistent with leading athleisure benchmarks for account-based sales mix. [4][5] |\n| 3. Active Loyalty Members | ~12m active members (global) | Not disclosed; inferred from digital scale, subreddit size (~900k members), app usage and McKinsey benchmarks for category penetration (50-70% of digital customers enrolled). We adopt a conservative ~12m active members. [1][4] |\n| 4. AOV | ~$160 per order | Third-party ecommerce intelligence reports lululemon.com AOV in the $150-175 range; we take the midpoint. [5] |\n| 5. Purchase Frequency | ~3 orders per active member per year | Statista surveys show US sportswear shoppers purchase in-store every 3-6 months and some buy monthly online; premium brand loyalists are more frequent. We assume 3 orders/year for active members. [8][9] |\n| 6. Paid Media Channels | Paid social (IG, TikTok), search/shopping, programmatic video/display, influencer partnerships, email & app campaigns | Channels observed across campaigns and inferred from category norms and Lululemon's digital scale. [4][6][10] |\n| 7. Tech Stack | Proprietary ecommerce platform; first-party CRM/CDP with app-centric ID; enterprise-grade marketing automation for email/app personalisation | Exact vendors undisclosed; behaviour and scale indicate in-house commerce and data platform layered with marketing automation tooling. [3][5][10] |\n\nNotes:\n- Proxies are used for loyalty penetration, member count, AOV and purchase frequency, based on category benchmarks and 3rd-party ecommerce intelligence. [4][5][8][9]\n- Where Lululemon has not disclosed loyalty metrics, we adopt conservative midpoints within evidence-backed ranges and explicitly flag confidence levels as Medium or Low, avoiding any attempt to back-solve to a target outcome.",
      "notes": "All GM impacts are calculated using the 59.2% blended gross margin from FY2024; no revenue-only uplifts are presented."
    },
    "slide2_loyaltySentiment": {
      "overallSentimentRating": "Mixed to negative among engaged loyalty customers.",
      "summary": "Customer sentiment towards Lululemon's loyalty and membership activity over the past 12 months is mixed, skewing negative among its most engaged fans. On Reddit, long-time customers describe recent app-based \"Membership Madness\" initiatives as confusing and underwhelming, highlighting the absence of straightforward discounts, guaranteed access to high-demand restocks or personal milestone rewards. [1] Many emphasise that only a tiny number of members win sweepstakes prizes relative to the size of the customer base, which makes the programme feel exclusionary rather than rewarding. [1] Others explicitly link price increases and a perceived erosion of product innovation with the lack of meaningful loyalty benefits, calling the rewards \"useless\" and saying they will reduce or stop purchasing. [2] Importantly, this feedback largely comes from highly engaged customers who are otherwise strong advocates of Lululemon's product quality, suggesting a risk of value dilution amongst the brand's highest-value cohort if expectations are not reset and benefits improved.",
      "sentimentTableMarkdown": "| Aspect | Sentiment Summary | Evidence (Quotes & Sources) |\n| --- | --- | --- |\n| Overall satisfaction | Engaged members are disappointed with how Lululemon has executed recent membership activations, feeling that hype from staff and app messaging was not matched by meaningful benefits. | \"This is insanely disappointing I'm low key salty at all the educators and other staff who hyped this up so much.\" [1] \"This is like a case study in how to mislead and disappoint your best customers. It actually made me feel bad.\" [1] |\n| Perceived value | Customers question the value exchange, noting that only a very small number of winners receive prizes and that there are no clear ongoing perks such as consistent member-only discounts or guaranteed access to coveted products. | \"Why can't they just give us a members only sale/discount or finally introduce a decent loyalty program? Only 64 PEOPLE actually win something?\" [1] \"I already planned to stop shopping after the price increases. Now I'm done for sure. The reward system is useless could've kept it.\" [2] |\n| Ease of use / UX | While basic app use is not a major issue, customers describe confusion about what the membership event actually offers and feel the app is being used primarily to push promotions rather than clearly communicate benefits. | \"I actually re-downloaded the app thinking there might be something good. I kept searching like...this is it? But what is it???\" [1] \"Why are they pushing people to use their app?\" [1] |\n| Key pain points | Pain points include lack of straightforward loyalty rewards, sweepstakes with limited winners, perceived over-reliance on advertising partnerships rather than giving members usable value, and a sense of being treated as \"peasants\" rather than valued guests. | \"Lame use of the app for advertising other brands. I don't like to participate in promotions that make me feel like a total peasant, so I'll sit this one out.\" [1] \"Lululemon perception of perks is so lame.\" [2] |"
    },
    "slide4_valueCaseTable": {
      "tableMarkdown": "| Area of Impact | Opportunity Type | Estimated Uplift ($GM) | Assumptions / Methodology |\n| --- | --- | --- | --- |\n| A. Personalised Loyalty (incl. offer waste reduction) | Incremental GM from better targeting and reduced discount waste | ~$81.3m | 1. **UPLIFT POINT APPLIED** - We have applied a 2.0% uplift, which represents the median of the credible range for this lever. 2. **RANGE & SOURCE** - This sits within the credible category range of 1% to 3%, based on McKinsey-style analyses of advanced personalisation and loyalty programmes in fashion and athleisure, where targeted communications and offers typically deliver low single-digit sales uplifts on identified revenue while improving mix and reducing blanket discounts. [4] 3. **WHY THIS POINT WAS SELECTED** - We selected this point because the total value case was above the 2 million dollar threshold, which means the model uses the median rule, so there was no need to move to a stretch-up scenario. 4. **SIMPLE MATHS EXPLANATION** - In practice, this means applying the 2.0% uplift to revenue from members (around $6.9bn of the $10.6bn total), and converting this into gross margin using the blended GM% of 59.2%. 5. **RESULT** - This results in an estimated gross margin uplift of approximately $81.3m for this lever. 6. **REASSURANCE** - All assumptions sit comfortably within evidence-based bounds for premium athleisure and avoid reliance on extreme best-case scenarios. |\n| C. Price Optimisation | GM uplift from improved price architecture and markdown management | ~$103.4m | 1. **UPLIFT POINT APPLIED** - We have applied a 1.65% uplift, which represents the median of the credible range for this lever. 2. **RANGE & SOURCE** - This sits within the credible category range of 0.8% to 2.5% gross margin uplift, based on apparel and fashion retail pricing and markdown optimisation case studies, particularly in environments with growing sale and \"We Made Too Much\" reliance. [6] 3. **WHY THIS POINT WAS SELECTED** - We selected this point because the total value case was above the 2 million dollar threshold, which means the model uses the median rule instead of switching to stretch-up values. 4. **SIMPLE MATHS EXPLANATION** - In practice, this means applying the 1.65% uplift to Lululemon's total revenue base (about $10.6bn), and converting this into gross margin using the blended GM% of 59.2%. 5. **RESULT** - This results in an estimated gross margin uplift of approximately $103.4m for this lever. 6. **REASSURANCE** - All assumptions sit comfortably within evidence-based bounds and avoid reliance on extreme best-case scenarios, especially given Lululemon's current mix of premium full-price product and increasing but still controlled markdown activity. |\n| D. Total Cumulative Uplift (GM) | Sum of A and C | ~$184.7m | 1. **UPLIFT POINT APPLIED** - We have applied the median uplift points for each lever (2.0% for personalised loyalty and 1.65% for price optimisation) and summed their gross margin effects. 2. **RANGE & SOURCE** - The combined impact sits within the aggregate credible range implied by the individual levers: roughly 1-3% on member revenue and 0.8-2.5% on total revenue respectively, based on category-level evidence from consulting analyses and pricing case studies. [4][6] 3. **WHY THIS POINT WAS SELECTED** - We selected this combined midpoint view because the total value case, calculated using midpoints, was already well above the 2 million dollar threshold, so the framework directs us to retain median rather than stretch-up values. 4. **SIMPLE MATHS EXPLANATION** - In practice, this means adding the personalised loyalty GM uplift of about $81.3m to the price optimisation GM uplift of about $103.4m, both calculated using the 59.2% blended gross margin. 5. **RESULT** - This results in an estimated total gross margin uplift of approximately $184.7m across the two levers. 6. **REASSURANCE** - All assumptions for the combined effect remain within evidence-based bounds and deliberately stop short of stacking extreme assumptions, helping ensure the value case is credible for CFO-level scrutiny. |"
    },
    "slide1InputTable": {
      "tableMarkdown": "| Metric | Value / Estimate | Source / Logic |\n| --- | --- | --- |\n| 1. Total Revenue | $10,588m (FY2024 net revenue) | Company FY2024 results and SEC filing. [3] |\n| 2. Revenue from Loyalty Members | ~$6,882m (65% of total revenue) | Lululemon does not disclose loyalty share; we apply a 65% share of revenue generated by identifiable members/app users, consistent with leading athleisure benchmarks for account-based sales mix. [4][5] |\n| 3. Active Loyalty Members | ~12m active members (global) | Not disclosed; inferred from digital scale, subreddit size (~900k members), app usage and McKinsey benchmarks for category penetration (50-70% of digital customers enrolled). We adopt a conservative ~12m active members. [1][4] |\n| 4. AOV | ~$160 per order | Third-party ecommerce intelligence reports lululemon.com AOV in the $150-175 range; we take the midpoint. [5] |\n| 5. Purchase Frequency | ~3 orders per active member per year | Statista surveys show US sportswear shoppers purchase in-store every 3-6 months and some buy monthly online; premium brand loyalists are more frequent. We assume 3 orders/year for active members. [8][9] |\n| 6. Paid Media Channels | Paid social (IG, TikTok), search/shopping, programmatic video/display, influencer partnerships, email & app campaigns | Channels observed across campaigns and inferred from category norms and Lululemon's digital scale. [4][6][10] |\n| 7. Tech Stack | Proprietary ecommerce platform; first-party CRM/CDP with app-centric ID; enterprise-grade marketing automation for email/app personalisation | Exact vendors undisclosed; behaviour and scale indicate in-house commerce and data platform layered with marketing automation tooling. [3][5][10] |\n\nNotes:\n- Proxies are used for loyalty penetration, member count, AOV and purchase frequency, based on category benchmarks and 3rd-party ecommerce intelligence. [4][5][8][9]\n- Where Lululemon has not disclosed loyalty metrics, we adopt conservative midpoints within evidence-backed ranges and explicitly flag confidence levels as Medium or Low, avoiding any attempt to back-solve to a target outcome.",
      "notes": "All GM impacts are calculated using the 59.2% blended gross margin from FY2024; no revenue-only uplifts are presented."
    },
    "slide4ValueCaseTable": {
      "tableMarkdown": "| Area of Impact | Opportunity Type | Estimated Uplift ($GM) | Assumptions / Methodology |\n| --- | --- | --- | --- |\n| A. Personalised Loyalty (incl. offer waste reduction) | Incremental GM from better targeting and reduced discount waste | ~$81.3m | 1. **UPLIFT POINT APPLIED** - We have applied a 2.0% uplift, which represents the median of the credible range for this lever. 2. **RANGE & SOURCE** - This sits within the credible category range of 1% to 3%, based on McKinsey-style analyses of advanced personalisation and loyalty programmes in fashion and athleisure, where targeted communications and offers typically deliver low single-digit sales uplifts on identified revenue while improving mix and reducing blanket discounts. [4] 3. **WHY THIS POINT WAS SELECTED** - We selected this point because the total value case was above the 2 million dollar threshold, which means the model uses the median rule, so there was no need to move to a stretch-up scenario. 4. **SIMPLE MATHS EXPLANATION** - In practice, this means applying the 2.0% uplift to revenue from members (around $6.9bn of the $10.6bn total), and converting this into gross margin using the blended GM% of 59.2%. 5. **RESULT** - This results in an estimated gross margin uplift of approximately $81.3m for this lever. 6. **REASSURANCE** - All assumptions sit comfortably within evidence-based bounds for premium athleisure and avoid reliance on extreme best-case scenarios. |\n| C. Price Optimisation | GM uplift from improved price architecture and markdown management | ~$103.4m | 1. **UPLIFT POINT APPLIED** - We have applied a 1.65% uplift, which represents the median of the credible range for this lever. 2. **RANGE & SOURCE** - This sits within the credible category range of 0.8% to 2.5% gross margin uplift, based on apparel and fashion retail pricing and markdown optimisation case studies, particularly in environments with growing sale and \"We Made Too Much\" reliance. [6] 3. **WHY THIS POINT WAS SELECTED** - We selected this point because the total value case was above the 2 million dollar threshold, which means the model uses the median rule instead of switching to stretch-up values. 4. **SIMPLE MATHS EXPLANATION** - In practice, this means applying the 1.65% uplift to Lululemon's total revenue base (about $10.6bn), and converting this into gross margin using the blended GM% of 59.2%. 5. **RESULT** - This results in an estimated gross margin uplift of approximately $103.4m for this lever. 6. **REASSURANCE** - All assumptions sit comfortably within evidence-based bounds and avoid reliance on extreme best-case scenarios, especially given Lululemon's current mix of premium full-price product and increasing but still controlled markdown activity. |\n| D. Total Cumulative Uplift (GM) | Sum of A and C | ~$184.7m | 1. **UPLIFT POINT APPLIED** - We have applied the median uplift points for each lever (2.0% for personalised loyalty and 1.65% for price optimisation) and summed their gross margin effects. 2. **RANGE & SOURCE** - The combined impact sits within the aggregate credible range implied by the individual levers: roughly 1-3% on member revenue and 0.8-2.5% on total revenue respectively, based on category-level evidence from consulting analyses and pricing case studies. [4][6] 3. **WHY THIS POINT WAS SELECTED** - We selected this combined midpoint view because the total value case, calculated using midpoints, was already well above the 2 million dollar threshold, so the framework directs us to retain median rather than stretch-up values. 4. **SIMPLE MATHS EXPLANATION** - In practice, this means adding the personalised loyalty GM uplift of about $81.3m to the price optimisation GM uplift of about $103.4m, both calculated using the 59.2% blended gross margin. 5. **RESULT** - This results in an estimated total gross margin uplift of approximately $184.7m across the two levers. 6. **REASSURANCE** - All assumptions for the combined effect remain within evidence-based bounds and deliberately stop short of stacking extreme assumptions, helping ensure the value case is credible for CFO-level scrutiny. |",
      "rows": [
        {
          "areaOfImpact": "A. Personalised Loyalty (incl. offer waste reduction)",
          "opportunityType": "Incremental GM from better targeting and reduced discount waste",
          "estimatedUpliftGM": 81.3,
          "assumptionsMethodology": "2.0% uplift applied to member revenue ($6.9bn), converted at 59.2% GM. Median of 1-3% credible range for advanced personalisation in premium apparel."
        },
        {
          "areaOfImpact": "C. Price Optimisation",
          "opportunityType": "GM uplift from improved price architecture and markdown management",
          "estimatedUpliftGM": 103.4,
          "assumptionsMethodology": "1.65% uplift applied to total revenue ($10.6bn), converted at 59.2% GM. Median of 0.8-2.5% credible range for fashion pricing programmes."
        },
        {
          "areaOfImpact": "D. Total Cumulative Uplift (GM)",
          "opportunityType": "Sum of A and C",
          "estimatedUpliftGM": 184.7,
          "assumptionsMethodology": "Sum of personalised loyalty ($81.3m) and price optimisation ($103.4m) GM uplifts. Median values retained as base case exceeds $2m threshold."
        }
      ]
    }
  },
  "appendices": {
    "assumptionsBlock": {
      "leverA_personalisedLoyalty": {
        "upliftPercentApplied": 2,
        "mode": "Median",
        "sixStepBreakdown": [
          "1. UPLIFT POINT APPLIED - We have applied a 2.0% uplift on revenue from members, representing the median of the 1-3% credible range for loyalty-driven personalisation in premium apparel.",
          "2. RANGE & SOURCE - The 1-3% range is grounded in consulting analyses (e.g., McKinsey-style work on retail personalisation), which consistently show low single-digit sales uplifts and mix improvements when advanced segmentation, next-best-offer engines and targeted promotions are deployed at scale in fashion and athleisure. [4]",
          "3. WHY THIS POINT WAS SELECTED - The total value case, when calculated using midpoints for all levers, produced a GM uplift well above the 2 million dollar threshold, so under the framework we kept the median uplift (rather than moving to stretch-up values).",
          "4. SIMPLE MATHS EXPLANATION - We estimate that about 65% of Lululemon's $10.6bn FY2024 revenue (~$6.9bn) comes from identifiable members. Applying a 2.0% uplift to this base yields roughly $137.6m in incremental revenue, which we then convert to gross margin by multiplying by the blended 59.2% GM%, producing around $81.3m in gross margin uplift.",
          "5. RESULT - This methodology results in an estimated gross margin uplift of approximately $81.3m from personalised loyalty and reduced offer waste.",
          "6. REASSURANCE - The chosen uplift is conservative relative to best-in-class digital programmes and is grounded in both category evidence and Lululemon's strong digital penetration, avoiding any reliance on extreme outlier performance."
        ]
      },
      "leverC_priceOptimisation": {
        "upliftPercentApplied": 1.65,
        "mode": "Median",
        "sixStepBreakdown": [
          "1. UPLIFT POINT APPLIED - We have applied a 1.65% uplift on total revenue, representing the median of the 0.8-2.5% credible range for price and markdown optimisation in apparel retail.",
          "2. RANGE & SOURCE - The 0.8-2.5% range comes from case studies of fashion and specialty apparel retailers implementing scientific pricing and markdown optimisation, where improved size/colour depth, markdown timing, and promo discipline deliver 0.8-2.5% of sales in incremental gross margin. [6]",
          "3. WHY THIS POINT WAS SELECTED - Using this midpoint alongside the 2.0% loyalty uplift produced a total GM uplift comfortably above the 2 million dollar threshold, so per the framework we retained median values instead of moving to stretch-up assumptions.",
          "4. SIMPLE MATHS EXPLANATION - We apply a 1.65% uplift to Lululemon's total FY2024 revenue of $10.6bn, generating roughly $174.7m incremental revenue. Converting this at the blended 59.2% GM% yields an estimated $103.4m gross margin uplift.",
          "5. RESULT - This produces an estimated gross margin uplift of approximately $103.4m from improved price architecture, markdown discipline and clearance efficiency.",
          "6. REASSURANCE - The assumption is consistent with Lululemon's current mix of premium full-price positioning and growing markdown usage; it does not presume drastic shifts such as eliminating all discounts or fully offsetting tariff impacts."
        ]
      },
      "combinedEffect": {
        "totalGMUpliftUSD_m": 184.7,
        "sixStepBreakdown": [
          "1. UPLIFT POINT APPLIED - For the combined value case, we use a 2.0% uplift on member revenue for personalised loyalty and a 1.65% uplift on total revenue for price optimisation, both at the median of their respective credible ranges.",
          "2. RANGE & SOURCE - These points sit within evidence-backed ranges of 1-3% for loyalty-driven personalisation and 0.8-2.5% for pricing and markdown optimisation in apparel, based on consulting and trade analyses. [4][6]",
          "3. WHY THIS POINT WAS SELECTED - When midpoints are applied, the total gross margin uplift is around $184.7m, which is significantly above the 2 million dollar threshold specified in the framework; accordingly, the rule directs us to retain median values and not to shift into stretch-up territory.",
          "4. SIMPLE MATHS EXPLANATION - We calculate approximately $81.3m GM uplift from personalised loyalty (2.0% uplift on c.$6.9bn member revenue x 59.2% GM) and around $103.4m GM uplift from price optimisation (1.65% uplift on $10.6bn total revenue x 59.2% GM), and then sum these to reach roughly $184.7m.",
          "5. RESULT - The combined effect of these levers is an estimated total gross margin uplift of approximately $184.7m on Lululemon's FY2024 baseline.",
          "6. REASSURANCE - The model treats each lever independently (rather than assuming compounding or overlapping effects) and deliberately uses mid-range evidence-based assumptions, supporting a CFO-ready, defensible view of upside without engineering the numbers to a pre-set ROI target."
        ]
      }
    },
    "sources": [
      "[1] Reddit r/lululemon - \"Membership Madness Info Just Dropped in App\", March-May 2025 - https://www.reddit.com/r/lululemon/comments/1jdcziv/membership_madness_info_just_dropped_in_app/",
      "[2] Reddit r/Lululemen - \"Did anybody else think the updated membership program read like early access to disappointment?\", September 2025 - https://www.reddit.com/r/Lululemen/comments/1npx650/did_anybody_else_think_the_updated_membership/",
      "[3] Lululemon athletica inc. - FY2024 results press release and Form 8-K/earnings exhibit, 27 March 2025 - https://www.sec.gov/Archives/edgar/data/1397187/000139718725000012/lulu-20250202xex991.htm",
      "[4] Market.us / Statista via Athleisure Industry Statistics and Facts (2025), including Gen Z brand heat index and athleisure market commentary - https://media.market.us/athleisure-industry-statistics/",
      "[5] Grips Intelligence - lululemon.com ecommerce metrics (revenue, sessions, average order value) - https://gripsintelligence.com/insights/retailers/lululemon.com",
      "[6] Business Insider - \"Lululemon has a lot of problems, say Jefferies analysts: 'Sesame Street' colors, too many logos, and sales, sales, sales\" - July 2025 - https://www.businessinsider.com/lululemon-problems-jefferies-analysts-logos-sales-colors-2025-7",
      "[7] AInvest - \"Lululemon's Operational Efficiency and Margin Resilience in a Slowing Consumer Market\" and related tariff/margin commentary - https://www.ainvest.com/news/lululemon-operational-efficiency-margin-resilience-slowing-consumer-market-2509/",
      "[8] Statista - Purchase frequency of sportswear in a store in the U.S. (2018) - https://www.statista.com/forecasts/997389/frequency-of-sportswear-purchases-in-a-store-in-the-us",
      "[9] Statista - Frequency of purchasing sports apparel online and in store in the U.S. (2018) - https://www.statista.com/statistics/631209/frequency-of-purchasing-sports-apparel-online-and-in-store/",
      "[10] Vogue Business - \"Why the pink Pilates princess is actually a key consumer group\" - November 2024 - https://www.voguebusiness.com/story/fashion/why-the-pink-pilates-princess-is-actually-a-key-consumer-group",
      "[11] Lululemon official site - Sweat Collective programme description (regional pages) - https://www.lululemon.de/en-de/sweat-collective/sweatcollective.html",
      "[12] MyPurseStrings - \"Lululemon Sweat Collective: Do You Qualify for a Discount?\" - https://www.mypursestrings.com/lululemon-sweat-collective/",
      "[13] The Yoga Nomads - \"Lululemon Sweat Collective Questions Answered\" - https://www.theyoganomads.com/lululemon-sweat-collective/",
      "[14] Midland Reporter-Telegram - \"Lululemon pop-up store is coming to Midland\" - 2025 - https://www.mrt.com/news/article/lululemon-midland-park-mall-opening-20238669.php",
      "[15] Good Housekeeping - \"Lululemon Quietly Started Its Biggest Summer Sale Ever\" - June 2025 - https://www.goodhousekeeping.com/life/money/a65402686/lululemon-summer-scores-sale-2025/",
      "[16] People - \"Lululemon Is Having a Rare Year-End Sale\" - December 2025 - https://people.com/lululemon-year-end-sale-december-2025-11876499",
      "[17] People - \"Lululemon Made Too Many of These Spring Essentials\" - March 2025 - https://people.com/lululemon-we-made-too-much-march-2025-11693848",
      "[18] Wikipedia - \"Lululemon\" company overview - https://en.wikipedia.org/wiki/Lululemon",
      "[19] MacroTrends - Lululemon Athletica Inc. Cost of Goods Sold and Inventory time series - https://www.macrotrends.net/stocks/charts/LULU/lululemon-athletica-inc/cost-goods-sold",
      "[20] Business Quant - Lululemon Athletica Gross Margin 2009-2025 - https://businessquant.com/metrics/lulu/gross-margin"
    ]
  }
};
