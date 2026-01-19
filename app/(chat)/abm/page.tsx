import { branding } from "@/lib/branding";
import { AbmPageClient } from "@/components/abm-page-client";

export default async function ABMPage() {
  // Auth is handled by middleware
  return (
    <AbmPageClient
      defaults={{
        toolName: branding.toolName,
        homepageTagline: branding.homepageTagline,
        homepageSubtext: branding.homepageSubtext,
      }}
    />
  );
}

