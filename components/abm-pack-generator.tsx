"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { ChevronDown, ChevronRight, Download, Loader2, ArrowRight, FileText, ImageIcon } from "lucide-react";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { branding } from "@/lib/branding";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LULULEMON_MOCK_RESPONSE } from "@/lib/mock-data/lululemon-abm-pack";

interface FormState {
  brand: string;
  region: "US" | "UK";
  notes: string;
  useMockResponse: boolean;
  generateInfographic: boolean;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per file
const MAX_TOTAL_SIZE_BYTES = 12 * 1024 * 1024; // combined cap

// Mock response imported from separate file for cleaner code
const MOCK_RESPONSE: FlexibleResponse = LULULEMON_MOCK_RESPONSE as FlexibleResponse;

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

export function ABMPackGenerator({
  brandingOverride,
}: {
  brandingOverride?: {
    toolName?: string;
    homepageTagline?: string;
    homepageSubtext?: string;
  };
} = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Generating value case...");
  const [result, setResult] = useState<FlexibleResponse | null>(null);
  const [infographicImage, setInfographicImage] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [attachments, setAttachments] = useState<File[]>([]);

  const [formData, setFormData] = useState<FormState>({
    brand: "",
    region: "US",
    notes: "",
    useMockResponse: false,
    generateInfographic: false,
  });

  // Scroll to top when results are displayed
  useEffect(() => {
    if (result) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [result]);

  useEffect(() => {
    if (!result) return;

    const tabs = buildTabs(result);
    if (tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [result]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    const newFiles = Array.from(files);

    // Validate types
    const allowedMime = new Set([
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);

    // Size checks
    const existingTotal = attachments.reduce((sum, f) => sum + f.size, 0);
    const newTotal = newFiles.reduce((sum, f) => sum + f.size, 0);

    if (newFiles.some((f) => f.size > MAX_FILE_SIZE_BYTES)) {
      toast({
        type: "error",
        description: "Each file must be under 5MB (PDF/DOCX/TXT).",
      });
      return;
    }

    if (existingTotal + newTotal > MAX_TOTAL_SIZE_BYTES) {
      toast({
        type: "error",
        description: "Total attachments must be under 12MB.",
      });
      return;
    }

    const rejected = newFiles.filter((f) => !allowedMime.has(f.type));
    if (rejected.length > 0) {
      toast({
        type: "error",
        description: "Only TXT, PDF, and DOC/DOCX files are allowed.",
      });
      return;
    }

    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
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
    setLoadingMessage("Generating value case...");
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
        
        toast({ type: "success", description: "Mock value case loaded (Lululemon example)" });
        return;
      }

      // Stage 1: Generate JSON pack
      const fd = new FormData();
      fd.append("brand", formData.brand);
      fd.append("region", formData.region);
      if (formData.notes?.trim()) {
        fd.append("notes", formData.notes.trim());
      }
      attachments.forEach((file) => fd.append("files", file));

      const response = await fetch("/api/abm-pack", {
        method: "POST",
        body: fd,
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
      toast({ type: "success", description: "Value case generated successfully!" });
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

  type TabConfig = {
    id: string;
    label: string;
    content: JSX.Element;
    available: boolean;
  };

  const buildTabs = (res: FlexibleResponse): TabConfig[] => {
    const outputs = res.outputs ?? res;

    const executiveOneLiner = outputs.executiveOneLiner;
    const cfoReadinessPanel = outputs.cfoReadinessPanel;
    const executiveSummary = outputs.executiveSummary;

    const slide1InputTable =
      outputs.slide1InputTable || outputs.slide1_inputTable || res.slide1InputTable;
    const slide1Notes =
      outputs.slide1InputTable?.notes ||
      outputs.slide1_inputTable?.notes ||
      res.slide1InputTable?.notes ||
      outputs.slide1Notes;

    const loyaltySentiment =
      outputs.loyaltySentimentSnapshot ||
      outputs.slide2LoyaltySentimentSnapshot ||
      outputs.slide2_loyaltySentimentSnapshot ||
      res.research?.loyaltySentiment ||
      outputs.loyaltySentimentLast12Months;

    const valueCase =
      outputs.slide4ValueCaseTable ||
      outputs.slide4_valueCaseTable ||
      res.valueCase ||
      outputs.valueCase;

    const modelling =
      res.modelling ||
      outputs.modelling ||
      outputs.modellingDetails ||
      outputs.modelling_details;
    const modellingFallback =
      res.appendices?.assumptionsBlock?.overallModel ||
      outputs.appendices?.assumptionsBlock?.overallModel;
    const research = res.research;
    const appendices = res.appendices;
    const brandIntake = res.brandIntake;

    const summaryContent = (
      <>
        {executiveOneLiner && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Executive One-Liner</h3>
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-lg font-medium">{executiveOneLiner}</p>
            </div>
          </div>
        )}

        {cfoReadinessPanel && (
          <div>
            <h3 className="text-lg font-semibold mb-2">CFO Readiness Panel</h3>
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <RenderValue value={cfoReadinessPanel} />
            </div>
          </div>
        )}

        {executiveSummary && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
            <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
              {executiveSummary}
            </div>
          </div>
        )}
      </>
    );

    const inputsContent = (
      <>
        {slide1InputTable && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Slide 1 - Input Metrics</h3>
            <div className="space-y-3">
              {(outputs.slide1InputTable?.tableMarkdown ||
                outputs.slide1_inputTable?.tableMarkdown ||
                res.slide1InputTable?.tableMarkdown) && (
                <MarkdownTable
                  markdown={
                    outputs.slide1InputTable?.tableMarkdown ||
                    outputs.slide1_inputTable?.tableMarkdown ||
                    res.slide1InputTable?.tableMarkdown
                  }
                />
              )}
              {Array.isArray(outputs.slide1InputTable) && (
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
                      {outputs.slide1InputTable.map((row: FlexibleResponse, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 border">{row.metric}</td>
                          <td className="py-2 px-3 border">{row.valueOrEstimate || row.value}</td>
                          <td className="py-2 px-3 border text-xs text-muted-foreground">
                            {row.sourceOrLogic || row.source}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {slide1Notes && (
                <div className="p-3 bg-muted/50 rounded text-xs space-y-1">
                  {typeof slide1Notes === "string" && <p>{slide1Notes}</p>}
                  {Array.isArray(slide1Notes) &&
                    slide1Notes.map((note: string, idx: number) => <p key={idx}>{note}</p>)}
                  {outputs.slide1Notes &&
                    typeof outputs.slide1Notes === "object" &&
                    !Array.isArray(outputs.slide1Notes) && (
                      <>
                        {outputs.slide1Notes.keyProxies && (
                          <p>
                            <strong>Key Proxies:</strong> {outputs.slide1Notes.keyProxies}
                          </p>
                        )}
                        {outputs.slide1Notes.dataGapsAndInference && (
                          <p>
                            <strong>Data Gaps:</strong> {outputs.slide1Notes.dataGapsAndInference}
                          </p>
                        )}
                      </>
                    )}
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );

    const sentimentContent = (
      <>
        {loyaltySentiment && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Loyalty Sentiment Snapshot</h3>
            <div className="bg-muted p-4 rounded-lg space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Overall Sentiment:</span>
                  <SentimentBadge
                    sentiment={
                      loyaltySentiment.overallSentimentRating ||
                      loyaltySentiment.overallSentiment ||
                      "mixed"
                    }
                  />
                </div>
              </div>

              {(loyaltySentiment.summaryNarrative ||
                loyaltySentiment.summary ||
                loyaltySentiment.narrativeSummary) && (
                <p className="text-sm">
                  {loyaltySentiment.summaryNarrative ||
                    loyaltySentiment.summary ||
                    loyaltySentiment.narrativeSummary}
                </p>
              )}

              {loyaltySentiment.sentimentTableMarkdown && (
                <MarkdownTable markdown={loyaltySentiment.sentimentTableMarkdown} />
              )}

              {Array.isArray(loyaltySentiment.sentimentTable) &&
                loyaltySentiment.sentimentTable.length > 0 && (
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
                        {loyaltySentiment.sentimentTable.map((row: FlexibleResponse, idx: number) => (
                          <tr key={idx} className="border-b align-top">
                            <td className="py-3 font-medium">
                              {row.aspectDisplay || row.aspectDisplayName || row.aspect}
                            </td>
                            <td className="py-3">{row.sentimentSummary}</td>
                            <td className="py-3">
                              {Array.isArray(row.evidence) ? (
                                <div className="space-y-2">
                                  {row.evidence.map((ev: string | FlexibleResponse, evIdx: number) => (
                                    <div
                                      key={evIdx}
                                      className="text-xs bg-background p-2 rounded italic"
                                    >
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
            </div>
          </div>
        )}
      </>
    );

    const valueCaseContent = (
      <>
        {valueCase && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Value Case (GM-Based)</h3>
            <div className="space-y-4">
              {valueCase.tableMarkdown && <MarkdownTable markdown={valueCase.tableMarkdown} />}

              {Array.isArray(valueCase.table) &&
                valueCase.table.length > 0 &&
                valueCase.table.map((row: FlexibleResponse, idx: number) => {
                  const uplift =
                    row.estimatedUpliftGM ??
                    row.estimatedUpliftGmUsd ??
                    row.estimatedUpliftGmGbp ??
                    row.estimatedUpliftGMGBP ??
                    row.estimatedUpliftGm;
                  const methodology =
                    row.assumptionsMethodology || row.assumptionsAndMethodology || row.assumptions;
                  return (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      <div className="p-4 flex justify-between items-start bg-muted/30">
                        <div>
                          <p className="font-semibold">{row.areaOfImpact}</p>
                          <p className="text-sm text-muted-foreground">{row.opportunityType}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {typeof uplift === "number" ? `$${uplift.toFixed(2)}m` : uplift}
                          </p>
                          <p className="text-xs text-muted-foreground">GM Uplift</p>
                        </div>
                      </div>
                      {methodology && (
                        <ExpandableSection title="View Methodology">
                          <div className="text-sm whitespace-pre-wrap">{methodology}</div>
                        </ExpandableSection>
                      )}
                    </div>
                  );
                })}

              {Array.isArray(valueCase.rows) &&
                valueCase.rows.length > 0 &&
                valueCase.rows.map((row: FlexibleResponse, idx: number) => (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <div className="p-4 flex justify-between items-start bg-muted/30">
                      <div>
                        <p className="font-semibold">{row.areaOfImpact}</p>
                        <p className="text-sm text-muted-foreground">{row.opportunityType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ${typeof row.estimatedUpliftGM === "number"
                            ? row.estimatedUpliftGM.toFixed(2)
                            : row.estimatedUpliftGM}
                          m
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
                ))}
            </div>
          </div>
        )}
      </>
    );

    // Extract mode applied from various possible locations
    const getModeApplied = () => {
      if (modelling?.finalModeApplied) return modelling.finalModeApplied;
      if (modelling?.finalAppliedUplifts) {
        return {
          valueCaseMode: modelling.finalAppliedUplifts.modeApplied,
          reason: modelling.finalAppliedUplifts.rationale,
        };
      }
      if (modelling?.calculations?.finalMode) {
        return {
          valueCaseMode: modelling.calculations.finalMode.valueCaseMode,
          reason: modelling.calculations.finalMode.reason,
        };
      }
      if (modelling?.modeApplied) {
        return {
          valueCaseMode: modelling.modeApplied,
          reason: modelling.modeRationale,
        };
      }
      return null;
    };

    const modeApplied = getModeApplied();

    const modellingContent = (
      <>
        {(modelling || modellingFallback) && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Modelling Details</h3>
            <ExpandableSection title="View Full Modelling Breakdown" defaultOpen>
              <div className="space-y-4">
                {/* Mode Applied - show prominently at top */}
                {modeApplied && (
                  <div>
                    <h4 className="font-medium mb-2">Mode Applied</h4>
                    <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded">
                      <p className="font-semibold">
                        {modeApplied.valueCaseMode ||
                          modeApplied.mode ||
                          modeApplied.value_case_mode}
                      </p>
                      {modeApplied.reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {modeApplied.reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Key Inputs / Setup - from real API or mock */}
                {(modelling?.keyInputs || modelling?.setup) && (
                  <div>
                    <h4 className="font-medium mb-2">Key Inputs</h4>
                    <div className="bg-muted/30 p-3 rounded text-sm">
                      <RenderValue value={modelling.keyInputs || modelling.setup} />
                    </div>
                  </div>
                )}

                {/* Uplift Ranges - from real API */}
                {modelling?.upliftRanges && (
                  <div>
                    <h4 className="font-medium mb-2">Uplift Ranges (Evidence-Based)</h4>
                    <div className="bg-muted/30 p-3 rounded text-sm">
                      <RenderValue value={modelling.upliftRanges} />
                    </div>
                  </div>
                )}

                {/* Levers - from mock data */}
                {modelling?.levers && (
                  <div>
                    <h4 className="font-medium mb-2">Lever Definitions</h4>
                    <div className="bg-muted/30 p-3 rounded text-sm">
                      <RenderValue value={modelling.levers} />
                    </div>
                  </div>
                )}

                {/* Base Case Calculations - from real API or mock */}
                {(modelling?.baseCaseUsingMidpoints || modelling?.calculations?.baseCaseUsingMidpoints) && (
                  <div>
                    <h4 className="font-medium mb-2">Base Case Calculations (Midpoints)</h4>
                    <div className="bg-muted/30 p-3 rounded text-sm">
                      <RenderValue value={modelling.baseCaseUsingMidpoints || modelling.calculations?.baseCaseUsingMidpoints} />
                    </div>
                  </div>
                )}

                {/* Final Applied Uplifts - from real API */}
                {modelling?.finalAppliedUplifts?.levers && (
                  <div>
                    <h4 className="font-medium mb-2">Final Applied Uplifts</h4>
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded text-sm">
                      <RenderValue value={modelling.finalAppliedUplifts} />
                    </div>
                  </div>
                )}

                {/* Final Uplifts GM - from mock data */}
                {modelling?.calculations?.finalUpliftsGM && (
                  <div>
                    <h4 className="font-medium mb-2">Final GM Uplifts</h4>
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded text-sm">
                      <RenderValue value={modelling.calculations.finalUpliftsGM} />
                    </div>
                  </div>
                )}

                {/* Legacy fields - keep for backwards compatibility */}
                {modelling?.baseModellingAssumptions && (
                  <div>
                    <h4 className="font-medium mb-2">Base Modelling Assumptions</h4>
                    <div className="bg-muted/30 p-3 rounded text-sm">
                      <RenderValue value={modelling.baseModellingAssumptions} />
                    </div>
                  </div>
                )}

                {modelling?.scopeAndBaseAssumptions && (
                  <div>
                    <h4 className="font-medium mb-2">Scope & Base Assumptions</h4>
                    <div className="bg-muted/30 p-3 rounded text-sm">
                      <RenderValue value={modelling.scopeAndBaseAssumptions} />
                    </div>
                  </div>
                )}

                {modelling?.upliftRangesAndChosenPoints && (
                  <div>
                    <h4 className="font-medium mb-2">Uplift Ranges & Chosen Points</h4>
                    <div className="bg-muted/30 p-3 rounded text-sm">
                      <RenderValue value={modelling.upliftRangesAndChosenPoints} />
                    </div>
                  </div>
                )}

                {modelling?.detailedCalculations && (
                  <div>
                    <h4 className="font-medium mb-2">Detailed Calculations</h4>
                    <div className="bg-muted/30 p-3 rounded text-sm">
                      <RenderValue value={modelling.detailedCalculations} />
                    </div>
                  </div>
                )}

                {modelling?.thresholdRuleApplication && (
                  <div>
                    <h4 className="font-medium mb-2">Threshold Rule Application</h4>
                    <div className="bg-muted/30 p-3 rounded text-sm">
                      <RenderValue value={modelling.thresholdRuleApplication} />
                    </div>
                  </div>
                )}

                {modelling?.finalUpliftUsingStretchUp && (
                  <div>
                    <h4 className="font-medium mb-2">Final Uplift Calculations</h4>
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                      <RenderValue value={modelling.finalUpliftUsingStretchUp} />
                    </div>
                  </div>
                )}

                {!modelling && modellingFallback && (
                  <div>
                    <h4 className="font-medium mb-2">Overall Model Summary</h4>
                    <div className="space-y-3 text-sm">
                      {modellingFallback.thresholdRuleApplication && (
                        <div className="bg-muted/30 p-3 rounded">
                          <p className="font-semibold mb-1">Threshold Rule</p>
                          <p>{modellingFallback.thresholdRuleApplication}</p>
                        </div>
                      )}
                      {modellingFallback.sensitivityNotes && (
                        <div className="bg-muted/30 p-3 rounded">
                          <p className="font-semibold mb-1">Sensitivity</p>
                          <p>{modellingFallback.sensitivityNotes}</p>
                        </div>
                      )}
                      {modellingFallback.dataConfidenceSummary && (
                        <div className="bg-muted/30 p-3 rounded">
                          <p className="font-semibold mb-1">Data Confidence</p>
                          <RenderValue value={modellingFallback.dataConfidenceSummary} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ExpandableSection>
          </div>
        )}
      </>
    );

    const researchContent = (
      <>
        {research && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Research Details</h3>

            {research.financials && (
              <ExpandableSection title="Financial Data">
                <div className="space-y-2 text-sm">
                  <RenderValue value={research.financials} />
                </div>
              </ExpandableSection>
            )}

            {research.loyaltyProgramme && (
              <ExpandableSection title="Loyalty Programme Details">
                <div className="space-y-2 text-sm">
                  <RenderValue value={research.loyaltyProgramme} />
                </div>
              </ExpandableSection>
            )}

            {research.benchmarks && (
              <ExpandableSection title="Category Benchmarks">
                <div className="space-y-2 text-sm">
                  <RenderValue value={research.benchmarks} />
                </div>
              </ExpandableSection>
            )}

            {research.paidMediaAndTech && (
              <ExpandableSection title="Paid Media & Tech Stack">
                <div className="space-y-2 text-sm">
                  <RenderValue value={research.paidMediaAndTech} />
                </div>
              </ExpandableSection>
            )}

            {research.dataConfidenceSummary && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Data Confidence Summary</h4>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(research.dataConfidenceSummary).map(([key, level]) => (
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
      </>
    );

    const appendicesContent = (
      <>
        {appendices && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Appendices</h3>

            {appendices.assumptionsBlock && (
              <ExpandableSection title="A) Detailed Assumptions">
                <div className="space-y-4">
                  {typeof appendices.assumptionsBlock === "object" &&
                    !Array.isArray(appendices.assumptionsBlock) &&
                    Object.entries(appendices.assumptionsBlock).map(([key, lever]) => (
                      <div key={key} className="border rounded p-3">
                        <h5 className="font-medium mb-2">
                          {(lever as FlexibleResponse).leverName || formatKey(key)}
                        </h5>
                        {Array.isArray((lever as FlexibleResponse).sixStepBreakdown) ? (
                          <div className="space-y-2 text-sm">
                            {((lever as FlexibleResponse).sixStepBreakdown as string[]).map(
                              (step: string, idx: number) => (
                                <div key={idx} className="p-2 bg-muted/30 rounded whitespace-pre-wrap">
                                  {step}
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <RenderValue value={lever} />
                        )}
                      </div>
                    ))}

                  {Array.isArray(appendices.assumptionsBlock) &&
                    appendices.assumptionsBlock.map((item: FlexibleResponse, idx: number) => (
                      <div key={idx} className="border rounded p-3">
                        <h5 className="font-medium mb-2">{item.leverName || `Lever ${idx + 1}`}</h5>
                        <RenderValue value={item} />
                      </div>
                    ))}
                </div>
              </ExpandableSection>
            )}

            {(appendices.sourcesAppendix || appendices.sources) && (
              <ExpandableSection title="B) Sources">
                <div className="space-y-3 text-sm">
                  {appendices.sourcesAppendix &&
                    typeof appendices.sourcesAppendix === "object" &&
                    Object.entries(appendices.sourcesAppendix).map(([category, sources]) => (
                      <div key={category}>
                        <h5 className="font-medium mb-1">{formatKey(category)}</h5>
                        {Array.isArray(sources) ? (
                          <ul className="list-disc list-inside text-muted-foreground">
                            {(sources as unknown[]).map((source: unknown, idx: number) => {
                              const sourceText =
                                typeof source === "string"
                                  ? source
                                  : typeof source === "object" && source !== null
                                    ? String(
                                      (source as Record<string, unknown>).description ??
                                        (source as Record<string, unknown>).url ??
                                        JSON.stringify(source),
                                    )
                                    : String(source);
                              return <li key={idx}>{sourceText}</li>;
                            })}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground">{String(sources)}</p>
                        )}
                      </div>
                    ))}

                  {Array.isArray(appendices.sources) && (
                    <ul className="list-disc list-inside text-muted-foreground">
                      {appendices.sources.map((source: unknown, idx: number) => {
                        const sourceText =
                          typeof source === "string"
                            ? source
                            : typeof source === "object" && source !== null
                              ? String(
                                (source as Record<string, unknown>).description ??
                                  (source as Record<string, unknown>).url ??
                                  JSON.stringify(source),
                              )
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
      </>
    );

    const brandIntakeContent = (
      <>
        {brandIntake && (
          <ExpandableSection title="Brand Intake Details">
            <div className="space-y-2 text-sm">
              <RenderValue value={brandIntake} />
            </div>
          </ExpandableSection>
        )}
      </>
    );

    const tabs: TabConfig[] = [
      { id: "summary", label: "Summary", content: summaryContent, available: Boolean(executiveOneLiner || cfoReadinessPanel || executiveSummary) },
      { id: "inputs", label: "Input Metrics", content: inputsContent, available: Boolean(slide1InputTable) },
      { id: "sentiment", label: "Loyalty Sentiment", content: sentimentContent, available: Boolean(loyaltySentiment) },
      { id: "value-case", label: "Value Case", content: valueCaseContent, available: Boolean(valueCase) },
      { id: "modelling", label: "Modelling", content: modellingContent, available: Boolean(modelling || modellingFallback) },
      { id: "research", label: "Research", content: researchContent, available: Boolean(research) },
      { id: "appendices", label: "Appendices", content: appendicesContent, available: Boolean(appendices) },
      { id: "brand-intake", label: "Brand Intake", content: brandIntakeContent, available: Boolean(brandIntake) },
    ];

    return tabs.filter((tab) => tab.available);
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
      notes: "",
      useMockResponse: false,
      generateInfographic: false,
    });
    setAttachments([]);
  };

  // Download infographic as PNG
  const downloadAsPng = () => {
    if (!infographicImage) return;
    
    const link = document.createElement("a");
    link.href = infographicImage;
    link.download = `infographic-${getBrandName().replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download infographic as PDF
  const downloadAsPdf = async () => {
    if (!infographicImage) return;
    
    try {
      // Dynamic import to avoid SSR issues
      const { jsPDF } = await import("jspdf");
      
      // Create a temporary image to get dimensions
      const img = new Image();
      img.src = infographicImage;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Calculate PDF dimensions (A4 landscape by default, but fit to image aspect ratio)
      const imgWidth = img.width;
      const imgHeight = img.height;
      const aspectRatio = imgWidth / imgHeight;
      
      // Use landscape orientation for wide infographics
      const orientation = aspectRatio > 1 ? "landscape" : "portrait";
      const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit image within page with padding
      const padding = 10;
      const maxWidth = pageWidth - padding * 2;
      const maxHeight = pageHeight - padding * 2;
      
      let finalWidth = maxWidth;
      let finalHeight = finalWidth / aspectRatio;
      
      if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = finalHeight * aspectRatio;
      }
      
      // Center the image
      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;
      
      pdf.addImage(infographicImage, "PNG", x, y, finalWidth, finalHeight);
      pdf.save(`infographic-${getBrandName().replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast({ type: "error", description: "Failed to generate PDF" });
    }
  };

  // Download full report as PDF (all sections + infographic)
  const downloadFullReport = async () => {
    if (!result) return;

    try {
      const { generateAbmPackPdfReport } = await import("@/lib/abm/pdf-report");

      const pdfBytes = await generateAbmPackPdfReport({
        data: result as Record<string, unknown>,
        infographicBase64: infographicImage,
      });

      // Create blob and trigger download (cast to satisfy TypeScript's strict ArrayBuffer typing)
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `value-case-report-${getBrandName().replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ type: "success", description: "Full report downloaded successfully" });
    } catch (error) {
      console.error("Failed to generate PDF report:", error);
      toast({ type: "error", description: "Failed to generate PDF report" });
    }
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
              filter: "blur(30px) brightness(0.5)",
              transform: "scale(1.1)",
            }}
          />
          
          {/* Subtle overlay for contrast */}
          <div className="absolute inset-0 bg-black/20" />
          
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
                className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-6 text-base rounded-lg shadow-md transition-colors"
              >
                Advance to Report
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <div className="flex gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="min-w-[160px]">
                    <DropdownMenuItem onClick={downloadAsPdf} className="cursor-pointer">
                      <FileText className="h-4 w-4 mr-2" />
                      Infographic PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={downloadAsPng} className="cursor-pointer">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Infographic PNG
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={downloadFullReport} className="cursor-pointer">
                      <FileText className="h-4 w-4 mr-2" />
                      Full Report PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleStartOver}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
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
              <CardTitle>Generated Value Case: {getBrandName()}</CardTitle>
              <div className="flex gap-2">
                {infographicImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReport(false)}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    View Infographic
                  </Button>
                )}
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
                  onClick={downloadFullReport}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download Report
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
                    a.download = `value-case-${getBrandName().replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.json`;
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
              {(() => {
                const tabs = buildTabs(result);
                const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

                if (!currentTab) {
                  return <p className="text-sm text-muted-foreground">No sections available.</p>;
                }

                return (
                  <>
                    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Value case sections">
                      {tabs.map((tab) => {
                        const isActive = tab.id === currentTab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                              isActive
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted text-foreground hover:bg-muted/80"
                            }`}
                            onClick={() => setActiveTab(tab.id)}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-6" role="tabpanel">
                      {currentTab.content}
                    </div>
                  </>
                );
              })()}
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
            <CardTitle>{brandingOverride?.toolName ?? branding.toolName}</CardTitle>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {brandingOverride?.homepageTagline ?? branding.homepageTagline}
             </p>
            <CardDescription>
              {brandingOverride?.homepageSubtext ?? branding.homepageSubtext}
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

              <div>
                <Label htmlFor="notes">Special notes (optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Discovery call highlights, internal context, constraints, key assumptions, evidence pointers..."
                  rows={4}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  These notes go straight into the value-case prompt to guide research, assumptions, and tone.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments (TXT, PDF, DOC/DOCX, up to 12MB total)</Label>
                <Input
                  id="attachments"
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  multiple
                  onChange={handleFileChange}
                />
                {attachments.length > 0 && (
                  <div className="space-y-1">
                    {attachments.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between rounded border bg-muted/40 px-3 py-2 text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttachment(idx)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Files are parsed in-memory (not stored) and added to the prompt with length clipping to respect token limits.
                </p>
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
                Generate Value Case
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
