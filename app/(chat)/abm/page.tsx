import { redirect } from "next/navigation";
import { ABMPackGenerator } from "@/components/abm-pack-generator";
import { auth } from "@/app/(auth)/auth";
import { branding } from "@/lib/branding";

export default async function ABMPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {branding.toolName}
          </h1>
          <p className="text-lg text-slate-700 dark:text-slate-300">
            {branding.homepageTagline}
          </p>
          <p className="text-base text-slate-600 dark:text-slate-400">
            {branding.homepageSubtext}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <ABMPackGenerator />
        </div>
      </div>
    </div>
  );
}

