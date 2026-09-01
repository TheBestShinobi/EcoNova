import os, json
from google import genai
from google.api_core import exceptions
from google.genai import types

MODEL_NAME = "gemini-3.1-flash-lite-preview"
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

async def ask_gemini_json(prompt: str) -> dict:
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)
    except exceptions.ResourceExhausted as e:
        raise Exception(f"Gemini API Quota Exceeded (Limit 0). Check region/plan: {str(e)}")
    except Exception as e:
        raise Exception(f"Gemini API Error: {str(e)}")
 
async def ask_gemini_text(prompt: str) -> str:
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
        )
    return response.text

async def ask_gemini_image(file_path: str) -> str:
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=["Transcribe this image.",
            client.files.upload(file=file_path)],
    )
    print(response.text)
 
def stream_gemini(prompt: str):
    """Generator for SSE streaming responses."""
    for chunk in client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt, 
        stream=True):
        if chunk.text:
            yield chunk.text