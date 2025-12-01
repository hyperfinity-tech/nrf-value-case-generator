"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { ChevronDown, ChevronRight, Download, Loader2 } from "lucide-react";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface FormState {
  brand: string;
  website: string;
  registryUrl: string;
  category: string;
  brandType: "own_brand_only" | "multi_brand" | "mixed";
  notes: string;
  selectedModel: "chat-model" | "chat-model-reasoning";
  useMockResponse: boolean;
}

// Mock response for testing UI without LLM calls
const MOCK_RESPONSE: FlexibleResponse = {
  "brandIntake": {
    "brand": "CVS Health",
    "website": "https://www.cvshealth.com/",
    "businessRegistry": "https://www.sec.gov/cgi-bin/browse-edgar?CIK=CVS&Find=Search&owner=exclude&action=getcompany",
    "category": "Healthcare / Pharmacy & Health Services Retail",
    "brandType": "own_brand_only",
    "contextualNotes": "CVS Health is a diversified healthcare company operating retail pharmacies, pharmacy benefit management (Caremark), and health services (Health Care Benefits segment incl. Aetna). For this pack we focus primarily on the US retail pharmacy / front-store commerce and ExtraCare loyalty ecosystem as the core for ABM modelling."
  },
  "research": {
    "financials": {
      "latestFiscalYear": "FY 2023",
      "totalRevenueUSD": {
        "value": 357.8,
        "unit": "billion",
        "description": "Total consolidated revenue for CVS Health Corporation FY 2023",
        "source": "CVS Health Form 10-K for the fiscal year ended 31 Dec 2023, Item 6 – Selected Financial Data / Item 7 – Management's Discussion and Analysis (filed Feb 2024).",
        "confidence": "H"
      },
      "segmentNotes": "CVS reports three main segments: Health Care Benefits, Health Services, and Pharmacy & Consumer Wellness (retail & mail pharmacy plus front store). For ABM value-case purposes we focus on Pharmacy & Consumer Wellness, but since segment-only GM% is not disclosed cleanly, we use a blended gross margin proxy calibrated to US pharmacy / drug retail benchmarks.",
      "grossMarginPercent": {
        "value": 23,
        "unit": "percent",
        "description": "Working blended GM% used for modelling; aligned with US drugstore / pharmacy retail peers (Walgreens Boots Alliance c. 21–23% GM; McKinsey / Bain category ranges for health & beauty retail). CVS 10-K reports gross profit but the inclusion of insurance/benefits activities complicates a clean retail-only GM%; therefore a 23% blended proxy is used.",
        "source": "Walgreens Boots Alliance FY 2023 Form 10-K (gross margin c. 21–23%); Bain & Company, 'Retail in 2023: Health & Beauty' GM benchmarks; triangulated against CVS gross profit in 2023 10-K.",
        "confidence": "M"
      }
    },
    "loyaltyProgramme": {
      "name": "ExtraCare (including ExtraCare Pharmacy & BeautyClub)",
      "launchDate": {
        "value": "1997",
        "description": "CVS launched ExtraCare as one of the first mass pharmacy loyalty programmes in the US.",
        "source": "CVS corporate history and loyalty trade press coverage (e.g., Loyalty360 coverage of ExtraCare milestones, 2017).",
        "confidence": "M"
      },
      "keyBenefits": [
        "Digital and paper coupons tailored to purchase history",
        "2% back in ExtraBucks Rewards on certain purchases (typically loaded monthly/quarterly)",
        "Member-only sale prices and personalised offers via app, email and till receipts",
        "ExtraCare Pharmacy & Health Rewards (credits for filling prescriptions, vaccinations and health activities, subject to regulations)",
        "BeautyClub perks with additional rewards on qualifying beauty purchases"
      ],
      "penetrationAndMembers": {
        "activeMembers": {
          "value": 74,
          "unit": "million",
          "description": "Approximate active ExtraCare members; most recent widely cited figure is 'over 74 million active ExtraCare members'.",
          "source": "Loyalty industry case studies and press citing CVS senior leaders; e.g., Bond Brand Loyalty and Loyalty360 case references (2022–2023).",
          "confidence": "M"
        },
        "penetrationRateRetailSales": {
          "value": 80,
          "unit": "percent",
          "description": "Estimated share of front-store retail sales linked to ExtraCare accounts.",
          "source": "Pharmacy / grocery category benchmarks where mature loyalty schemes typically capture 70–90% of tills; McKinsey 'Personalizing the store experience' (2021) and KPMG 'The truth about customer loyalty' in grocery/pharmacy.",
          "confidence": "M"
        }
      },
      "recentInitiatives": [
        {
          "title": "ExtraCare personalisation enhancements and digital offers",
          "description": "Expansion of personalised digital coupons and in-app offers, with greater reliance on data science for offer targeting and de-duplication of paper vs. digital.",
          "source": "CVS Health 2023 Form 10-K and earnings commentary highlighting investment in digital engagement and ExtraCare enhancements.",
          "confidence": "M"
        },
        {
          "title": "Health-focused rewards (Rx and vaccinations)",
          "description": "Integration of Pharmacy & Health Rewards, giving ExtraBucks credits for chronic medication adherence, vaccinations and other qualified health activities, within regulatory limits.",
          "source": "CVS ExtraCare programme descriptions on cvs.com and CVS Health corporate site (2023–2024).",
          "confidence": "H"
        }
      ]
    },
    "benchmarks": {
      "scopeNote": "CVS spans retail pharmacy, front-store health & beauty, and healthcare services. For ABM modelling, we use retail pharmacy / drugstore benchmarks for AOV and frequency, aligned to US mass-market health & beauty and convenience retail.",
      "aovUSD": {
        "value": 45,
        "unit": "USD per transaction",
        "description": "Estimated blended basket size across front-store and pharmacy co-baskets.",
        "source": "US drugstore / pharmacy transaction size benchmarks (Statista 'Average transaction value in US drug stores' and McKinsey consumer health retail benchmarks, 2021–2023), adjusted to reflect CVS's mix of prescriptions and front store.",
        "confidence": "M"
      },
      "purchaseFrequencyPerYear": {
        "value": 18,
        "unit": "transactions per active customer per year",
        "description": "Estimated average for active ExtraCare members combining quick convenience trips, prescriptions refills and seasonal shopping.",
        "source": "Bain & Company 'How shoppers buy health and beauty' (2019) and McKinsey 'US grocery and pharmacy loyalty behaviour' (2020–2022), which show 15–24 annual visits for engaged pharmacy/grocery loyalty members.",
        "confidence": "M"
      }
    },
    "paidMediaAndTech": {
      "paidMediaChannels": {
        "channels": [
          "Search (Google Ads for pharmacy, MinuteClinic, vaccinations, health services)",
          "Paid social (Meta, Instagram, TikTok for promotions and health campaigns)",
          "Programmatic display and online video (CTV/OTT) for brand and flu/ COVID vaccination campaigns",
          "Direct mail and circulars (weekly offers and ExtraCare coupons)",
          "Email marketing and SMS (offer notifications and health reminders)",
          "In-app and onsite media placements on CVS.com and CVS Pharmacy app"
        ],
        "evidence": "Visible Google search ads for CVS Pharmacy and MinuteClinic; CVS brand campaigns on YouTube and CTV reported in trade press; CVS job postings for digital media and performance marketing roles (LinkedIn, 2023–2024).",
        "confidence": "M"
      },
      "techStack": {
        "commerce": {
          "description": "CVS uses a custom enterprise commerce stack for cvs.com and CVS Pharmacy app, integrated with pharmacy systems rather than an off-the-shelf SaaS e-commerce platform.",
          "source": "Technology job postings for CVS Digital (engineering roles referencing proprietary platforms and microservices) and traffic rank of cvs.com.",
          "confidence": "M"
        },
        "crm_loyalty": {
          "description": "Enterprise CRM and loyalty data platform combining ExtraCare, Caremark and health plan data, reportedly leveraging major cloud providers and data warehousing (e.g., Azure/AWS, Snowflake) plus in-house data science.",
          "source": "CVS Health data & analytics job descriptions (data engineering, CRM and marketing science roles, 2023–2024).",
          "confidence": "M"
        },
        "marketingAutomation": {
          "description": "Cross-channel orchestration of email, SMS, and push notifications likely via enterprise marketing clouds (Adobe, Salesforce, or similar) combined with internal systems.",
          "source": "Martech/CRM job postings and vendor case studies referencing large US healthcare/retail clients (no explicit vendor named for CVS publicly).",
          "confidence": "L"
        }
      }
    },
    "loyaltySentiment": {
      "overallSentimentRating": "mixed",
      "narrativeSummary": "Public feedback over the last 12–18 months indicates that CVS ExtraCare and the CVS Pharmacy app are valued for personalised coupons and occasional high-value ExtraBucks offers, especially among frequent shoppers. However, sentiment is mixed overall. Many reviewers complain about offers that are confusing, expiring too quickly or not applying correctly at checkout. Some frustration is directed at the app's usability and integration with in-store systems (e.g., issues with digital coupons, pharmacy queueing and log-ins), which users often conflate with loyalty performance. Positive voices highlight meaningful savings on everyday items and prescriptions when they engage consistently with digital coupons. Negative feedback centres on technical glitches, opaque rules, and a perception that 'you must work hard' to get full value. Most comments come from active customers already using the app and ExtraCare, rather than from non-members.",
      "timeCoverageNote": "Most direct loyalty and CVS Pharmacy app reviews cluster in 2023–2024; where older quotes provide clear ExtraCare-specific sentiment they are used sparingly and identified as outside the last 12 months.",
      "sentimentTable": [
        {
          "aspectKey": "overall_satisfaction",
          "aspectDisplay": "Overall satisfaction",
          "sentimentSummary": "Customers are split: engaged ExtraCare users report strong savings and satisfaction, while others express fatigue with the complexity and glitches. Overall tone is moderately positive but inconsistent across locations and digital touchpoints.",
          "evidence": [
            "\"I save a lot using ExtraCare coupons and weekly deals, it really adds up if you check the app.\" [Google Play – CVS Pharmacy app review, Feb 2024]",
            "\"Sometimes the rewards are great, but most of the time it's a hassle with coupons not working or disappearing.\" [App Store review, Nov 2023]"
          ]
        },
        {
          "aspectKey": "perceived_value",
          "aspectDisplay": "Perceived value",
          "sentimentSummary": "Value perception is generally positive among active members who stack ExtraBucks, sale prices and manufacturer coupons. Criticism focuses on shrinking discounts, product exclusions and rewards that expire quickly, creating a 'use it or lose it' pressure.",
          "evidence": [
            "\"ExtraBucks and personalised coupons make CVS cheaper than other pharmacies for me.\" [Google Maps store review, Aug 2024]",
            "\"Rewards used to be better – now it feels like tiny coupons that expire before I can use them.\" [Google Play – CVS Pharmacy app review, Jan 2024]"
          ]
        },
        {
          "aspectKey": "ease_of_use_ux",
          "aspectDisplay": "Ease of use / UX",
          "sentimentSummary": "The CVS Pharmacy app interface for ExtraCare is considered acceptable when it works, but reviewers frequently report sign-in problems, coupon clipping not syncing to tills, and slow performance. Less tech-savvy customers struggle with understanding how to activate and redeem offers.",
          "evidence": [
            "\"App is fine when it actually loads – clipping coupons is easy and they show at checkout.\" [App Store review, May 2024]",
            "\"Coupons disappear or don't apply, constant errors signing in – very frustrating.\" [Google Play – CVS Pharmacy app review, Mar 2024]"
          ]
        },
        {
          "aspectKey": "key_pain_points",
          "aspectDisplay": "Key pain points",
          "sentimentSummary": "Recurring pain points include digital coupons not applying, ExtraBucks vanishing or expiring prematurely, confusing exclusions, and inconsistency between app prices and in-store tills. Some customers distrust the programme because they feel promised savings are not reliably delivered.",
          "evidence": [
            "\"My ExtraBucks were there yesterday, gone today at checkout. Staff couldn't explain it.\" [Google Maps store review, Jul 2024]",
            "\"Prices in the app don't match the register and half my coupons never come off.\" [Google Play – CVS Pharmacy app review, Oct 2023]"
          ]
        }
      ]
    },
    "dataConfidenceSummary": {
      "revenue": "H",
      "loyalty": "M",
      "aov": "M",
      "frequency": "M"
    }
  },
  "modelling": {
    "scopeAndBaseAssumptions": {
      "modellingScopeNote": "To build a realistic but conservative ABM value case, we focus on the subset of CVS revenue most directly influenced by ExtraCare-directed retail activity rather than total CVS Health system-wide revenue.",
      "retailRelevantRevenue": {
        "value": 110,
        "unit": "billion",
        "description": "Approximate revenue base used for loyalty and price optimisation levers, representing an estimated share of CVS's consolidated revenue that is materially influenced by ExtraCare-driven retail behaviour (pharmacy plus front-of-store). This is a modelling construct, not a reported segment figure.",
        "logic": "CVS does not provide a single clean 'retail only' revenue line post-organisation changes. Public commentary historically placed CVS retail/pharmacy revenues in the c. $90–120bn range. For ABM modelling we use $110bn as a rounded, conservative base.",
        "confidence": "L"
      },
      "extraCareShareOfRetailRevenue": {
        "value": 80,
        "unit": "percent",
        "description": "Estimated proportion of relevant retail revenue that is transacted by identifiable ExtraCare customers.",
        "logic": "In line with mature grocery/pharmacy loyalty programmes capturing 70–90% of tills, and the large active ExtraCare base.",
        "confidence": "M"
      },
      "gmPercentUsed": {
        "value": 23,
        "unit": "percent",
        "description": "Blended GM% used to convert revenue uplift into gross margin uplift.",
        "confidence": "M"
      },
      "gmDollarBase": {
        "value": 20.24,
        "unit": "billion",
        "description": "Approximate gross margin dollars attributable to ExtraCare-linked retail revenue base used for modelling.",
        "calculation": "Retail relevant revenue ($110bn) × ExtraCare share (80%) × GM% (23%) ≈ $20.24bn GM.",
        "confidence": "L"
      }
    },
    "upliftRanges": {
      "personalisedLoyalty": {
        "credibleRangePercent": { "min": 1, "max": 4 },
        "description": "Incremental gross margin from better targeting, reduced offer waste, and improved retention among loyalty members.",
        "source": "McKinsey 'Next in personalization 2021' (1–3% sales uplift for basic personalisation; up to 5% for advanced practitioners); Bain & Company retail loyalty case studies.",
        "confidence": "M"
      },
      "priceOptimisation": {
        "credibleRangePercent": { "min": 1, "max": 3 },
        "description": "Gross margin uplift from price architecture optimisation and markdown management for health & beauty / drugstore retail.",
        "source": "McKinsey 'Pricing: The next frontier in retail' (2018) showing 1–3% margin uplift; PwC and Bain price optimisation case studies in consumer retail.",
        "confidence": "M"
      }
    },
    "upliftPointsSelected": {
      "midpointValues": { "personalisedLoyaltyPercent": 2.5, "priceOptimisationPercent": 2 },
      "stretchUpValues": { "personalisedLoyaltyPercent": 3.5, "priceOptimisationPercent": 2.5 },
      "selectionLogic": "Midpoints are the simple median of the credible percentage ranges. Stretch-up points are set around the 70–80th percentile of those ranges while staying safely below the maximums."
    },
    "baseCaseUsingMidpoints": {
      "calculationDetail": "Base GM uplift is calculated on the ExtraCare-attributable GM base of $20.24bn.",
      "personalisedLoyaltyGMUplift": { "value": 0.506, "unit": "billion", "description": "2.5% of $20.24bn.", "confidence": "M" },
      "priceOptimisationGMUplift": { "value": 0.405, "unit": "billion", "description": "2.0% of $20.24bn.", "confidence": "M" },
      "baseCaseTotalGMUplift": { "value": 0.911, "unit": "billion", "description": "Sum of personalised loyalty and price optimisation uplifts under midpoint assumptions: ≈$0.91bn GM.", "confidence": "M" },
      "thresholdComparison": { "meetsThreshold": false, "explanation": "The midpoint-based base case total gross margin uplift is approximately $0.91bn, which is below the $2m threshold. Under the modelling rules, we therefore switch to stretch-up values for all levers." }
    },
    "finalModeApplied": {
      "valueCaseMode": "Stretch-up",
      "reason": "Base-case midpoint uplift on the defined GM base is below the $2m threshold, so stretch-up uplift percentages are applied consistently across all levers in the final value case."
    },
    "finalUpliftUsingStretchUp": {
      "personalisedLoyaltyGMUplift": { "percentApplied": 3.5, "gmUpliftValue": 0.708, "unit": "billion", "description": "3.5% of $20.24bn GM ≈ $0.708bn GM uplift.", "confidence": "M" },
      "priceOptimisationGMUplift": { "percentApplied": 2.5, "gmUpliftValue": 0.506, "unit": "billion", "description": "2.5% of $20.24bn GM ≈ $0.506bn GM uplift.", "confidence": "M" },
      "totalGMUplift": { "value": 1.214, "unit": "billion", "description": "Total cumulative estimated gross margin uplift from both levers at stretch-up points: ≈$1.21bn GM.", "confidence": "M" }
    }
  },
  "outputs": {
    "executiveOneLiner": "Headline value (Gross Margin): approximately $1.2bn GM uplift potential from ExtraCare-focused personalisation and price optimisation – all figures expressed on a gross-margin basis.",
    "cfoReadinessPanel": {
      "blendedGMPercentUsed": "23% (proxy based on US drugstore / pharmacy retail peers and CVS gross profit disclosure; see research and appendices).",
      "brandType": "Own-brand only (CVS-owned retail operations; while third-party brands are sold, pricing and offers are controlled centrally rather than through classic supplier-funded trade marketing used in multi-retailer environments).",
      "dataConfidence": { "revenue": "H", "loyalty": "M", "AOV": "M", "frequency": "M" },
      "valueCaseMode": "Stretch-up – applied because the midpoint-based base case was below the $2m GM uplift threshold; all levers therefore use upper-mid stretch percentages within evidence-based ranges."
    },
    "executiveSummary": "This value case quantifies how CVS Health can unlock additional gross margin from its ExtraCare ecosystem by improving personalisation and price/markdown management on an identified retail GM base of c. $20.2bn. We estimate uplift using published category evidence for pharmacy and health & beauty retailers, triangulated with CVS's 2023 10-K and public loyalty information. Personalised loyalty focuses on better targeting, higher engagement and reduced discount waste across 74m+ active ExtraCare members; price optimisation targets rationalised promotions, markdown control and more disciplined price architecture. Using the midpoint of the evidence ranges, the total uplift is around $0.9bn GM, below the $2m rule trigger, so we re-run the model using upper-mid 'stretch-up' assumptions still well inside published benchmarks. This yields an estimated combined opportunity of roughly $1.2bn GM. Strategically, this matters now because ExtraCare is highly penetrated but customer sentiment is mixed, and CVS is already investing heavily in digital engagement, data and pharmacy integration – making targeted optimisation both feasible and time-critical.",
    "slide1InputTable": {
      "tableMarkdown": "| Metric | Value / Estimate | Source / Logic |\n| --- | --- | --- |\n| 1. Total Revenue | $357.8bn (FY 2023 consolidated CVS Health revenue) | CVS Health Form 10-K FY 2023, filed Feb 2024 – total revenue figure. (Confidence: H) |\n| 2. Revenue from Loyalty Members | ≈$88.0bn revenue attributed to ExtraCare-linked retail transactions | Modelling assumption: retail-relevant revenue base ≈$110bn × 80% captured via ExtraCare. In line with mature grocery/pharmacy loyalty penetration benchmarks (McKinsey, KPMG). (Confidence: L–M) |\n| 3. Active Loyalty Members | c. 74m ExtraCare members | Loyalty trade press and CVS case references citing \"over 74 million active ExtraCare members\" (2022–2023). (Confidence: M) |\n| 4. AOV | ≈$45 per transaction | Proxy from US drugstore / pharmacy transaction benchmarks (Statista, McKinsey retail health & beauty analyses). Adjusted for prescription + front-store mix. (Confidence: M) |\n| 5. Purchase Frequency | ≈18 transactions per active ExtraCare customer per year | Based on Bain & McKinsey benchmarks for engaged grocery / pharmacy loyalty members (c. 15–24 visits annually). (Confidence: M) |\n| 6. Paid Media Channels | Search, paid social, programmatic/CTV, email/SMS, direct mail, in-app/onsite media | Observed Google search ads and YouTube/CTV campaigns; CVS performance media job postings (LinkedIn, 2023–2024). (Confidence: M) |\n| 7. Tech Stack | Custom enterprise commerce stack; enterprise CRM/loyalty platform; enterprise marketing automation | Inferred from CVS technology job descriptions (digital engineering, CRM, data platforms) and absence of public off-the-shelf commerce platform disclosures. (Confidence: M–L) |\n\nNotes: The $110bn 'retail-relevant revenue' base is a conservative modelling construct reflecting the portion of CVS revenue most directly influenced by ExtraCare-driven behaviour, not an official segment disclosure. ExtraCare penetration and activity estimates rely on sector benchmarks; where CVS-specific numbers are unavailable, we explicitly use industry proxies and mark them as M/L confidence.",
      "notes": "All monetary figures are in USD. The GM% used (23%) is a proxy based on peer disclosures (e.g., Walgreens) and sector analyses, cross-checked with CVS's reported gross profit. Where CVS does not provide direct figures (e.g., AOV, visit frequency), we rely on reputable consulting and data sources (McKinsey, Bain, Statista) and keep assumptions conservative."
    },
    "slide2LoyaltySentimentSnapshot": {
      "overallSentiment": "mixed",
      "summary": "ExtraCare and the CVS Pharmacy app are widely used and deliver meaningful savings for many engaged customers. Positive comments highlight strong value from stacking ExtraBucks, personalised coupons and sale prices, particularly for frequent prescription and everyday purchases. However, sentiment over the last 12 months is mixed. A substantial volume of reviews report frustration with coupons disappearing, not applying, or expiring too quickly. Customers also complain about inconsistent prices between app and tills, sign-in issues and slow or buggy app performance, which directly affects their loyalty experience. These issues erode trust in the programme, with some users feeling they must 'fight' to get the rewards they are promised. The majority of reviews analysed come from existing ExtraCare users interacting with the CVS Pharmacy app and stores, rather than from non-members or lapsed customers.",
      "sentimentTableMarkdown": "| Aspect | Sentiment Summary | Evidence (Quotes & Sources) |\n| --- | --- | --- |\n| Overall satisfaction | Customers are divided. Regular ExtraCare users often report good savings and overall satisfaction, while others describe the programme and app as frustrating or unreliable. | \"I save a lot using ExtraCare coupons and weekly deals, it really adds up if you check the app.\" [Google Play – CVS Pharmacy app review, Feb 2024]  \n\"Sometimes the rewards are great, but most of the time it's a hassle with coupons not working or disappearing.\" [App Store review, Nov 2023] |\n| Perceived value | Perceived value is generally positive among engaged users, who see CVS as competitive on price when they fully leverage ExtraBucks and coupons. Negative views focus on smaller discounts, exclusions and fast-expiring rewards. | \"ExtraBucks and personalised coupons make CVS cheaper than other pharmacies for me.\" [Google Maps store review, Aug 2024]  \n\"Rewards used to be better – now it feels like tiny coupons that expire before I can use them.\" [Google Play – CVS Pharmacy app review, Jan 2024] |\n| Ease of use / UX | The app and digital coupons are seen as convenient when they work, but a significant number of customers struggle with login issues, syncing of clipped coupons to registers and general app stability. | \"App is fine when it actually loads – clipping coupons is easy and they show at checkout.\" [App Store review, May 2024]  \n\"Coupons disappear or don't apply, constant errors signing in – very frustrating.\" [Google Play – CVS Pharmacy app review, Mar 2024] |\n| Key pain points | Main pain points include vanishing or non-applying ExtraBucks, confusing exclusions, discrepancies between app and in-store pricing, and an overall sense that promised savings are not always delivered. | \"My ExtraBucks were there yesterday, gone today at checkout. Staff couldn't explain it.\" [Google Maps store review, Jul 2024]  \n\"Prices in the app don't match the register and half my coupons never come off.\" [Google Play – CVS Pharmacy app review, Oct 2023] |"
    },
    "slide4ValueCaseTable": {
      "tableMarkdown": "| Area of Impact | Opportunity Type | Estimated Uplift ($GM) | Assumptions / Methodology |\n| --- | --- | --- | --- |\n| A. Personalised Loyalty (incl. offer waste reduction) | Incremental GM from better targeting and reduced discount waste | ~$0.71bn GM | 1. UPLIFT POINT APPLIED  \nWe have applied a 3.5% uplift, which represents the upper-mid stretch of the credible range for this lever.  \n2. RANGE & SOURCE  \nThis sits within the credible category range of 1% to 4%, based on McKinsey's 'Next in personalization 2021' and Bain retail loyalty case studies showing 1–3% typical sales uplift and up to ~4–5% for advanced personalisation in health & beauty and grocery.  \n3. WHY THIS POINT WAS SELECTED  \nWe selected this point because the total value case was below the 2 million dollar threshold under midpoint assumptions, which means the model uses the stretch-up rule for all levers.  \n4. SIMPLE MATHS EXPLANATION  \nIn practice, this means applying the 3.5% uplift to the estimated ExtraCare-attributable gross margin base of ~$20.24bn (derived from ~$110bn retail-relevant revenue × 80% ExtraCare penetration × 23% blended GM%), focusing on improvements in targeted offers, activation, and reduced discount waste across the loyalty member base.  \n5. RESULT  \nThis results in an estimated gross margin uplift of approximately $0.71bn for this lever.  \n6. REASSURANCE  \nAll assumptions sit comfortably within evidence-based bounds and avoid reliance on extreme best-case scenarios, recognising CVS's scale and current maturity in loyalty and digital personalisation. |\n| C. Price Optimisation | GM uplift from improved price architecture and markdown management | ~$0.51bn GM | 1. UPLIFT POINT APPLIED  \nWe have applied a 2.5% uplift, which represents the upper-mid stretch of the credible range for this lever.  \n2. RANGE & SOURCE  \nThis sits within the credible category range of 1% to 3%, based on McKinsey's 'Pricing: The next frontier in retail' and similar analyses showing 1–3% gross margin uplift from disciplined price architecture, promotion optimisation and markdown management in large-format retailers.  \n3. WHY THIS POINT WAS SELECTED  \nWe selected this point because the total value case was below the 2 million dollar threshold when using midpoint values, triggering the stretch-up rule and justifying an upper-mid assumption within the evidence-based range.  \n4. SIMPLE MATHS EXPLANATION  \nIn practice, this means applying the 2.5% uplift to the same ExtraCare-attributable gross margin base of ~$20.24bn, focusing on optimising base prices, promotional intensity (e.g., multi-buy vs. loyalty offers), and markdown strategy across front-store categories while maintaining compliance in pharmacy pricing.  \n5. RESULT  \nThis results in an estimated gross margin uplift of approximately $0.51bn for this lever.  \n6. REASSURANCE  \nAll assumptions sit comfortably within evidence-based bounds and reflect realistic, phased deployment of better pricing analytics and governance rather than a wholesale re-pricing of the business. |\n| D. Total Cumulative Uplift (GM) | Sum of A and C | ~$1.21bn GM | 1. UPLIFT POINT APPLIED  \nThe total combines a 3.5% uplift from personalised loyalty and a 2.5% uplift from price optimisation, both at upper-mid stretch points of their respective credible ranges.  \n2. RANGE & SOURCE  \nIndividually, these sit within credible ranges of 1–4% (personalisation) and 1–3% (pricing), as supported by McKinsey and Bain research on retail personalisation and pricing.  \n3. WHY THIS POINT WAS SELECTED  \nWe selected these points because the midpoint-based value case was below the 2 million dollar threshold, so the model is required to use stretch-up parameters across all levers while staying firmly inside evidence-based bounds.  \n4. SIMPLE MATHS EXPLANATION  \nIn practice, we apply the respective 3.5% and 2.5% uplifts to the estimated ExtraCare-attributable gross margin base of ~$20.24bn, and then sum the two resulting gross margin uplifts to arrive at the total.  \n5. RESULT  \nThis results in an estimated cumulative gross margin uplift of approximately $1.21bn when both levers are executed effectively.  \n6. REASSURANCE  \nAll assumptions are anchored in external benchmarks for large-scale pharmacy and health & beauty retailers and avoid assuming full theoretical maximums or perfect execution; the figures represent an achievable yet ambitious scenario. |"
    }
  },
  "appendices": {
    "assumptionsBlock": {
      "personalisedLoyalty": {
        "leverName": "Personalised Loyalty (incl. offer waste reduction)",
        "upliftPercentApplied": 3.5,
        "gmBaseUsed": 20.24,
        "gmUpliftResult": 0.708,
        "sixStepBreakdown": [
          "1. UPLIFT POINT APPLIED\nWe have applied a 3.5% uplift to the ExtraCare-attributable gross margin base. This represents the upper-mid stretch of the credible range for loyalty-driven personalisation and offer optimisation.",
          "2. RANGE & SOURCE\nThis 3.5% assumption sits within an evidence-based category range of 1% to 4%, based on McKinsey's 'Next in personalization 2021' and Bain & Company retail loyalty cases, which show that advanced data-driven personalisation in grocery and health & beauty can deliver 1–3% revenue uplift typically, with top performers achieving up to around 4–5%.",
          "3. WHY THIS POINT WAS SELECTED\nThe midpoint-based total value case produced a gross margin uplift of approximately $0.91bn, below the $2m threshold defined for this framework. As a result, the rule requires us to use stretch-up values consistently for all levers, so we selected 3.5% as a prudent upper-mid point rather than the absolute maximum of the range.",
          "4. SIMPLE MATHS EXPLANATION\nWe estimate an ExtraCare-attributable gross margin base of roughly $20.24bn, derived from an approximate $110bn of retail-relevant CVS revenue, multiplied by an 80% ExtraCare sales penetration factor and a 23% blended GM%. Applying a 3.5% uplift to this $20.24bn base yields an incremental gross margin impact of around $0.71bn associated with improved personalisation, better-timed offers, higher member engagement and reduced discount waste.",
          "5. RESULT\nThis produces an estimated gross margin uplift of approximately $0.708bn for the personalised loyalty lever, expressed purely on a gross-margin basis with no reference to revenue-only gains.",
          "6. REASSURANCE\nAll assumptions sit comfortably within evidence-based bounds seen in large, data-rich retail and pharmacy operators. The 3.5% uplift does not rely on extreme best-case performance; it reflects a realistic but ambitious improvement given CVS's scale, existing ExtraCare infrastructure and current mixed customer sentiment."
        ]
      },
      "priceOptimisation": {
        "leverName": "Price Optimisation",
        "upliftPercentApplied": 2.5,
        "gmBaseUsed": 20.24,
        "gmUpliftResult": 0.506,
        "sixStepBreakdown": [
          "1. UPLIFT POINT APPLIED\nWe have applied a 2.5% uplift to the same ExtraCare-attributable gross margin base, representing the upper-mid stretch of the credible range for pricing and markdown optimisation in large-scale health & beauty and pharmacy retail.",
          "2. RANGE & SOURCE\nThis 2.5% assumption lies within a 1% to 3% credible range for gross margin uplift from price optimisation, drawn from McKinsey's 'Pricing: The next frontier in retail' (2018) and PwC/Bain case studies, which consistently show 1–3% achievable gains through improved price architecture, promotion mix, and markdown discipline without materially harming volume.",
          "3. WHY THIS POINT WAS SELECTED\nAs with loyalty, the midpoint-based combined uplift fell below the $2m threshold, so the framework directs us to use stretch-up values across all levers. We choose 2.5% as a balanced upper-mid point that is ambitious yet avoids assuming the absolute maximum 3% outcome.",
          "4. SIMPLE MATHS EXPLANATION\nUsing the same estimated gross margin base of ~$20.24bn for ExtraCare-linked retail sales, we apply a 2.5% uplift to reflect a combination of better base price setting, more rigorous promotion design (e.g., mix of BOGO, percentage-off and loyalty-only offers) and tighter markdown controls on seasonal and slow-moving inventory. Multiplying 2.5% by the $20.24bn GM base results in an incremental GM uplift of roughly $0.506bn.",
          "5. RESULT\nThis equates to an estimated gross margin uplift of approximately $0.506bn attributable to price optimisation improvements on the ExtraCare-engaged retail portfolio.",
          "6. REASSURANCE\nThe 2.5% assumption is grounded in multi-year evidence from tier-one retailers and acknowledges CVS's extensive SKU range, regulatory constraints on prescription pricing and the need to protect traffic. It reflects disciplined but realistic pricing execution rather than aggressive re-pricing or across-the-board margin expansion."
        ]
      },
      "totalCumulative": {
        "leverName": "Total Cumulative Uplift (Personalised Loyalty + Price Optimisation)",
        "combinedGMUplift": 1.214,
        "sixStepBreakdown": [
          "1. UPLIFT POINT APPLIED\nThe total cumulative uplift is based on a 3.5% improvement in gross margin from personalised loyalty and a 2.5% improvement from price optimisation, both applied to the same ExtraCare-attributable GM base.",
          "2. RANGE & SOURCE\nIndividually, these levers sit within recognised category ranges: 1–4% for loyalty-driven personalisation and 1–3% for pricing optimisation, supported by McKinsey and Bain analyses across grocery, health & beauty and pharmacy categories. The combined impact remains realistic given their complementary nature (targeting, discount efficiency, price architecture).",
          "3. WHY THIS POINT WAS SELECTED\nBecause the midpoint-based calculation generated a total uplift below the $2m threshold, the framework stipulates use of stretch-up parameters rather than median ones. 3.5% and 2.5% were therefore chosen as upper-mid points that keep us well inside evidence-backed bounds while reflecting meaningful but achievable improvement.",
          "4. SIMPLE MATHS EXPLANATION\nWe start from a GM base of approximately $20.24bn tied to ExtraCare transactions. We apply 3.5% to estimate the loyalty-related uplift (~$0.708bn) and 2.5% to estimate the pricing-related uplift (~$0.506bn). Summing these individual uplifts yields a combined incremental gross margin opportunity of about $1.214bn.",
          "5. RESULT\nThe result is an estimated total gross margin uplift potential of roughly $1.21bn if CVS executes both improved personalisation and price optimisation effectively across the ExtraCare-influenced portfolio.",
          "6. REASSURANCE\nThis combined figure is not engineered to meet any target ROI or revenue outcome. It is a direct aggregation of two independently evidenced uplifts, each anchored in sector research and moderated by conservative assumptions about CVS's addressable base and current maturity. It deliberately avoids assuming perfect execution, full customer adoption or maximum theoretical upside."
        ]
      }
    },
    "sourcesAppendix": {
      "financialAndCompanyFilings": [
        "CVS Health Corporation, Form 10-K for the fiscal year ended December 31, 2023 – SEC EDGAR (filed Feb 2024).",
        "Walgreens Boots Alliance, Inc., Form 10-K FY 2023 – gross margin benchmarks for US drugstore / pharmacy retail."
      ],
      "loyaltyProgrammeAndBrand": [
        "CVS Health corporate site – ExtraCare and ExtraCare Pharmacy & Health Rewards programme descriptions (accessed 2024).",
        "CVS.com ExtraCare FAQs and promotional materials (accessed 2024).",
        "Loyalty360 / Bond Brand Loyalty case studies referencing 'over 74 million active ExtraCare members' (circa 2022–2023)."
      ],
      "benchmarksAndConsultingResearch": [
        "McKinsey & Company, 'Next in personalization 2021: The future of customer engagement'.",
        "McKinsey & Company, 'Personalizing the store experience' (grocery and pharmacy loyalty penetration benchmarks).",
        "McKinsey & Company, 'Pricing: The next frontier in retail' (2018).",
        "Bain & Company, 'How shoppers buy health and beauty' (2019).",
        "KPMG, 'The truth about customer loyalty' – grocery and pharmacy loyalty engagement rates.",
        "Statista, 'Average transaction value in US drug stores' (latest available, accessed 2024)."
      ],
      "techAndMedia": [
        "CVS Health careers / LinkedIn job postings for Digital, CRM, Data & Analytics, and Media roles (2023–2024) – evidence of custom platforms and enterprise martech.",
        "Public visibility of CVS paid media on Google Search and YouTube/CTV (observed 2023–2024)."
      ],
      "loyaltySentimentAndReviews": [
        "Google Play Store – CVS Pharmacy app reviews (selected reviews dated Mar 2024, Jan 2024, Feb 2024, Oct 2023).",
        "Apple App Store – CVS Pharmacy app reviews (selected reviews dated May 2024, Nov 2023).",
        "Google Maps – CVS store location reviews mentioning ExtraCare and coupons (selected reviews dated Jul 2024, Aug 2024)."
      ],
      "methodologyAndFramework": [
        "Internal Smart Scalable Outreach Framework – $2m threshold rule and lever structure for GM-only value cases.",
        "General practitioner experience in account-based marketing for large retail and healthcare brands (for inference and calibration of assumptions)."
      ]
    }
  }
};

// Use flexible type since the model returns varying structures
// biome-ignore lint/suspicious/noExplicitAny: Model returns dynamic structures
type FlexibleResponse = Record<string, any>;

// Helper to format confidence badge
function ConfidenceBadge({ level }: { level: string }) {
  const colours: Record<string, string> = {
    H: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    M: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    L: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  const labels: Record<string, string> = { H: "High", M: "Medium", L: "Low" };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colours[level] ?? colours.L}`}>
      {labels[level] ?? level}
    </span>
  );
}

// Helper to format sentiment badge
function SentimentBadge({ sentiment }: { sentiment: string }) {
  const colours: Record<string, string> = {
    positive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    mixed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colours[sentiment?.toLowerCase()] ?? colours.mixed}`}>
      {sentiment?.toUpperCase() ?? "N/A"}
    </span>
  );
}

// Expandable section component
function ExpandableSection({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="w-full flex items-center justify-between p-3 text-left font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsOpen(!isOpen);
          }
        }}
      >
        <span>{title}</span>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {isOpen && <div className="p-3 pt-0 border-t">{children}</div>}
    </div>
  );
}

// Render markdown table as HTML table
function MarkdownTable({ markdown }: { markdown: string }) {
  if (!markdown) return null;
  
  const lines = markdown.trim().split("\n").filter(line => line.trim());
  if (lines.length < 2) return <pre className="text-xs whitespace-pre-wrap">{markdown}</pre>;
  
  const parseRow = (line: string) => 
    line.split("|").map(cell => cell.trim()).filter(cell => cell && !cell.match(/^[-:]+$/));
  
  const headerLine = lines[0];
  const headerCells = parseRow(headerLine);
  
  // Find data rows (skip separator line)
  const dataLines = lines.slice(2);
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted">
            {headerCells.map((cell, idx) => (
              <th key={idx} className="text-left py-2 px-3 border font-semibold">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataLines.map((line, rowIdx) => {
            const cells = parseRow(line);
            return (
              <tr key={rowIdx} className="border-t">
                {cells.map((cell, cellIdx) => (
                  <td key={cellIdx} className="py-2 px-3 border align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Render any value intelligently
function RenderValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground italic">N/A</span>;
  
  if (typeof value === "string") {
    // Check if it's markdown table
    if (value.includes("|") && value.includes("---")) {
      return <MarkdownTable markdown={value} />;
    }
    // Check if it's a long text
    if (value.length > 200) {
      return <p className="whitespace-pre-wrap text-sm">{value}</p>;
    }
    return <span>{value}</span>;
  }
  
  if (typeof value === "number") return <span className="font-mono">{value}</span>;
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground italic">None</span>;
    
    // Array of strings
    if (typeof value[0] === "string") {
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((item, idx) => (
            <li key={idx} className="text-sm">{item}</li>
          ))}
        </ul>
      );
    }
    
    // Array of objects
    return (
      <div className="space-y-2">
        {value.map((item, idx) => (
          <div key={idx} className="p-2 bg-muted/30 rounded text-sm">
            <RenderValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }
  
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (depth > 2) {
      return <pre className="text-xs bg-muted p-2 rounded overflow-auto">{JSON.stringify(value, null, 2)}</pre>;
    }
    return (
      <div className="space-y-2">
        {entries.map(([key, val]) => (
          <div key={key} className="text-sm">
            <span className="font-medium text-muted-foreground">{formatKey(key)}:</span>{" "}
            <RenderValue value={val} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }
  
  return <span>{String(value)}</span>;
}

// Format camelCase/snake_case keys to readable labels
function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

// Get nested value safely
function getNestedValue(obj: FlexibleResponse, path: string): unknown {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

export function ABMPackGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FlexibleResponse | null>(null);

  const [formData, setFormData] = useState<FormState>({
    brand: "",
    website: "",
    registryUrl: "",
    category: "",
    brandType: "own_brand_only",
    notes: "",
    selectedModel: "chat-model",
    useMockResponse: false,
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value as FormState[keyof FormState],
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use mock response if checkbox is checked (saves LLM calls during development)
      if (formData.useMockResponse) {
        // Simulate network delay for realistic UX
        await new Promise(resolve => setTimeout(resolve, 500));
        setResult(MOCK_RESPONSE);
        toast({ type: "success", description: "Mock ABM pack loaded (CVS Health example)" });
        return;
      }

      const response = await fetch("/api/abm-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: formData.brand,
          website: formData.website || undefined,
          registryUrl: formData.registryUrl || undefined,
          category: formData.category || undefined,
          brandType: formData.brandType,
          notes: formData.notes || undefined,
          selectedModel: formData.selectedModel,
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        throw new Error(error.message || "Failed to generate ABM pack");
      }

      const data = (await response.json()) as { data: FlexibleResponse };
      setResult(data.data);
      toast({ type: "success", description: "ABM pack generated successfully!" });
    } catch (error) {
      toast({
        type: "error",
        description:
          error instanceof Error ? error.message : "Failed to generate ABM pack",
      });
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract brand name from various possible locations
  const getBrandName = () => {
    return result?.brandIntake?.brand || result?.brand || "Unknown Brand";
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>ABM Pack Generator</CardTitle>
          <CardDescription>
            Generate CFO-ready Account-Based Marketing packs for retail brands
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="brand">Brand Name *</Label>
              <Input
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="e.g., Nike, Adidas"
                required
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="registryUrl">SEC / Registry Link</Label>
              <Input
                id="registryUrl"
                name="registryUrl"
                type="url"
                value={formData.registryUrl}
                onChange={handleInputChange}
                placeholder="https://sec.report/..."
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g., Premium Activewear"
              />
            </div>

            <div>
              <Label htmlFor="brandType">Brand Type</Label>
              <Select
                value={formData.brandType}
                onValueChange={(value) => handleSelectChange("brandType", value)}
              >
                <SelectTrigger id="brandType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="own_brand_only">Own-brand Only</SelectItem>
                  <SelectItem value="multi_brand">Multi-brand</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="selectedModel">AI Model</Label>
              <Select
                value={formData.selectedModel}
                onValueChange={(value) =>
                  handleSelectChange("selectedModel", value)
                }
              >
                <SelectTrigger id="selectedModel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat-model">GPT-5.1</SelectItem>
                  <SelectItem value="chat-model-reasoning">
                    GPT-5.1 (Thinking)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional context or requirements..."
                rows={4}
              />
            </div>

            {/* Dev option: Use mock response to save LLM calls */}
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <input
                type="checkbox"
                id="useMockResponse"
                checked={formData.useMockResponse}
                onChange={(e) => setFormData(prev => ({ ...prev, useMockResponse: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="useMockResponse" className="text-sm font-normal cursor-pointer">
                Use mock response (CVS Health example) — saves LLM calls during development
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !formData.brand}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating (this may take 60-120 seconds)...
                </>
              ) : (
                "Generate ABM Pack"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Generated ABM Pack: {getBrandName()}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const json = JSON.stringify(result, null, 2);
                  const blob = new Blob([json], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `abm-pack-${getBrandName().replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download JSON
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Executive One-Liner */}
              {(result.outputs?.executiveOneLiner || result.executiveOneLiner) && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Executive One-Liner</h3>
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-lg font-medium">
                      {result.outputs?.executiveOneLiner || result.executiveOneLiner}
                    </p>
                  </div>
                </div>
              )}

              {/* CFO Readiness Panel */}
              {(result.outputs?.cfoReadinessPanel || result.cfoReadinessPanel) && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">CFO Readiness Panel</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <RenderValue value={result.outputs?.cfoReadinessPanel || result.cfoReadinessPanel} />
                  </div>
                </div>
              )}

              {/* Executive Summary */}
              {(result.outputs?.executiveSummary || result.executiveSummary) && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
                  <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                    {result.outputs?.executiveSummary || result.executiveSummary}
                  </div>
                </div>
              )}

              {/* Slide 1 - Input Table */}
              {(result.outputs?.slide1InputTable || result.slide1InputTable) && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Slide 1 - Input Metrics</h3>
                  <div className="space-y-3">
                    {/* Handle markdown table format */}
                    {(result.outputs?.slide1InputTable?.tableMarkdown || result.slide1InputTable?.tableMarkdown) && (
                      <MarkdownTable markdown={result.outputs?.slide1InputTable?.tableMarkdown || result.slide1InputTable?.tableMarkdown} />
                    )}
                    {/* Handle array format */}
                    {Array.isArray(result.outputs?.slide1InputTable) && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="text-left py-2 px-3 border">Metric</th>
                              <th className="text-left py-2 px-3 border">Value</th>
                              <th className="text-left py-2 px-3 border">Source</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.outputs.slide1InputTable.map((row: FlexibleResponse, idx: number) => (
                              <tr key={idx}>
                                <td className="py-2 px-3 border">{row.metric}</td>
                                <td className="py-2 px-3 border">{row.valueOrEstimate || row.value}</td>
                                <td className="py-2 px-3 border text-xs text-muted-foreground">{row.sourceOrLogic || row.source}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {/* Notes */}
                    {(result.outputs?.slide1InputTable?.notes || result.slide1InputTable?.notes) && (
                      <div className="p-3 bg-muted/50 rounded text-xs">
                        {result.outputs?.slide1InputTable?.notes || result.slide1InputTable?.notes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loyalty Sentiment - handles both naming conventions */}
              {(result.outputs?.loyaltySentimentSnapshot || 
                result.outputs?.slide2LoyaltySentimentSnapshot || 
                result.research?.loyaltySentiment) && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Loyalty Sentiment Snapshot</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-4">
                    {/* Get sentiment data from whichever location it exists */}
                    {(() => {
                      const sentiment = result.outputs?.loyaltySentimentSnapshot || 
                                       result.outputs?.slide2LoyaltySentimentSnapshot || 
                                       result.research?.loyaltySentiment;
                      return (
                        <>
                          {/* Overall rating */}
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Overall Sentiment:</span>
                              <SentimentBadge sentiment={sentiment?.overallSentimentRating || sentiment?.overallSentiment || "mixed"} />
                            </div>
                          </div>
                          
                          {/* Summary */}
                          {(sentiment?.summaryNarrative || sentiment?.summary || sentiment?.narrativeSummary) && (
                            <p className="text-sm">{sentiment.summaryNarrative || sentiment.summary || sentiment.narrativeSummary}</p>
                          )}
                          
                          {/* Markdown table */}
                          {sentiment?.sentimentTableMarkdown && (
                            <MarkdownTable markdown={sentiment.sentimentTableMarkdown} />
                          )}
                          
                          {/* Array sentiment table */}
                          {Array.isArray(sentiment?.sentimentTable) && sentiment.sentimentTable.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2 font-semibold">Aspect</th>
                                    <th className="text-left py-2 font-semibold">Summary</th>
                                    <th className="text-left py-2 font-semibold">Evidence</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sentiment.sentimentTable.map((row: FlexibleResponse, idx: number) => (
                                    <tr key={idx} className="border-b align-top">
                                      <td className="py-3 font-medium">{row.aspectDisplay || row.aspectDisplayName || row.aspect}</td>
                                      <td className="py-3">{row.sentimentSummary}</td>
                                      <td className="py-3">
                                        {Array.isArray(row.evidence) ? (
                                          <div className="space-y-2">
                                            {row.evidence.map((ev: string | FlexibleResponse, evIdx: number) => (
                                              <div key={evIdx} className="text-xs bg-background p-2 rounded italic">
                                                {typeof ev === "string" ? ev : ev.quote || JSON.stringify(ev)}
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-xs">{row.evidence}</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Value Case Table */}
              {(result.outputs?.slide4ValueCaseTable || result.valueCase) && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Value Case (GM-Based)</h3>
                  <div className="space-y-4">
                    {/* Markdown table */}
                    {(result.outputs?.slide4ValueCaseTable?.tableMarkdown) && (
                      <MarkdownTable markdown={result.outputs.slide4ValueCaseTable.tableMarkdown} />
                    )}
                    
                    {/* Array of rows */}
                    {Array.isArray(result.outputs?.slide4ValueCaseTable?.rows) && result.outputs.slide4ValueCaseTable.rows.length > 0 && (
                      result.outputs.slide4ValueCaseTable.rows.map((row: FlexibleResponse, idx: number) => (
                        <div key={idx} className="border rounded-lg overflow-hidden">
                          <div className="p-4 flex justify-between items-start bg-muted/30">
                            <div>
                              <p className="font-semibold">{row.areaOfImpact}</p>
                              <p className="text-sm text-muted-foreground">{row.opportunityType}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                ${typeof row.estimatedUpliftGM === "number" ? row.estimatedUpliftGM.toFixed(2) : row.estimatedUpliftGM}m
                              </p>
                              <p className="text-xs text-muted-foreground">GM Uplift</p>
                            </div>
                          </div>
                          {row.assumptionsMethodology && (
                            <ExpandableSection title="View Methodology">
                              <div className="text-sm whitespace-pre-wrap">{row.assumptionsMethodology}</div>
                            </ExpandableSection>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Modelling Section */}
              {result.modelling && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Modelling Details</h3>
                  <ExpandableSection title="View Full Modelling Breakdown" defaultOpen>
                    <div className="space-y-4">
                      {result.modelling.scopeAndBaseAssumptions && (
                        <div>
                          <h4 className="font-medium mb-2">Scope & Base Assumptions</h4>
                          <div className="bg-muted/30 p-3 rounded text-sm">
                            <RenderValue value={result.modelling.scopeAndBaseAssumptions} />
                          </div>
                        </div>
                      )}
                      
                      {result.modelling.upliftRanges && (
                        <div>
                          <h4 className="font-medium mb-2">Uplift Ranges (Evidence-Based)</h4>
                          <div className="bg-muted/30 p-3 rounded text-sm">
                            <RenderValue value={result.modelling.upliftRanges} />
                          </div>
                        </div>
                      )}
                      
                      {result.modelling.finalModeApplied && (
                        <div>
                          <h4 className="font-medium mb-2">Mode Applied</h4>
                          <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded">
                            <p className="font-semibold">{result.modelling.finalModeApplied.valueCaseMode}</p>
                            <p className="text-sm text-muted-foreground">{result.modelling.finalModeApplied.reason}</p>
                          </div>
                        </div>
                      )}
                      
                      {result.modelling.finalUpliftUsingStretchUp && (
                        <div>
                          <h4 className="font-medium mb-2">Final Uplift Calculations</h4>
                          <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                            <RenderValue value={result.modelling.finalUpliftUsingStretchUp} />
                          </div>
                        </div>
                      )}
                    </div>
                  </ExpandableSection>
                </div>
              )}

              {/* Research Section */}
              {result.research && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Research Details</h3>
                  
                  {/* Financials */}
                  {result.research.financials && (
                    <ExpandableSection title="Financial Data">
                      <div className="space-y-2 text-sm">
                        <RenderValue value={result.research.financials} />
                      </div>
                    </ExpandableSection>
                  )}
                  
                  {/* Loyalty Programme */}
                  {result.research.loyaltyProgramme && (
                    <ExpandableSection title="Loyalty Programme Details">
                      <div className="space-y-2 text-sm">
                        <RenderValue value={result.research.loyaltyProgramme} />
                      </div>
                    </ExpandableSection>
                  )}
                  
                  {/* Benchmarks */}
                  {result.research.benchmarks && (
                    <ExpandableSection title="Category Benchmarks">
                      <div className="space-y-2 text-sm">
                        <RenderValue value={result.research.benchmarks} />
                      </div>
                    </ExpandableSection>
                  )}
                  
                  {/* Tech & Media */}
                  {result.research.paidMediaAndTech && (
                    <ExpandableSection title="Paid Media & Tech Stack">
                      <div className="space-y-2 text-sm">
                        <RenderValue value={result.research.paidMediaAndTech} />
                      </div>
                    </ExpandableSection>
                  )}
                  
                  {/* Data Confidence */}
                  {result.research.dataConfidenceSummary && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Data Confidence Summary</h4>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(result.research.dataConfidenceSummary).map(([key, level]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-sm capitalize">{key}:</span>
                            <ConfidenceBadge level={level as string} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Appendices */}
              {result.appendices && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Appendices</h3>
                  
                  {/* Assumptions Block */}
                  {result.appendices.assumptionsBlock && (
                    <ExpandableSection title="A) Detailed Assumptions">
                      <div className="space-y-4">
                        {/* Handle object structure with named levers */}
                        {typeof result.appendices.assumptionsBlock === "object" && !Array.isArray(result.appendices.assumptionsBlock) && (
                          Object.entries(result.appendices.assumptionsBlock).map(([key, lever]) => (
                            <div key={key} className="border rounded p-3">
                              <h5 className="font-medium mb-2">{(lever as FlexibleResponse).leverName || formatKey(key)}</h5>
                              {Array.isArray((lever as FlexibleResponse).sixStepBreakdown) && (
                                <div className="space-y-2 text-sm">
                                  {((lever as FlexibleResponse).sixStepBreakdown as string[]).map((step: string, idx: number) => (
                                    <div key={idx} className="p-2 bg-muted/30 rounded whitespace-pre-wrap">
                                      {step}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {!(lever as FlexibleResponse).sixStepBreakdown && (
                                <RenderValue value={lever} />
                              )}
                            </div>
                          ))
                        )}
                        
                        {/* Handle array structure */}
                        {Array.isArray(result.appendices.assumptionsBlock) && (
                          result.appendices.assumptionsBlock.map((item: FlexibleResponse, idx: number) => (
                            <div key={idx} className="border rounded p-3">
                              <h5 className="font-medium mb-2">{item.leverName || `Lever ${idx + 1}`}</h5>
                              <RenderValue value={item} />
                            </div>
                          ))
                        )}
                      </div>
                    </ExpandableSection>
                  )}
                  
                  {/* Sources */}
                  {(result.appendices.sourcesAppendix || result.appendices.sources) && (
                    <ExpandableSection title="B) Sources">
                      <div className="space-y-3 text-sm">
                        {result.appendices.sourcesAppendix && typeof result.appendices.sourcesAppendix === "object" && (
                          Object.entries(result.appendices.sourcesAppendix).map(([category, sources]) => (
                            <div key={category}>
                              <h5 className="font-medium mb-1">{formatKey(category)}</h5>
                              {Array.isArray(sources) ? (
                                <ul className="list-disc list-inside text-muted-foreground">
                                  {(sources as string[]).map((source: string, idx: number) => (
                                    <li key={idx}>{source}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-muted-foreground">{String(sources)}</p>
                              )}
                            </div>
                          ))
                        )}
                        
                        {Array.isArray(result.appendices.sources) && (
                          <ul className="list-disc list-inside text-muted-foreground">
                            {result.appendices.sources.map((source: string, idx: number) => (
                              <li key={idx}>{source}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </ExpandableSection>
                  )}
                </div>
              )}

              {/* Brand Intake */}
              {result.brandIntake && (
                <ExpandableSection title="Brand Intake Details">
                  <div className="space-y-2 text-sm">
                    <RenderValue value={result.brandIntake} />
                  </div>
                </ExpandableSection>
              )}

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
