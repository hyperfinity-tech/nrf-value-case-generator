import { auth } from "@/app/(auth)/auth";
import { buildImagePrompt } from "@/lib/ai/image-prompt-builder";
import { generateInfographicImage } from "@/lib/ai/image-generator";
import { ChatSDKError } from "@/lib/errors";

export const maxDuration = 300; // Image generation can take a while

interface ImageGenerationRequest {
  packData: Record<string, unknown>;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] 🖼️ ABM Pack image generation request received`);

  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      console.error(`[${requestId}] ❌ Authentication failed`);
      return new ChatSDKError("unauthorized:abm-pack").toResponse();
    }

    // Parse request body
    const body = (await request.json()) as ImageGenerationRequest;
    
    if (!body.packData) {
      console.error(`[${requestId}] ❌ Missing packData in request`);
      return Response.json(
        { ok: false, error: "Missing packData in request body" },
        { status: 400 }
      );
    }

    const brandName = 
      (body.packData.brandIntake as Record<string, unknown>)?.brand ?? 
      "Unknown Brand";
    console.log(`[${requestId}] 📊 Generating infographic for: ${brandName}`);

    // Stage 1: Build the image prompt from the ABM pack data
    console.log(`[${requestId}] 📝 Building image prompt with Gemini 3 Pro...`);
    const startPromptTime = Date.now();
    
    const imagePrompt = await buildImagePrompt(body.packData);
    
    const promptTime = Date.now() - startPromptTime;
    console.log(`[${requestId}] ✅ Image prompt built in ${promptTime}ms`);
    console.log(`[${requestId}] 📝 Prompt length: ${imagePrompt.length} chars`);

    // Stage 2: Generate the image using the prompt and reference images
    console.log(`[${requestId}] 🎨 Generating image with Gemini 3 Pro Image...`);
    const startImageTime = Date.now();
    
    const imageBase64 = await generateInfographicImage(imagePrompt);
    
    const imageTime = Date.now() - startImageTime;
    console.log(`[${requestId}] ✅ Image generated in ${imageTime}ms`);

    const totalTime = Date.now() - startPromptTime;
    console.log(`[${requestId}] 🎉 Total generation time: ${totalTime}ms`);

    return Response.json({
      ok: true,
      imageBase64,
      metadata: {
        brandName,
        promptTimeMs: promptTime,
        imageTimeMs: imageTime,
        totalTimeMs: totalTime,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId}] ❌ Image generation failed:`, errorMessage);

    // Don't expose internal errors to client
    return Response.json(
      { 
        ok: false, 
        error: "Image generation failed. Please try again." 
      },
      { status: 500 }
    );
  }
}

