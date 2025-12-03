from google import genai
from google.genai import types
from PIL import Image
from pathlib import Path
import json
import logging
# ---------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Replace 'YOUR_API_KEY' with your actual key string.
# ideally, use os.environ.get("GOOGLE_API_KEY") for security.

with open("meta_image_prompt.md", "r", encoding="utf-8") as f:
    meta_prompt = f.read()
    
def build_image_prompt(spec: dict, META_PROMPT: str) -> str:
    """
    Convert a JSON spec + your preloaded META_PROMPT
    into a final image-generation prompt using Gemini 3 Pro.
    """

    client = genai.Client()
    logging.info("Building image prompt with Gemini 3 Pro.")

    grounding_tool = types.Tool(
    google_search=types.GoogleSearch()
)

    config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_level="high"),
        tools=[grounding_tool]
    )

    system_instructions = META_PROMPT

    user_message = (
    
        f"JSON SPEC:\n"
        f"{json.dumps(spec, indent=2)}\n\n"
        
    )

    MODEL_ID = "gemini-3-pro-preview"
    logging.info(f"Using model: {MODEL_ID}")

    response = client.models.generate_content(
        model=MODEL_ID,
        contents=[
            types.Content(role="system", parts=[types.Part(text=system_instructions)]),
            types.Content(role="user", parts=[types.Part(text=user_message)])
        ],
        config=config,
    )

    return response.text.strip()



def generate_image_with_refs(
    prompt: str,
    ref_image_path_1: str,
    ref_image_path_2: str,
    output_dir: str = "outputs",
    output_base_name: str | None = None,
) -> list[str]:
    """
    Use Gemini to generate an image based on a text prompt and two reference PNGs.

    Returns a list of paths to all saved PNGs (interim + final).
    The final image is clearly marked with '_final' in the filename.
    """

    client = genai.Client()
    logging.info(f"Generating image with prompt: {prompt[:50]}...")

    # Open your reference images (must be PNG in this example)
    img1 = Image.open(ref_image_path_1).convert("RGBA")
    img2 = Image.open(ref_image_path_2).convert("RGBA")

    MODEL_ID = "gemini-3-pro-image-preview" 
    resolution = "2K" # "1K", "2K", "4K"
    aspect_ratio = "16:9" # "16:9", "4:3", "1:1"
    logging.info(f"Using image model: {MODEL_ID}, resolution: {resolution}, aspect ratio: {aspect_ratio}")


    # Call Gemini image model with prompt + both images, as shown in the docs pattern
    # (prompt and PIL Image objects passed as parts in `contents`).
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=[prompt, img1, img2],
        config=types.GenerateContentConfig(
        response_modalities=['IMAGE'],
        image_config=types.ImageConfig(
            aspect_ratio=aspect_ratio,
            image_size=resolution
        ),
    )
    )

    # Ensure output directory exists
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Get base name for output files
    base_name = output_base_name or _get_next_base_name(out_dir)

    # Gemini 3 Pro generates up to two interim images during its "Thinking" process.
    # The last image is the final rendered image.
    images = [part.as_image() for part in response.parts if part.inline_data is not None]

    if not images:
        logging.error("No image returned by Gemini in response.parts")
        raise RuntimeError("No image returned by Gemini in response.parts")

    saved_paths = []

    # Save interim images (all except the last)
    for i, img in enumerate(images[:-1], start=1):
        interim_path = out_dir / f"{base_name}_interim_{i}.png"
        img.save(interim_path)
        saved_paths.append(str(interim_path))
        logging.info(f"Saved interim image: {interim_path}")

    # Save the final image with clear "_final" suffix
    final_path = out_dir / f"{base_name}_final.png"
    images[-1].save(final_path)
    saved_paths.append(str(final_path))
    logging.info(f"Saved final image: {final_path}")

    return saved_paths


def _get_next_base_name(out_dir: Path) -> str:
    """
    Generate the next available base name like 'gemini_image_0001'.
    Checks for existing files to avoid collisions.
    """
    prefix = "gemini_image"
    i = 1
    while True:
        base_name = f"{prefix}_{i:04d}"
        # Check if any files with this base name exist
        if not list(out_dir.glob(f"{base_name}_*.png")):
            return base_name
        i += 1


if __name__ == "__main__":
    # Example usage

    client_name = "adidas"

    with open(f"abm-pack-{client_name}.json", "r", encoding="utf-8") as f:
        spec = json.load(f)


    image_prompt = build_image_prompt(spec, meta_prompt)
    # save image prompt to file
    with open(f"{client_name}_image_prompt.txt", "w", encoding="utf-8") as f:
        f.write(image_prompt)
    
    #print(image_prompt)

    # load image prompt from file
    #with open(f"{client_name}_image_prompt.txt", "r", encoding="utf-8") as f:
    #    image_prompt = f.read()

    img1_path = "hyperfinity_logo_dark.png"
    img2_path = "hyperfinity_template.png"

    saved_paths = generate_image_with_refs(image_prompt, img1_path, img2_path)
    print(f"Saved {len(saved_paths)} image(s):")
    for path in saved_paths:
        print(f"  - {path}")

