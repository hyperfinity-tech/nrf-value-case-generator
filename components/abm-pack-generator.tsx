"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
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
import type { AbmPackOutput } from "@/app/(chat)/api/abm-pack/schema";

interface FormState {
  brand: string;
  website: string;
  registryUrl: string;
  category: string;
  brandType: "own_brand_only" | "multi_brand" | "mixed";
  notes: string;
  selectedModel: "chat-model" | "chat-model-reasoning";
}

export function ABMPackGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AbmPackOutput | null>(null);

  const [formData, setFormData] = useState<FormState>({
    brand: "",
    website: "",
    registryUrl: "",
    category: "",
    brandType: "own_brand_only",
    notes: "",
    selectedModel: "chat-model",
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

      const data = (await response.json()) as { data: AbmPackOutput };
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

  return (
    <div className="space-y-6">
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

            <Button
              type="submit"
              disabled={isLoading || !formData.brand}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate ABM Pack"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated ABM Pack</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Brand Intake</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <p>
                    <strong>Brand:</strong> {result.brandIntake.brand}
                  </p>
                  <p>
                    <strong>Category:</strong> {result.brandIntake.category}
                  </p>
                  <p>
                    <strong>Type:</strong> {result.brandIntake.brandType}
                  </p>
                  {result.brandIntake.website && (
                    <p>
                      <strong>Website:</strong>{" "}
                      <a
                        href={result.brandIntake.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        {result.brandIntake.website}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Executive Summary
                </h3>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="italic">
                    {result.outputs.executiveOneLiner}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Detailed Summary</h3>
                <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                  {result.outputs.executiveSummary}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Value Case Summary
                </h3>
                <div className="space-y-3">
                  {result.outputs.slide4ValueCaseTable.rows.map((row, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <p className="font-semibold text-sm">
                        {row.areaOfImpact}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {row.opportunityType}
                      </p>
                      <p className="text-lg font-bold text-green-600 mt-2">
                        ${row.estimatedUpliftGM}M GM Uplift
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {row.assumptionsMethodology}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Loyalty Sentiment
                </h3>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <p>
                    <strong>Overall:</strong>{" "}
                    <span
                      className={`font-semibold ${
                        result.outputs.loyaltySentimentSnapshot
                          .overallSentimentRating === "positive"
                          ? "text-green-600"
                          : result.outputs.loyaltySentimentSnapshot
                              .overallSentimentRating === "negative"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {result.outputs.loyaltySentimentSnapshot.overallSentimentRating.toUpperCase()}
                    </span>
                  </p>
                  <p className="text-sm">
                    {
                      result.outputs.loyaltySentimentSnapshot
                        .summaryNarrative
                    }
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Modelling Results
                </h3>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <p>
                    <strong>Base Case GM Uplift:</strong> $
                    {result.modelling.baseCaseGMUpliftMillions}M
                  </p>
                  <p>
                    <strong>Mode Applied:</strong>{" "}
                    {result.modelling.modeApplied.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {result.modelling.modeRationale}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Data Confidence
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p className="font-semibold">Revenue</p>
                    <p className="text-lg font-bold">
                      {
                        result.outputs.cfoReadinessPanel.dataConfidence
                          .revenue
                      }
                    </p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p className="font-semibold">Loyalty</p>
                    <p className="text-lg font-bold">
                      {
                        result.outputs.cfoReadinessPanel.dataConfidence
                          .loyalty
                      }
                    </p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p className="font-semibold">AOV</p>
                    <p className="text-lg font-bold">
                      {result.outputs.cfoReadinessPanel.dataConfidence.aov}
                    </p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p className="font-semibold">Frequency</p>
                    <p className="text-lg font-bold">
                      {
                        result.outputs.cfoReadinessPanel.dataConfidence
                          .frequency
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

