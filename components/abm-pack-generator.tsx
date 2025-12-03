"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { ChevronDown, ChevronRight, Download, Loader2, ArrowRight } from "lucide-react";
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
import { ADIDAS_MOCK_RESPONSE } from "@/lib/mock-data/adidas-abm-pack";

interface FormState {
  brand: string;
  region: "US" | "UK";
  useMockResponse: boolean;
  generateInfographic: boolean;
}

// Mock response imported from separate file for cleaner code
const MOCK_RESPONSE: FlexibleResponse = ADIDAS_MOCK_RESPONSE as FlexibleResponse;

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
  
  // Split into lines, but recombine lines that don't start with | (they're continuations of previous cells)
  const rawLines = markdown.trim().split("\n");
  const tableLines: string[] = [];
  
  for (const line of rawLines) {
    const trimmed = line.trim();
    // A new table row starts with | or is a separator line (|---|---|)
    if (trimmed.startsWith("|") || trimmed.match(/^\|?[-:|\s]+\|?$/)) {
      tableLines.push(trimmed);
    } else if (tableLines.length > 0 && trimmed) {
      // This is a continuation of the previous cell - append to last line
      tableLines[tableLines.length - 1] += " " + trimmed;
    }
  }
  
  if (tableLines.length < 2) return <pre className="text-xs whitespace-pre-wrap">{markdown}</pre>;
  
  const parseRow = (line: string) => 
    line.split("|").map(cell => cell.trim()).filter(cell => cell && !cell.match(/^[-:]+$/));
  
  const headerLine = tableLines[0];
  const headerCells = parseRow(headerLine);
  
  // Find data rows (skip separator line which is at index 1)
  const dataLines = tableLines.filter((line, idx) => idx > 1 && !line.match(/^\|?[-:|\s]+\|?$/));
  
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
                  <td key={cellIdx} className="py-2 px-3 border align-top whitespace-pre-wrap">
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
  const [loadingMessage, setLoadingMessage] = useState("Generating ABM pack...");
  const [result, setResult] = useState<FlexibleResponse | null>(null);
  const [infographicImage, setInfographicImage] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const [formData, setFormData] = useState<FormState>({
    brand: "",
    region: "US",
    useMockResponse: false,
    generateInfographic: false,
  });

  // Scroll to top when results are displayed
  useEffect(() => {
    if (result) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [result]);

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
    setLoadingMessage("Generating ABM pack...");
    setInfographicImage(null);

    try {
      // Use mock response if checkbox is checked (saves LLM calls during development)
      if (formData.useMockResponse) {
        // Simulate network delay for realistic UX
        await new Promise(resolve => setTimeout(resolve, 500));
        setResult(MOCK_RESPONSE);
        
        // Use static debug image for infographic in mock mode
        if (formData.generateInfographic) {
          setInfographicImage("/images/debug/gemini_image_0006_final.png");
        }
        
        toast({ type: "success", description: "Mock ABM pack loaded (Adidas example)" });
        return;
      }

      // Stage 1: Generate JSON pack
      const response = await fetch("/api/abm-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: formData.brand,
          region: formData.region,
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        throw new Error(error.message || "Failed to generate ABM pack");
      }

      const data = (await response.json()) as { data: FlexibleResponse };
      
      // Stage 2: Generate infographic if requested
      let imageData: string | null = null;
      if (formData.generateInfographic) {
        setLoadingMessage("Generating strategic infographic...");
        try {
          const imageResponse = await fetch("/api/abm-pack-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ packData: data.data }),
          });
          
          if (imageResponse.ok) {
            const imgResult = (await imageResponse.json()) as { 
              ok: boolean; 
              imageBase64?: string;
            };
            if (imgResult.ok && imgResult.imageBase64) {
              imageData = imgResult.imageBase64;
            }
          }
          // If image generation fails, silently continue without image
        } catch (imgError) {
          // Silently ignore image generation errors - show pack results anyway
          console.error("Image generation failed:", imgError);
        }
      }
      
      // Show results together
      setResult(data.data);
      setInfographicImage(imageData);
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

  // Reset form and results
  const handleStartOver = () => {
    setResult(null);
    setInfographicImage(null);
    setShowReport(false);
    setIsLoading(false);
    setFormData({
      brand: "",
      region: "US",
      useMockResponse: false,
      generateInfographic: false,
    });
  };

  // Download infographic image
  const downloadInfographic = () => {
    if (!infographicImage) return;
    
    const link = document.createElement("a");
    link.href = infographicImage;
    link.download = `infographic-${getBrandName().replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Infographic Showcase - Full-screen prominent display with blurred background */}
      {result && infographicImage && !showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred background with the infographic */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${infographicImage})`,
              filter: "blur(30px) brightness(0.3)",
              transform: "scale(1.1)",
            }}
          />
          
          {/* Dark overlay for better contrast */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Content container */}
          <div className="relative z-10 flex flex-col items-center gap-8 p-8 max-w-6xl w-full">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">
                {getBrandName()} Strategic Value Case
              </h1>
              <p className="text-white/70 text-lg">
                FY2025 Gross Margin Opportunity Analysis
              </p>
            </div>
            
            {/* Main infographic display */}
            <div className="relative w-full max-w-5xl">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
                <img
                  src={infographicImage}
                  alt={`${getBrandName()} Strategic Value Case Infographic`}
                  className="w-full h-full object-contain bg-white"
                />
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Button
                size="lg"
                onClick={() => setShowReport(true)}
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg transition-all hover:scale-105"
              >
                Advance to Report
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={downloadInfographic}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleStartOver}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  Start Over
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results - shown when showReport is true OR when there's no infographic */}
      {result && (showReport || !infographicImage) && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Generated ABM Pack: {getBrandName()}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartOver}
                >
                  Start Over
                </Button>
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
              </div>
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
                    {/* Notes - handle string, array, and object formats */}
                    {(result.outputs?.slide1InputTable?.notes || result.slide1InputTable?.notes || result.outputs?.slide1Notes) && (
                      <div className="p-3 bg-muted/50 rounded text-xs space-y-1">
                        {/* String format */}
                        {typeof (result.outputs?.slide1InputTable?.notes || result.slide1InputTable?.notes) === 'string' && (
                          <p>{result.outputs?.slide1InputTable?.notes || result.slide1InputTable?.notes}</p>
                        )}
                        {/* Array format */}
                        {Array.isArray(result.outputs?.slide1InputTable?.notes || result.slide1InputTable?.notes) && (
                          (result.outputs?.slide1InputTable?.notes || result.slide1InputTable?.notes).map((note: string, idx: number) => (
                            <p key={idx}>{note}</p>
                          ))
                        )}
                        {/* Object format (schema with keyProxies/dataGapsAndInference) */}
                        {result.outputs?.slide1Notes && typeof result.outputs.slide1Notes === 'object' && !Array.isArray(result.outputs.slide1Notes) && (
                          <>
                            {result.outputs.slide1Notes.keyProxies && (
                              <p><strong>Key Proxies:</strong> {result.outputs.slide1Notes.keyProxies}</p>
                            )}
                            {result.outputs.slide1Notes.dataGapsAndInference && (
                              <p><strong>Data Gaps:</strong> {result.outputs.slide1Notes.dataGapsAndInference}</p>
                            )}
                          </>
                        )}
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
                                  {(sources as unknown[]).map((source: unknown, idx: number) => {
                                    const sourceText = typeof source === "string" 
                                      ? source 
                                      : typeof source === "object" && source !== null
                                        ? String((source as Record<string, unknown>).description ?? (source as Record<string, unknown>).url ?? JSON.stringify(source))
                                        : String(source);
                                    return <li key={idx}>{sourceText}</li>;
                                  })}
                                </ul>
                              ) : (
                                <p className="text-muted-foreground">{String(sources)}</p>
                              )}
                            </div>
                          ))
                        )}
                        
                        {Array.isArray(result.appendices.sources) && (
                          <ul className="list-disc list-inside text-muted-foreground">
                            {result.appendices.sources.map((source: unknown, idx: number) => {
                              const sourceText = typeof source === "string" 
                                ? source 
                                : typeof source === "object" && source !== null
                                  ? String((source as Record<string, unknown>).description ?? (source as Record<string, unknown>).url ?? JSON.stringify(source))
                                  : String(source);
                              return <li key={idx}>{sourceText}</li>;
                            })}
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

      {/* Loading Spinner - centered when loading and no results */}
      {isLoading && !result && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">{loadingMessage}</p>
            <p className="text-sm text-muted-foreground/70">
              {formData.generateInfographic 
                ? "This may take 2-3 minutes with infographic generation..." 
                : "This may take 60-120 seconds..."}
            </p>
          </div>
        </div>
      )}

      {/* Input Form - only shown when not loading and no results */}
      {!isLoading && !result && (
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
                  placeholder={formData.region === "UK" ? "e.g., Boots, Tesco, M&S" : "e.g., Nike, Adidas, CVS"}
                  required
                />
              </div>

              <div>
                <Label htmlFor="region">Market Region</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => handleSelectChange("region", value)}
                >
                  <SelectTrigger id="region">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">🇺🇸 United States (USD)</SelectItem>
                    <SelectItem value="UK">🇬🇧 United Kingdom (GBP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Option: Generate strategic infographic */}
              <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <input
                  type="checkbox"
                  id="generateInfographic"
                  checked={formData.generateInfographic}
                  onChange={(e) => setFormData(prev => ({ ...prev, generateInfographic: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="generateInfographic" className="text-sm font-normal cursor-pointer">
                  Generate Strategic Infographic (adds ~60-90 seconds)
                </Label>
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
                  Use mock response (Adidas example) — saves LLM calls during development
                </Label>
              </div>

              <Button
                type="submit"
                disabled={!formData.brand}
                className="w-full"
              >
                Generate ABM Pack
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
