import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { branding } from "@/lib/branding";
import { AbmPageClient } from "@/components/abm-page-client";

export default async function ABMPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

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

