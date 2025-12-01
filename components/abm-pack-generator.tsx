"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
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

// Helper to format confidence badge
function ConfidenceBadge({ level }: { level: string }) {
  const colours = {
    H: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    M: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    L: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  const labels = { H: "High", M: "Medium", L: "Low" };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colours[level as keyof typeof colours] ?? colours.L}`}>
      {labels[level as keyof typeof labels] ?? level}
    </span>
  );
}

// Helper to format sentiment badge
function SentimentBadge({ sentiment }: { sentiment: string }) {
  const colours = {
    positive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    mixed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colours[sentiment as keyof typeof colours] ?? colours.mixed}`}>
      {sentiment?.toUpperCase() ?? "N/A"}
    </span>
  );
}

// Helper to format mode badge
function ModeBadge({ mode }: { mode: string }) {
  const isMedian = mode === "median";
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
      isMedian 
        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
        : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    }`}>
      {isMedian ? "Median" : "Stretch-Up"}
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
            <CardHeader>
              <CardTitle>Generated ABM Pack: {result.brandIntake.brand}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Executive One-Liner */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Executive One-Liner</h3>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="text-lg font-medium">
                    {result.outputs.executiveOneLiner}
                  </p>
                </div>
              </div>

              {/* CFO Readiness Panel */}
              {result.outputs.cfoReadinessPanel && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">CFO Readiness Panel</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Blended GM%</p>
                        <p className="text-lg font-bold">{result.outputs.cfoReadinessPanel.blendedGMPercentUsed}%</p>
                        <p className="text-xs text-muted-foreground">{result.outputs.cfoReadinessPanel.blendedGMSourceOrProxy}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Brand Type</p>
                        <p className="text-lg font-bold">{result.outputs.cfoReadinessPanel.brandType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Value Case Mode</p>
                        <div className="mt-1">
                          <ModeBadge mode={result.outputs.cfoReadinessPanel.valueCaseMode} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Mode Rationale</p>
                        <p className="text-xs">{result.outputs.cfoReadinessPanel.valueCaseModeRationale}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Data Confidence</p>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Revenue:</span>
                          <ConfidenceBadge level={result.outputs.cfoReadinessPanel.dataConfidence.revenue} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Loyalty:</span>
                          <ConfidenceBadge level={result.outputs.cfoReadinessPanel.dataConfidence.loyalty} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">AOV:</span>
                          <ConfidenceBadge level={result.outputs.cfoReadinessPanel.dataConfidence.aov} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Frequency:</span>
                          <ConfidenceBadge level={result.outputs.cfoReadinessPanel.dataConfidence.frequency} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Executive Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
                <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                  {result.outputs.executiveSummary}
                </div>
              </div>

              {/* Slide 1 - Input Table */}
              {result.outputs.slide1InputTable && result.outputs.slide1InputTable.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Slide 1 - Input Metrics</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded-lg overflow-hidden">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left py-2 px-3 font-semibold">Metric</th>
                          <th className="text-left py-2 px-3 font-semibold">Value / Estimate</th>
                          <th className="text-left py-2 px-3 font-semibold">Source / Logic</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.outputs.slide1InputTable.map((row, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="py-2 px-3 font-medium">{row.metric}</td>
                            <td className="py-2 px-3">{row.valueOrEstimate}</td>
                            <td className="py-2 px-3 text-muted-foreground text-xs">{row.sourceOrLogic}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {result.outputs.slide1Notes && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                      <p><strong>Key Proxies:</strong> {result.outputs.slide1Notes.keyProxies}</p>
                      <p><strong>Data Gaps:</strong> {result.outputs.slide1Notes.dataGapsAndInference}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Slide 2 - Loyalty Sentiment Snapshot */}
              {result.outputs.loyaltySentimentSnapshot && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Slide 2 - Loyalty Sentiment Snapshot (Last 12 Months)</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-4">
                    {/* Overall rating and feedback source */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Overall Sentiment:</span>
                        <SentimentBadge sentiment={result.outputs.loyaltySentimentSnapshot.overallSentimentRating} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Feedback dominated by: {result.outputs.loyaltySentimentSnapshot.feedbackDominatedBy?.replace(/_/g, " ") ?? "N/A"}
                      </div>
                    </div>
                    
                    {/* Summary narrative */}
                    <p className="text-sm">{result.outputs.loyaltySentimentSnapshot.summaryNarrative}</p>
                    
                    {/* Sentiment table */}
                    {result.outputs.loyaltySentimentSnapshot.sentimentTable && result.outputs.loyaltySentimentSnapshot.sentimentTable.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-semibold w-1/5">Aspect</th>
                              <th className="text-left py-2 font-semibold w-2/5">Sentiment</th>
                              <th className="text-left py-2 font-semibold w-2/5">Evidence (Quotes & Sources)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.outputs.loyaltySentimentSnapshot.sentimentTable.map((row, idx) => (
                              <tr key={idx} className="border-b last:border-b-0 align-top">
                                <td className="py-3 font-medium">
                                  {row.aspectDisplayName ?? row.aspect?.replace(/_/g, " ")}
                                </td>
                                <td className="py-3">{row.sentimentSummary}</td>
                                <td className="py-3">
                                  <div className="space-y-2">
                                    {row.evidence?.map((ev, evIdx) => (
                                      <div key={evIdx} className="text-xs bg-background p-2 rounded">
                                        <span className="italic">&ldquo;{ev.quote}&rdquo;</span>
                                        <span className="text-muted-foreground ml-1 block mt-1">
                                          — [{ev.source}, {ev.monthYear}]
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Slide 4 - Value Case Table */}
              {result.outputs.slide4ValueCaseTable?.rows && result.outputs.slide4ValueCaseTable.rows.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Slide 4 - Value Case (GM-Based)</h3>
                  <div className="space-y-4">
                    {result.outputs.slide4ValueCaseTable.rows.map((row, idx) => (
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
                        
                        {/* Expandable methodology */}
                        <ExpandableSection title="View 6-Step CFO-Ready Methodology">
                          <div className="text-sm whitespace-pre-wrap bg-muted/20 p-3 rounded">
                            {row.assumptionsMethodology}
                          </div>
                        </ExpandableSection>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modelling Summary */}
              {result.modelling && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Modelling Summary</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Base Case GM Uplift</p>
                        <p className="text-2xl font-bold">${result.modelling.baseCaseGMUpliftMillions}m</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Mode Applied</p>
                        <div className="mt-1">
                          <ModeBadge mode={result.modelling.modeApplied} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rationale</p>
                        <p className="text-sm">{result.modelling.modeRationale}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Research Sources */}
              {result.research?.researchSources && result.research.researchSources.length > 0 && (
                <ExpandableSection title="Research Sources & Citations">
                  <div className="space-y-2">
                    {result.research.researchSources.map((source, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm p-2 bg-muted/30 rounded">
                        <ConfidenceBadge level={source.confidenceLevel} />
                        <div className="flex-1">
                          <span className="font-medium">{source.dataPoint}:</span>{" "}
                          <span className="text-muted-foreground">{source.sourceName}</span>
                          {source.isProxy && source.proxyRationale && (
                            <span className="text-orange-600 dark:text-orange-400 text-xs block mt-1">
                              (Proxy: {source.proxyRationale})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ExpandableSection>
              )}

              {/* Appendices */}
              {result.appendices && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Appendices</h3>
                  
                  {/* A) Assumptions Block */}
                  {result.appendices.assumptionsBlock && result.appendices.assumptionsBlock.length > 0 && (
                    <ExpandableSection title="A) Assumptions Block - Detailed Lever Breakdown">
                      <div className="space-y-4">
                        {result.appendices.assumptionsBlock.map((item, idx) => (
                          <div key={idx} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-semibold">{item.leverId}. {item.leverName}</span>
                              <ModeBadge mode={item.upliftMode} />
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Uplift Applied:</span>{" "}
                                <span className="font-medium">{item.upliftPercentageApplied}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Credible Range:</span>{" "}
                                <span className="font-medium">
                                  {item.credibleRange.minPercent}% - {item.credibleRange.maxPercent}%
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Range Source:</span>{" "}
                                <span className="text-xs">{item.credibleRange.source}</span>
                              </div>
                            </div>
                            {item.upliftPointDescription && (
                              <div className="mt-3 text-xs space-y-1 bg-muted/30 p-2 rounded">
                                <p><strong>1. Uplift Point:</strong> {item.upliftPointDescription}</p>
                                {item.selectionRationale && <p><strong>3. Selection:</strong> {item.selectionRationale}</p>}
                                {item.mathsExplanation && <p><strong>4. Maths:</strong> {item.mathsExplanation}</p>}
                                {item.resultStatement && <p><strong>5. Result:</strong> {item.resultStatement}</p>}
                                {item.reassuranceStatement && <p><strong>6. Reassurance:</strong> {item.reassuranceStatement}</p>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ExpandableSection>
                  )}
                  
                  {/* B) Sources */}
                  {result.appendices.sources && result.appendices.sources.length > 0 && (
                    <ExpandableSection title="B) Sources Appendix">
                      <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                        {result.appendices.sources.map((source, idx) => (
                          <li key={idx}>{source}</li>
                        ))}
                      </ul>
                    </ExpandableSection>
                  )}
                </div>
              )}

              {/* Brand Intake (collapsed by default) */}
              <ExpandableSection title="Brand Intake Details">
                <div className="space-y-2 text-sm">
                  <p><strong>Brand:</strong> {result.brandIntake.brand}</p>
                  <p><strong>Category:</strong> {result.brandIntake.category}</p>
                  <p><strong>Type:</strong> {result.brandIntake.brandType?.replace(/_/g, " ")}</p>
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
                  {result.brandIntake.registryLink && (
                    <p>
                      <strong>SEC/Registry:</strong>{" "}
                      <a
                        href={result.brandIntake.registryLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        {result.brandIntake.registryLink}
                      </a>
                    </p>
                  )}
                  {result.brandIntake.contextualNotes && (
                    <p><strong>Notes:</strong> {result.brandIntake.contextualNotes}</p>
                  )}
                </div>
              </ExpandableSection>

              {/* Research Details (collapsed by default) */}
              <ExpandableSection title="Research Details">
                <div className="space-y-2 text-sm">
                  <p><strong>Annual Revenue:</strong> {result.research.latestAnnualRevenue} ({result.research.latestAnnualRevenueSource})</p>
                  <p><strong>Blended GM%:</strong> {result.research.blendedGrossMarginPercent}% ({result.research.blendedGrossMarginSource})</p>
                  <p><strong>Loyalty Programme:</strong> {result.research.loyaltyProgrammeDetails}</p>
                  {result.research.loyaltyProgrammePenetration && (
                    <p><strong>Loyalty Penetration:</strong> {result.research.loyaltyProgrammePenetration}</p>
                  )}
                  {result.research.loyaltyProgrammeLaunchDate && (
                    <p><strong>Loyalty Launch Date:</strong> {result.research.loyaltyProgrammeLaunchDate}</p>
                  )}
                  {result.research.loyaltyProgrammeBenefits && (
                    <p><strong>Loyalty Benefits:</strong> {result.research.loyaltyProgrammeBenefits}</p>
                  )}
                  {result.research.activeLoyaltyMembers && (
                    <p><strong>Active Loyalty Members:</strong> {result.research.activeLoyaltyMembers}</p>
                  )}
                  <p><strong>AOV Benchmark:</strong> {result.research.aovBenchmark}</p>
                  <p><strong>Purchase Frequency:</strong> {result.research.purchaseFrequencyBenchmark}</p>
                  <p><strong>Paid Media:</strong> {result.research.paidMediaChannels}</p>
                  <p><strong>Tech Stack:</strong> {result.research.techStack}</p>
                  <p><strong>Brand Initiatives:</strong> {result.research.brandSpecificInitiatives}</p>
                  {result.research.inferenceNotes && (
                    <p><strong>Inference Notes:</strong> {result.research.inferenceNotes}</p>
                  )}
                </div>
              </ExpandableSection>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
