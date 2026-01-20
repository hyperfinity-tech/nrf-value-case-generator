import { z } from "zod";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { type AbmPackOutput } from "../abm-pack/schema";
import { generateHtmlReport } from "@/lib/abm/html-report";
import { renderHtmlToPdf } from "@/lib/abm/html-report/render-to-pdf";
import { normalizeDataUrl } from "@/lib/abm/html-report/utils";

const fileNameSanitizePattern = /[^a-z0-9]+/g;
const fileNameTrimPattern = /(^-|-$)/g;

// Validate top-level structure only - structured outputs guarantee the shape,
// but minor variations (e.g., snake_case vs camelCase) may occur.
// We trust the data and cast to AbmPackOutput for type safety in rendering.
const requestSchema = z.object({
  data: z.object({
    brandIntake: z.object({ brand: z.string() }).passthrough(),
    research: z.object({}).passthrough(),
    modelling: z.object({}).passthrough(),
    outputs: z.object({}).passthrough(),
    appendices: z.object({}).passthrough(),
  }).passthrough(),
  infographicBase64: z.string().nullable().optional(),
});

const loadLogoDataUrl = async (): Promise<string | null> => {
  try {
    const logoPath = join(process.cwd(), "public", "images", "hyperfinity-logo-dark.png");
    const logoBytes = await readFile(logoPath);
    return normalizeDataUrl(logoBytes.toString("base64"), "image/png");
  } catch {
    return null;
  }
};

/**
 * Resolve infographic to a data URL.
 * - If already base64 or data URL, normalize it
 * - If URL path (e.g., /images/...), read from public folder and convert to base64
 */
const resolveInfographicDataUrl = async (input: string | null): Promise<string | null> => {
  if (!input) return null;
  
  // Already a data URL
  if (input.startsWith("data:")) return input;
  
  // URL path - read from public folder
  if (input.startsWith("/")) {
    try {
      const filePath = join(process.cwd(), "public", input);
      const fileBytes = await readFile(filePath);
      const ext = input.split(".").pop()?.toLowerCase();
      const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
      return `data:${mimeType};base64,${fileBytes.toString("base64")}`;
    } catch (err) {
      console.error(`Failed to load infographic from ${input}:`, err);
      return null;
    }
  }
  
  // Raw base64
  return normalizeDataUrl(input, "image/png");
};

const formatReportDate = () => new Date(Date.now()).toISOString().split("T").at(0) ?? "report";

const buildFileName = (brand: string) => {
  const sanitized = brand.toLowerCase().replace(fileNameSanitizePattern, "-").replace(fileNameTrimPattern, "");
  return `value-case-report-${sanitized}-${formatReportDate()}.pdf`;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      const zodErrors = result.error.flatten();
      console.error("PDF route validation failed:", JSON.stringify(zodErrors, null, 2));
      return Response.json(
        { error: `Invalid request payload: ${JSON.stringify(zodErrors.fieldErrors)}` },
        { status: 400 }
      );
    }

    // Cast to AbmPackOutput - we trust structured outputs; rendering handles missing fields gracefully
    const data = result.data.data as unknown as AbmPackOutput;
    
    // Resolve infographic (handles both base64 and URL paths)
    const infographicDataUrl = await resolveInfographicDataUrl(result.data.infographicBase64 ?? null);
    const logoDataUrl = await loadLogoDataUrl();

    const html = generateHtmlReport({
      data,
      infographicBase64: infographicDataUrl,
      logoDataUrl,
    });

    const pdfBuffer = await renderHtmlToPdf(html);
    const fileName = buildFileName(data.brandIntake.brand);

    // Convert Buffer to Uint8Array for Response compatibility
    const pdfBytes = new Uint8Array(pdfBuffer);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate HTML report.";
    return Response.json({ error: message }, { status: 500 });
  }
}
