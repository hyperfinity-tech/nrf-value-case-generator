const isDevelopment = process.env.NODE_ENV === "development";

type PdfMargin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const pdfMargin: PdfMargin = { top: 0, right: 0, bottom: 0, left: 0 };

type ChromiumBrowser = {
  newPage: () => Promise<{
    setContent: (html: string, options: { waitUntil: "networkidle" }) => Promise<void>;
    pdf: (options: {
      format: string;
      landscape: boolean;
      printBackground: boolean;
      margin: PdfMargin;
    }) => Promise<Buffer>;
  }>;
  close: () => Promise<void>;
};

type ChromiumLauncher = {
  launch: () => Promise<ChromiumBrowser>;
};

const loadChromium = async (): Promise<ChromiumLauncher | null> => {
  try {
    const importer = new Function(
      "modulePath",
      "return import(modulePath)"
    ) as (modulePath: string) => Promise<{ chromium?: ChromiumLauncher }>;
    const playwright = await importer("playwright");
    return playwright.chromium ?? null;
  } catch {
    return null;
  }
};

const renderWithPlaywright = async (html: string): Promise<Buffer> => {
  const chromium = await loadChromium();
  if (!chromium) {
    throw new Error("Playwright is not available.");
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  const pdf = await page.pdf({
    format: "A4",
    landscape: true,
    printBackground: true,
    margin: pdfMargin,
  });
  await browser.close();
  return pdf;
};

const renderWithBrowserless = async (html: string): Promise<Buffer> => {
  const browserlessUrl = process.env.BROWSERLESS_URL;
  const browserlessToken = process.env.BROWSERLESS_TOKEN;

  if (!browserlessUrl || !browserlessToken) {
    throw new Error("Browserless configuration is missing.");
  }

  const response = await fetch(`${browserlessUrl}/pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${browserlessToken}`,
    },
    body: JSON.stringify({
      html,
      options: {
        format: "A4",
        landscape: true,
        printBackground: true,
        margin: pdfMargin,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Browserless PDF generation failed.");
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const renderHtmlToPdf = async (html: string): Promise<Buffer> => {
  const hasBrowserlessConfig =
    Boolean(process.env.BROWSERLESS_URL) && Boolean(process.env.BROWSERLESS_TOKEN);

  // In production, always use Browserless
  if (!isDevelopment) {
    console.log("[PDF] Using Browserless (production)");
    return renderWithBrowserless(html);
  }

  // In development, try Playwright first
  try {
    console.log("[PDF] Attempting Playwright (development)");
    return await renderWithPlaywright(html);
  } catch (playwrightError) {
    console.log(
      "[PDF] Playwright unavailable:",
      playwrightError instanceof Error ? playwrightError.message : "unknown error"
    );

    // Fall back to Browserless if configured
    if (hasBrowserlessConfig) {
      console.log("[PDF] Falling back to Browserless");
      return renderWithBrowserless(html);
    }

    throw new Error(
      "PDF rendering unavailable. Install Playwright locally or set BROWSERLESS_URL/BROWSERLESS_TOKEN."
    );
  }
};
