from pydantic import BaseModel
from typing import List, Optional

class ParseResult(BaseModel):
    description: str
    category: str
    kg_co2: float
    confidence: str
    sub_category: Optional[str] = None
    classification_details: Optional[dict] = None

class ReceiptParseResponse(BaseModel):
    items: List[ParseResult]
    total_kg_co2: float
    source: str = "receipt"
    category_summary: Optional[dict] = None

class BankParseResponse(BaseModel):
    items: List[ParseResult]
    total_kg_co2: float
    source: str = "bank"
    category_summary: Optional[dict] = None