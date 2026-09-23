import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

KOKORO_URL = os.getenv("KOKORO_URL", "http://kokoro:8880").rstrip("/")

app = FastAPI(title="Arquivo Voz Local Bridge", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

class SynthesisRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4096)
    voice: str = "pf_dora"
    speed: float = Field(default=0.95, ge=0.5, le=1.5)

@app.get("/health")
async def health():
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f"{KOKORO_URL}/v1/models")
            r.raise_for_status()
        return {"ok": True, "engine": "kokoro", "kokoro": True}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Kokoro indisponível: {exc}")

@app.get("/voices")
async def voices():
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(f"{KOKORO_URL}/v1/voices")
            r.raise_for_status()
            data = r.json()
        return {"voices": data}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Falha ao carregar vozes: {exc}")

@app.post("/synthesize")
async def synthesize(payload: SynthesisRequest):
    body = {
        "model": "tts-1",
        "input": payload.text,
        "voice": payload.voice,
        "response_format": "mp3",
        "speed": payload.speed,
    }
    try:
        async with httpx.AsyncClient(timeout=180) as client:
            r = await client.post(f"{KOKORO_URL}/v1/audio/speech", json=body)
            r.raise_for_status()
        return Response(content=r.content, media_type="audio/mpeg")
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text[:400]
        raise HTTPException(status_code=502, detail=f"Kokoro respondeu com erro: {detail}")
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Falha ao gerar áudio: {exc}")
