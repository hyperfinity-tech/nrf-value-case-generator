// Attachment parsing and safeguards for ABM pack uploads
import type { Result as MammothResult } from "mammoth";
// @ts-ignore - mammoth has no bundled types; using implicit any
import mammoth from "mammoth";
import pdf from "pdf-parse";
import { ChatSDKError } from "@/lib/errors";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per file
export const MAX_TOTAL_SIZE_BYTES = 12 * 1024 * 1024; // 12MB combined
export const MAX_ATTACHMENT_CHARS = 12000; // prompt clipping safeguard

async function extractFileText(file: File, requestId: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type;
  const name = file.name.toLowerCase();

  if (mime === "text/plain" || name.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    const parsed = await pdf(buffer);
    return parsed.text ?? "";
  }

  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword" ||
    name.endsWith(".docx") ||
    name.endsWith(".doc")
  ) {
    const result = (await mammoth.extractRawText({ buffer })) as MammothResult;
    return (result as { value?: string }).value ?? "";
  }

  console.warn(`[${requestId}] ⚠️ Unsupported file type for ${file.name}, skipping.`);
  return "";
}

export async function readAttachmentsText(formData: FormData, requestId: string): Promise<string> {
  const files = formData.getAll("files").filter((f) => f instanceof File) as File[];

  if (files.length === 0) return "";

  let total = 0;
  const parts: string[] = [];

  for (const file of files) {
    total += file.size;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new ChatSDKError("bad_request:abm-pack", {
        message: `${file.name} exceeds 5MB limit`,
      });
    }
    if (total > MAX_TOTAL_SIZE_BYTES) {
      throw new ChatSDKError("bad_request:abm-pack", {
        message: "Combined attachment size exceeds 12MB limit",
      });
    }

    const text = (await extractFileText(file, requestId)).trim();
    if (text) {
      parts.push(`--- ${file.name} ---\n${text}`);
    }
  }

  const combined = parts.join("\n\n");
  return combined.length > MAX_ATTACHMENT_CHARS
    ? `${combined.slice(0, MAX_ATTACHMENT_CHARS)}\n\n[Clipped to respect token limits]`
    : combined;
}

