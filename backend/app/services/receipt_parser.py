from typing import List
import os, json
from google import genai
from .gemini import ask_gemini_json
from google.genai import types
from app.utils.carbon_calc import calculate_total_from_items, get_emission_rating

_PROMPT = """\
You are a carbon footprint calculator.
Given receipt text, identify each line item and estimate its kg CO2e.
Classify each item into: food, transport, energy, shopping, digital, entertainment, healthcare, education, housing, or other.
Use IPCC/DEFRA 2024 emission factors.

For food items, further classify as:
- meat (beef, chicken, pork, lamb)
- dairy (milk, cheese, eggs)
- produce (fruits, vegetables)
- grains (bread, rice, pasta)
- beverages (coffee, tea, juice, alcohol)
- processed (snacks, prepared meals)

Return ONLY valid JSON in this exact shape — no extra text, no markdown:
{
  "items": [
    {
      "description": "Beef mince 500g",
      "category": "food",
      "sub_category": "meat",
      "kg_co2": 13.5,
      "confidence": "high"
      "reasoning": "Beef has high emissions per kg"
    }
  ],
  "total_kg_co2": 13.5
  "category_summary": {
    "food": 13.5,
    "transport": 0.0
    // ... other categories
  }
}

confidence must be: high | medium | low

Receipt text:
"""

_IMAGE_PROMPT = """\
You are a carbon footprint calculator.
This is a photo of a receipt. Read every line item visible in the image.
For each item estimate its kg CO2e using IPCC/DEFRA 2024 emission factors.
Classify each into: food, transport, energy, shopping, digital, entertainment, healthcare, education, housing, or other.
If a quantity or weight is visible, use it. Otherwise estimate from price.

For food items, further classify as:
- meat (beef, chicken, pork, lamb)
- dairy (milk, cheese, eggs)
- produce (fruits, vegetables)
- grains (bread, rice, pasta)
- beverages (coffee, tea, juice, alcohol)
- processed (snacks, prepared meals)

Return ONLY valid JSON — no extra text, no markdown:
{
  "items": [
    {
      "description": "item name and quantity",
      "category": "food",
      "sub_category": "meat",
      "kg_co2": 0.0,
      "confidence": "high"
      "reasoning": "Brief explanation of emission estimate"
    }
  ],
  "total_kg_co2": 0.0
  "category_summary": {
    "food": 0.0
  }
}

confidence must be: high | medium | low
"""

async def parse_receipt(text: str) -> dict:
    result = await ask_gemini_json(_PROMPT + text)
    result["source"] = "receipt"
    if "items" in result:
        result["total_kg_co2"] = calculate_total_from_items(result["items"])
        result["rating"] = get_emission_rating(result["total_kg_co2"], len(result["items"]))

    if "category_summary" not in result:
        result["category_summary"] = generate_category_summary(result["items"])

    return result

def generate_category_summary(items: List[dict]) -> dict:
    """Generate a summary of emissions by category."""
    summary = {}
    for item in items:
        category = item.get("category", "other")
        kg_co2 = item.get("kg_co2", 0)
        summary[category] = summary.get(category, 0) + kg_co2
    return summary


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