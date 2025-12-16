const DEFAULT_BRAND_NAME = "HyperFinity";
const DEFAULT_TOOL_NAME = "HyperFinity Value Case Generator";
const DEFAULT_HOMEPAGE_TAGLINE =
  "Our proprietary tool that calculates the gross margin uplift we can generate through smart loyalty and pricing moves, using our customer intelligence platform and our team of consultants.";
const DEFAULT_HOMEPAGE_SUBTEXT =
  "Purpose-built to create CFO-ready value cases that stay grounded in evidence, benchmarks, and blended gross margin outcomes.";

export const branding = {
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME ?? DEFAULT_BRAND_NAME,
  toolName: process.env.NEXT_PUBLIC_TOOL_NAME ?? DEFAULT_TOOL_NAME,
  homepageTagline:
    process.env.NEXT_PUBLIC_HOMEPAGE_TAGLINE ?? DEFAULT_HOMEPAGE_TAGLINE,
  homepageSubtext:
    process.env.NEXT_PUBLIC_HOMEPAGE_SUBTEXT ?? DEFAULT_HOMEPAGE_SUBTEXT,
} as const;





