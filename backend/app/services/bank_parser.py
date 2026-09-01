from .gemini import ask_gemini_json
from app.utils.carbon_calc import calculate_total_from_items, get_emission_rating
 
PROMPT = """
You are a carbon footprint calculator.
Given these bank transactions (merchant name and amount), classify each into a carbon category and estimate kg CO2e.
Use spend amounts to infer quantity where possible
(e.g. Shell $60 CAD ≈ 40L petrol ≈ 91 kg CO2).

Categories: food, transport, energy, shopping, digital, entertainment, healthcare, education, housing, other

Return ONLY valid JSON:
{
  "items": [
    {
      "description": "Shell - fuel", 
      "category": "transport",
      "sub_category": "fuel",
      "kg_co2": 91.0, 
      "confidence": "medium",
      "reasoning": "Petrol purchase from gas station"
    }
  ],
  "total_kg_co2": 0.0
}
Transactions:
"""
 
async def parse_bank(text: str) -> dict:
    result = await ask_gemini_json(PROMPT + text)
    result["source"] = "bank"
    if "items" in result:
        result["total_kg_co2"] = calculate_total_from_items(result["items"])
        result["rating"] = get_emission_rating(result["total_kg_co2"], len(result["items"]))
    return result