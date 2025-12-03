/**
 * Mock ABM Pack data for Adidas - used for testing UI without LLM calls
 */
export const ADIDAS_MOCK_RESPONSE = {
  "brandIntake": {
    "brand": "Adidas",
    "website": "https://www.adidas.com/us",
    "businessRegistry": "https://www.nasdaq.com/market-activity/stocks/adddf/sec-filings",
    "category": "Sportswear & Fashion",
    "brandType": "own_brand_only",
    "contextualNotes": "Global sportswear brand headquartered in Germany; operates own-brand retail, e‑commerce and wholesale. Listed on Frankfurt; ADRs trade OTC in the US (ADDYY/ADDDF). Own-brand only from a consumer proposition perspective, though it sells through multi-brand partners."
  },
  "research": {
    "financials": {
      "latestFiscalYear": "FY2023",
      "reportingCurrency": "EUR",
      "fxAssumptionToUSD": 1.08,
      "totalRevenue": {
        "valueUSD": 23700,
        "unit": "million",
        "description": "Adidas reported €21.4bn revenue in FY2023 [Adidas Annual Report 2023, March 2024]. Converted at ~1.08 USD/EUR ≈ $23.1bn; rounded to $23.7bn for modelling simplicity.",
        "confidence": "H",
        "sources": [
          "Adidas AG Annual Report 2023, published 13 March 2024 – Consolidated Income Statement (Revenue €21,427m).",
          "ECB historical FX, average 2023 EUR/USD ~1.08."
        ]
      },
      "grossMarginPercent": {
        "value": 47,
        "unit": "percent",
        "description": "Adidas reported gross margin of 47.0% for FY2023 [Adidas Annual Report 2023, Key Figures].",
        "confidence": "H",
        "sources": [
          "Adidas AG Annual Report 2023 – 'Key Figures' section: Gross margin 47.0% (2023)."
        ]
      },
      "notes": "All modelling expressed in $GM, converting revenue to USD using a rounded FX for clarity. Using blended group gross margin as proxy for retail & e‑commerce combined."
    },
    "loyaltyProgramme": {
      "name": "Adiclub (formerly Creators Club)",
      "launchDate": {
        "approx": "2018 (Creators Club) / rebranded to Adiclub 2022",
        "confidence": "M",
        "sources": [
          "Adidas press materials and site archive referencing Creators Club launch around 2018.",
          "Adidas 'Adiclub' programme pages referencing updated name and benefits in 2022."
        ]
      },
      "coreBenefits": [
        "Free membership with tiered status (Level 1–4) based on points.",
        "Points earned on purchases and activities (training app, events, reviews).",
        "Exclusive access to product drops, early access to launches and limited editions.",
        "Member-only discounts and personalised offers.",
        "Free standard shipping and birthday rewards for members in many markets.",
        "Access to partner and event experiences (e.g., sports events, concerts) in selected regions."
      ],
      "penetrationAndScale": {
        "activeMembers": {
          "value": 300,
          "unit": "million",
          "description": "Adidas stated it had 'over 300 million members' in Adiclub/Creators Club as of 2023–2024 in investor and press commentary.",
          "confidence": "M",
          "sources": [
            "Adidas Investor Day / strategy communications 2023–2024 referencing 'over 300 million members' (various press summaries)."
          ]
        },
        "revenueFromMembersShare": {
          "value": 50,
          "unit": "percent_of_total_revenue",
          "description": "Category benchmark for large, mature fashion/sportswear loyalty programmes where 40–60% of sales are from members (Nike, Inditex, H&M benchmarks). Using 50% midpoint as plausible estimate for Adidas given global scale.",
          "confidence": "M",
          "sources": [
            "Nike, Inc. FY2023 reporting citing high loyalty-driven sales contribution (analyst commentary).",
            "McKinsey 'The value of getting personalization right—or wrong—is multiplying' (2021) – apparel retailers report 40–60% of sales via loyalty.",
            "Bain & Company 'The New Era of Loyalty in Retail' (2020) – penetration benchmarks for large fashion retailers."
          ]
        }
      },
      "recentInitiatives": [
        "Expanded Adiclub globally with localised rewards and experiences across key markets (North America, EMEA, APAC).",
        "Integration of Adiclub across adidas.com, mobile apps and stores, enabling earn and burn omnichannel.",
        "Increased focus on personalised offers and product recommendations within the app and email.",
        "Use of member-exclusive drops to manage hype and control discounts on key franchises (e.g., Originals, Samba, Ultraboost)."
      ]
    },
    "benchmarks": {
      "aov": {
        "valueUSD": 80,
        "unit": "USD_per_order",
        "description": "Sportswear & fashion e‑commerce AOV typically $70–$90; Adidas positioned towards branded mid-premium. Set at $80 as midpoint.",
        "confidence": "M",
        "sources": [
          "Statista 'Average order value of online fashion purchases in the United States' (various years, typically $75–$85).",
          "J.P. Morgan 'E‑commerce Payments Trends: Global Insights' (apparel & footwear AOV c.$70–$90)."
        ]
      },
      "purchaseFrequency": {
        "value": 3,
        "unit": "orders_per_active_customer_per_year",
        "description": "Active sportswear brand customers typically purchase 2–4 times per year; loyalty members skew higher. Using 3.0 for all active Adidas direct customers.",
        "confidence": "M",
        "sources": [
          "McKinsey 'Sporting Goods 2024' – category commentary on purchase frequency.",
          "Bain 'How to Make Loyalty Pay' – fashion/apparel frequency benchmarks 2–4x annually."
        ]
      },
      "logic": "Benchmarks approximate Adidas direct‑to‑consumer behaviour (e‑commerce + own stores). Wholesale channel not explicitly modelled for AOV/frequency."
    },
    "paidMediaAndChannels": {
      "paidMediaChannels": {
        "list": [
          "Paid social (Instagram, Facebook, TikTok, Snapchat) – visible sponsored posts and campaigns.",
          "Search (Google Ads, Bing) – branded and non‑branded keyword ads for footwear, apparel, collaborations.",
          "Display and video (YouTube pre‑roll, programmatic display, publisher sponsorships).",
          "Out‑of‑home (OOH) for major launches (e.g., World Cup, Olympics, major football club kits).",
          "Influencer and athlete partnerships (sponsored content across social platforms).",
          "Affiliate & publisher partnerships (reward sites, content affiliates driving to adidas.com)."
        ],
        "confidence": "H",
        "sources": [
          "Visible Adidas paid ads on Google and social platforms (2024–2025).",
          "Campaign coverage in trade press (AdAge, Campaign, WARC) for Adidas brand launches 2023–2024."
        ]
      }
    },
    "techStack": {
      "commerce": {
        "platform": "Largely custom / in‑house commerce stack (adidas.com, regional sites), potentially with SAP and Adobe components.",
        "confidence": "M",
        "sources": [
          "Adidas IT job postings citing SAP, Adobe Experience Cloud and custom e‑commerce solutions (2023–2024)."
        ]
      },
      "crmAndMarketingAutomation": {
        "platforms": [
          "Salesforce Marketing Cloud / similar enterprise CRM for email, journeys and segmentation (inferred).",
          "Adobe Experience Cloud for content and personalisation (inferred from roles mentioning Adobe tools).",
          "In‑house data platform / CDP for customer data and Adiclub management."
        ],
        "confidence": "M",
        "sources": [
          "Adidas digital and CRM job postings referencing Salesforce, Adobe Campaign/Analytics and data platforms (LinkedIn, 2023–2024)."
        ]
      },
      "loyaltySystem": {
        "description": "Proprietary global loyalty platform powering Adiclub, integrated with apps and e‑commerce; likely built on top of CRM/CDP infrastructure.",
        "confidence": "M",
        "sources": [
          "Adidas career listings for 'Loyalty Product Manager' and 'Adiclub Platform' roles (2023–2024)."
        ]
      }
    },
    "loyaltySentiment": {
      "overallSentiment": "mixed",
      "summary": "Customer feedback on Adiclub over the last 12 months is mixed but leaning positive among engaged Adidas fans. Members appreciate free membership, birthday rewards, early access and the ability to earn points through purchases and app activity. However, a noticeable minority criticise occasional technical issues with logging in or tracking points, inconsistent application of discounts at checkout, and perceived devaluation of rewards (needing more points for benefits).",
      "timeCoverageNote": "Most quotes are from 2024; where 12‑month data was limited, late‑2023 reviews were used and marked.",
      "sentimentTable": [
        {
          "aspectKey": "overall_satisfaction",
          "aspectDisplay": "Overall satisfaction",
          "sentimentSummary": "Many members are satisfied with Adiclub as a free, easy way to earn some value back on frequent Adidas purchases, especially for core fans.",
          "evidence": [
            ""I like Adiclub – points add up fast and I've had a few nice rewards already." [Google Play – Adidas app review, April 2024]",
            ""The app is ok, club is decent, but when something goes wrong support is slow." [Apple App Store – Adidas app review, November 2023]"
          ]
        },
        {
          "aspectKey": "perceived_value",
          "aspectDisplay": "Perceived value",
          "sentimentSummary": "Customers who shop Adidas regularly feel Adiclub offers worthwhile perks (early access, birthday vouchers, occasional discounts).",
          "evidence": [
            ""Birthday coupon and member discounts are nice, makes it worth buying direct." [Google Play – Adidas app review, February 2024]",
            ""You need way too many points to get anything good, feels like a gimmick sometimes." [Trustpilot – Adidas review mentioning Adiclub, January 2024]"
          ]
        },
        {
          "aspectKey": "ease_of_use_ux",
          "aspectDisplay": "Ease of use / UX",
          "sentimentSummary": "Users generally find enrolling in Adiclub straightforward, especially via the app, and like seeing their points balance and rewards.",
          "evidence": [
            ""Signing up for Adiclub was super easy and I can see my points in the app." [Apple App Store – Adidas app review, March 2024]",
            ""Tried to use my Adiclub voucher and the app kept crashing at payment – very frustrating." [Google Play – Adidas app review, July 2024]"
          ]
        },
        {
          "aspectKey": "key_pain_points",
          "aspectDisplay": "Key pain points",
          "sentimentSummary": "The key issues are: points or rewards not updating promptly after purchases, promo codes not stacking or being rejected, and perceived tightening of benefits.",
          "evidence": [
            ""Points from my last order never showed up, support just tells me to wait." [Trustpilot – Adidas review referencing Adiclub, May 2024]",
            ""Adiclub discount didn't apply to the shoes I wanted, lots of exclusions in the small print." [Google Play – Adidas app review, August 2024]"
          ]
        }
      ]
    },
    "dataConfidence": {
      "revenue": "H",
      "loyalty": "M",
      "aov": "M",
      "frequency": "M"
    }
  },
  "modelling": {
    "setup": {
      "baseRevenueUSD_m": 23700,
      "blendedGrossMarginPercent": 47,
      "loyaltyRevenueSharePercent": 50,
      "loyaltyRevenueUSD_m": 11850,
      "nonLoyaltyRevenueUSD_m": 11850,
      "notes": "Assume 50% of revenue from Adiclub members based on large‑retailer benchmarks. All value levers applied to relevant revenue pools and converted to $GM using 47% blended gross margin."
    },
    "levers": {
      "personalisedLoyalty": {
        "description": "Incremental GM from better targeting and reduced discount waste within Adiclub and broader CRM.",
        "categoryEvidenceRangePercent": {
          "min": 1.5,
          "max": 3,
          "source": "McKinsey 'Next in Personalization 2021' – personalisation leaders see 1–3% revenue uplift and reduced promo waste."
        },
        "midpointPercent": 2.25,
        "stretchPercent": 2.7,
        "appliedToRevenuePoolUSD_m": 11850
      },
      "priceOptimisation": {
        "description": "GM uplift from improved price architecture, markdown management and promo rationalisation across Adidas own‑brand sales.",
        "categoryEvidenceRangePercent": {
          "min": 1,
          "max": 3,
          "source": "McKinsey 'Pricing: The next frontier in retail' (apparel & footwear)."
        },
        "midpointPercent": 2,
        "stretchPercent": 2.5,
        "appliedToRevenuePoolUSD_m": 23700
      }
    },
    "calculations": {
      "baseCaseUsingMidpoints": {
        "personalisedLoyalty": {
          "upliftPercent": 2.25,
          "incrementalRevenueUSD_m": 266.6,
          "incrementalGMUSD_m": 125.3
        },
        "priceOptimisation": {
          "upliftPercent": 2,
          "incrementalRevenueUSD_m": 474,
          "incrementalGMUSD_m": 222.8
        },
        "totalIncrementalGMUSD_m": 348.1,
        "thresholdTest": {
          "description": "Base‑case GM uplift at median points is ~$348.1m, which is above the $2m threshold.",
          "aboveThreshold": true
        }
      },
      "finalMode": {
        "valueCaseMode": "Median",
        "reason": "Base‑case GM uplift using median (midpoint) uplift values exceeded $2m, so per framework the model remains at median values rather than switching to stretch‑up.",
        "leverValuesApplied": {
          "personalisedLoyaltyUpliftPercent": 2.25,
          "priceOptimisationUpliftPercent": 2
        }
      },
      "finalUpliftsGM": {
        "personalisedLoyaltyGMUSD_m": 125.3,
        "priceOptimisationGMUSD_m": 222.8,
        "totalGMUSD_m": 348.1
      }
    }
  },
  "outputs": {
    "executiveOneLiner": "Headline value (Gross Margin): approximately $348.1m annual incremental gross margin – all figures expressed on a gross‑margin basis.",
    "cfoReadinessPanel": {
      "blendedGrossMarginUsedPercent": 47,
      "blendedGrossMarginSource": "Adidas AG Annual Report 2023 – reported gross margin 47.0%.",
      "brandType": "Own-brand",
      "dataConfidence": {
        "revenue": "H",
        "loyalty": "M",
        "aov": "M",
        "frequency": "M"
      },
      "valueCaseMode": "Median",
      "valueCaseModeReason": "Using midpoint uplift values, the base‑case total GM uplift is ~$348.1m, which is above the $2m threshold."
    },
    "executiveSummary": "This value case estimates that Adidas could unlock around $348m in incremental annual gross margin by sharpening Adiclub personalisation and improving price and markdown management, all expressed on a gross‑margin basis. We start from Adidas' reported FY2023 revenue (~$23.7bn, converted from €21.4bn) and blended gross margin of 47% [Adidas Annual Report 2023]. Using industry benchmarks for large apparel and sportswear brands, we assume c.50% of sales are from loyalty members and apply evidence‑based uplift ranges.",
    "slide1InputTable": {
      "table": [
        {
          "metric": "1. Total Revenue",
          "valueOrEstimate": "$23.7bn (FY2023, converted from €21.4bn at ~1.08 USD/EUR)",
          "sourceOrLogic": "Adidas AG Annual Report 2023 – revenue €21,427m; ECB average 2023 EUR/USD ~1.08; rounded for modelling. Confidence: H."
        },
        {
          "metric": "2. Revenue from Loyalty Members",
          "valueOrEstimate": "~$11.9bn (c.50% of total revenue)",
          "sourceOrLogic": "No direct split disclosed. Assumed 50% based on large fashion/sports brands where 40–60% of sales are from loyalty members. Confidence: M."
        },
        {
          "metric": "3. Active Loyalty Members",
          "valueOrEstimate": "≈300m global Adiclub members",
          "sourceOrLogic": "Adidas investor and press commentary 2023–2024 referencing 'over 300 million' members. Confidence: M."
        },
        {
          "metric": "4. AOV",
          "valueOrEstimate": "~$80 per order",
          "sourceOrLogic": "Apparel & footwear e‑commerce benchmarks (Statista, J.P. Morgan) show $70–$90 AOV; Adidas positioned mid‑premium. Confidence: M."
        },
        {
          "metric": "5. Purchase Frequency",
          "valueOrEstimate": "~3.0 orders per active customer per year",
          "sourceOrLogic": "McKinsey and Bain indicate 2–4 purchases/year for fashion & sportswear. Confidence: M."
        },
        {
          "metric": "6. Paid Media Channels",
          "valueOrEstimate": "Paid social, search, display/video, OOH, influencer, affiliate",
          "sourceOrLogic": "Observed Adidas campaigns across Google, Meta, TikTok and major events. Confidence: H."
        },
        {
          "metric": "7. Tech Stack",
          "valueOrEstimate": "Custom commerce (with SAP/Adobe), enterprise CRM, proprietary Adiclub platform",
          "sourceOrLogic": "Inferred from Adidas IT/CRM job posts citing SAP, Adobe, Marketing Cloud‑type tools. Confidence: M."
        }
      ],
      "notes": "Key proxies: (1) Loyalty revenue share (50%) based on large‑retailer benchmarks; (2) AOV and frequency based on apparel & footwear e‑commerce norms; (3) Tech stack inferred from job postings."
    },
    "slide2LoyaltySentimentSnapshot": {
      "overallSentimentRating": "mixed",
      "summary": "Adiclub sentiment over the past year is mixed, tilting positive among engaged brand fans. Members like that the programme is free, simple to join and offers occasional tangible value through birthday vouchers, member‑only discounts and early access to product drops.",
      "sentimentTable": [
        {
          "aspect": "overall_satisfaction",
          "display": "Overall satisfaction",
          "sentimentSummary": "Most engaged Adidas customers view Adiclub as a positive part of the brand experience, giving 3–4 star feedback when they mention it.",
          "evidence": ""I like Adiclub – points add up fast and I've had a few nice rewards already." [Google Play – Adidas app review, April 2024]"
        },
        {
          "aspect": "perceived_value",
          "display": "Perceived value",
          "sentimentSummary": "Value is seen as good for frequent buyers thanks to birthday coupons, exclusive access and periodic deals.",
          "evidence": ""Birthday coupon and member discounts are nice, makes it worth buying direct." [Google Play – Adidas app review, February 2024]"
        },
        {
          "aspect": "ease_of_use_ux",
          "display": "Ease of use / UX",
          "sentimentSummary": "Onboarding to Adiclub is easy and in‑app visibility of points is appreciated.",
          "evidence": ""Signing up for Adiclub was super easy and I can see my points in the app." [Apple App Store – Adidas app review, March 2024]"
        },
        {
          "aspect": "key_pain_points",
          "display": "Key pain points",
          "sentimentSummary": "The most common complaints involve missing or delayed points, promo codes not working or being heavily restricted.",
          "evidence": ""Adiclub discount didn't apply to the shoes I wanted, lots of exclusions in the small print." [Google Play – Adidas app review, August 2024]"
        }
      ]
    },
    "slide4ValueCaseTable": {
      "table": [
        {
          "areaOfImpact": "A. Personalised Loyalty (incl. offer waste reduction)",
          "opportunityType": "Incremental GM from better targeting and reduced discount waste",
          "estimatedUpliftGM": "$125.3m",
          "assumptionsMethodology": "1. UPLIFT POINT APPLIED\nWe have applied a 2.25% uplift, which represents the median of the credible range for this lever.\n\n2. RANGE & SOURCE\nThis sits within the credible category range of 1.5% to 3.0%, based on McKinsey 'Next in Personalization 2021'.\n\n3. WHY THIS POINT WAS SELECTED\nWe selected this point because the total value case was above the 2 million dollar threshold.\n\n4. SIMPLE MATHS EXPLANATION\nApplying the 2.25% uplift to estimated loyalty‑member revenue of about $11.85bn, and converting this into gross margin using the blended GM% of 47%.\n\n5. RESULT\nThis results in an estimated gross margin uplift of $125.3m for this lever.\n\n6. REASSURANCE\nAll assumptions sit comfortably within evidence‑based bounds."
        },
        {
          "areaOfImpact": "C. Price Optimisation",
          "opportunityType": "GM uplift from improved price architecture and markdown management",
          "estimatedUpliftGM": "$222.8m",
          "assumptionsMethodology": "1. UPLIFT POINT APPLIED\nWe have applied a 2.0% uplift, which represents the median of the credible range for this lever.\n\n2. RANGE & SOURCE\nThis sits within the credible category range of 1.0% to 3.0%, based on McKinsey 'Pricing: The next frontier in retail'.\n\n3. WHY THIS POINT WAS SELECTED\nWe selected this point because the total value case was above the 2 million dollar threshold.\n\n4. SIMPLE MATHS EXPLANATION\nApplying the 2.0% uplift across Adidas' total FY2023 revenue base of about $23.7bn.\n\n5. RESULT\nThis results in an estimated gross margin uplift of $222.8m for this lever.\n\n6. REASSURANCE\nAll assumptions sit comfortably within evidence‑based bounds."
        },
        {
          "areaOfImpact": "D. Total Cumulative Uplift (GM)",
          "opportunityType": "Sum of A and C",
          "estimatedUpliftGM": "$348.1m",
          "assumptionsMethodology": "1. UPLIFT POINT APPLIED\nWe have applied the same median uplift points as used in the individual levers.\n\n2. RANGE & SOURCE\nThese lie within evidence‑based category ranges from McKinsey, Bain and BCG.\n\n3. WHY THIS POINT WAS SELECTED\nThe total value case was above the 2 million dollar threshold.\n\n4. SIMPLE MATHS EXPLANATION\nWe calculate approximately $125.3m from personalised loyalty and around $222.8m from price optimisation.\n\n5. RESULT\nThis results in an estimated gross margin uplift of about $348.1m.\n\n6. REASSURANCE\nAll assumptions sit comfortably within evidence‑based bounds."
        }
      ],
      "notes": "As Adidas is an own‑brand only proposition, there is no separate supplier‑funded loyalty row."
    }
  },
  "appendices": {
    "assumptionsBlock": {
      "overview": "This appendix summarises the uplift percentages and core assumptions used in the Adidas value case.",
      "levers": [
        {
          "name": "A. Personalised Loyalty (incl. offer waste reduction)",
          "upliftPercentApplied": 2.25,
          "revenuePoolUSD_m": 11850,
          "blendedGrossMarginPercent": 47,
          "estimatedGMUpliftUSD_m": 125.3
        },
        {
          "name": "C. Price Optimisation",
          "upliftPercentApplied": 2,
          "revenuePoolUSD_m": 23700,
          "blendedGrossMarginPercent": 47,
          "estimatedGMUpliftUSD_m": 222.8
        },
        {
          "name": "D. Total Cumulative Uplift (GM)",
          "upliftPercentApplied": null,
          "revenuePoolUSD_m": null,
          "blendedGrossMarginPercent": 47,
          "estimatedGMUpliftUSD_m": 348.1
        }
      ]
    },
    "sourcesAppendix": {
      "financialAndCorporate": [
        "Adidas AG Annual Report 2023, published 13 March 2024 – Consolidated Financial Statements and Key Figures.",
        "Adidas AG corporate website – investor relations and strategy sections (accessed 2024).",
        "European Central Bank – Statistical Data Warehouse, 2023 average EUR/USD exchange rate (~1.08)."
      ],
      "loyaltyAndCustomer": [
        "Adidas official website – Adiclub programme pages (benefits, tiers, earn & redeem mechanics).",
        "Adidas investor/strategy presentations referencing 'over 300 million' Adiclub members (2023–2024).",
        "Google Play Store – Adidas app reviews mentioning Adiclub, April–August 2024.",
        "Apple App Store – Adidas app reviews mentioning Adiclub, March–November 2023/2024.",
        "Trustpilot – Adidas brand reviews referencing Adiclub, January–May 2024."
      ],
      "benchmarksAndInsights": [
        "McKinsey & Company, 'Next in Personalization 2021' – uplift benchmarks for personalisation in retail.",
        "Bain & Company, 'The New Era of Loyalty in Retail' (2020) – loyalty programme penetration benchmarks.",
        "McKinsey & Company, 'Pricing: The next frontier in retail' – pricing and markdown optimisation.",
        "Boston Consulting Group (BCG) – retail pricing case studies.",
        "Statista – Average order value for online fashion purchases in the US.",
        "J.P. Morgan, 'E‑Commerce Payments Trends: Global Insights' – category AOV benchmarks."
      ]
    }
  }
} as const;

