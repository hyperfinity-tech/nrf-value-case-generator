"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ABMPackGenerator } from "@/components/abm-pack-generator";

type BrandingState = {
  toolName: string;
  homepageTagline: string;
  homepageSubtext: string;
};

const STORAGE_KEY = "brandingOverride";

export function AbmPageClient({
  defaults,
}: {
  defaults: BrandingState;
}) {
  const [branding, setBranding] = useState<BrandingState>(defaults);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load overrides from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<BrandingState>;
        setBranding((prev) => ({
          toolName: parsed.toolName ?? prev.toolName,
          homepageTagline: parsed.homepageTagline ?? prev.homepageTagline,
          homepageSubtext: parsed.homepageSubtext ?? prev.homepageSubtext,
        }));
      }
    } catch (error) {
      console.warn("Failed to read branding overrides", error);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
    setIsSettingsOpen(false);
  };

  const handleReset = () => {
    setBranding(defaults);
    localStorage.removeItem(STORAGE_KEY);
    setIsSettingsOpen(false);
  };

  return (
    <div className="relative">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <ABMPackGenerator
              brandingOverride={{
                toolName: branding.toolName,
                homepageTagline: branding.homepageTagline,
                homepageSubtext: branding.homepageSubtext,
              }}
            />
          </div>
        </div>
      </div>

      {/* Settings launcher */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-muted-foreground/40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsSettingsOpen((prev) => !prev)}
        >
          <Settings className="h-6 w-6" />
        </Button>

        {isSettingsOpen && (
          <Card className="w-[320px] shadow-lg border border-muted">
            <CardHeader>
              <CardTitle className="text-base">Branding Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="toolName">Tool name</Label>
                <Input
                  id="toolName"
                  value={branding.toolName}
                  onChange={(e) =>
                    setBranding((prev) => ({ ...prev, toolName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="homepageTagline">Homepage tagline</Label>
                <Input
                  id="homepageTagline"
                  value={branding.homepageTagline}
                  onChange={(e) =>
                    setBranding((prev) => ({ ...prev, homepageTagline: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="homepageSubtext">Homepage subtext</Label>
                <Input
                  id="homepageSubtext"
                  value={branding.homepageSubtext}
                  onChange={(e) =>
                    setBranding((prev) => ({ ...prev, homepageSubtext: e.target.value }))
                  }
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Reset
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(false)}>
                  Close
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

