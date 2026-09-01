import base64
import os, json
from google import genai
from .gemini import ask_gemini_json
from google.genai import types
from app.utils.carbon_calc import calculate_total_from_items, get_emission_rating

_PROMPT = """\
You are a carbon footprint calculator.
Given receipt text, identify each line item and estimate its kg CO2e.
Classify each item into: food, transport, energy, shopping, digital, or other.
Use IPCC/DEFRA 2024 emission factors.

Return ONLY valid JSON in this exact shape — no extra text, no markdown:
{
  "items": [
    {
      "description": "Beef mince 500g",
      "category": "food",
      "kg_co2": 13.5,
      "confidence": "high"
    }
  ],
  "total_kg_co2": 13.5
}

confidence must be: high | medium | low

Receipt text:
"""

_IMAGE_PROMPT = """\
You are a carbon footprint calculator.
This is a photo of a receipt. Read every line item visible in the image.
For each item estimate its kg CO2e using IPCC/DEFRA 2024 emission factors.
Classify each into: food, transport, energy, shopping, digital, or other.
If a quantity or weight is visible, use it. Otherwise estimate from price.

Return ONLY valid JSON — no extra text, no markdown:
{
  "items": [
    {
      "description": "item name and quantity",
      "category": "food",
      "kg_co2": 0.0,
      "confidence": "high"
    }
  ],
  "total_kg_co2": 0.0
}

confidence must be: high | medium | low
"""

async def parse_receipt(text: str) -> dict:
    result = await ask_gemini_json(_PROMPT + text)
    result["source"] = "receipt"
    if "items" in result:
        result["total_kg_co2"] = calculate_total_from_items(result["items"])
        result["rating"] = get_emission_rating(result["total_kg_co2"], len(result["items"]))
    return result


async def parse_receipt_image(image_bytes: bytes, content_type: str = "image/jpeg") -> dict:
    client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
    
    image_part = types.Part.from_bytes(
        data=image_bytes,
        mime_type=content_type
    )

    response = client.models.generate_content(
        model="gemini-3.1-flash-lite-preview",
        contents=[_IMAGE_PROMPT, image_part],
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )

    result = json.loads(response.text)
    result["source"] = "receipt_image"
    if "items" in result:
        result["total_kg_co2"] = calculate_total_from_items(result["items"])
        result["rating"] = get_emission_rating(result["total_kg_co2"], len(result["items"]))
    return result