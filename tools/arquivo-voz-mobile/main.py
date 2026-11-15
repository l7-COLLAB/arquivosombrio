"""Arquivo Voz Mobile: minimal, authenticated Edge TTS service."""
import asyncio
import io
import os
import re
import time
from pathlib import Path
from threading import Lock
import edge_tts
import httpx
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse, JSONResponse, Response
from pydantic import BaseModel, Field

ROOT = Path(__file__).parent
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
VOICES = {"pt-BR-FranciscaNeural", "pt-BR-AntonioNeural"}
SLOTS = asyncio.Semaphore(1)
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
attempts = {}
attempt_lock = Lock()

class Generate(BaseModel):
    text: str = Field(min_length=5, max_length=16000)
    voice: str = "pt-BR-FranciscaNeural"
    rate: int = Field(default=0, ge=-30, le=30)

@app.get("/")
async def index():
    return FileResponse(ROOT / "index.html", headers={"Cache-Control":"no-store"})

@app.get("/health")
async def health():
    return {"ok":True, "engine":"edge-tts"}

@app.get("/config")
async def config():
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(503, "Autenticação ainda não configurada")
    return {"supabase_url":SUPABASE_URL, "supabase_anon_key":SUPABASE_ANON_KEY}

async def admin_identity(authorization: str):
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(503, "Autenticação não configurada")
    if not authorization.startswith("Bearer ") or len(authorization)>12000:
        raise HTTPException(401, "Faça login como administrador")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r=await client.get(SUPABASE_URL+"/auth/v1/user",headers={
                "apikey":SUPABASE_ANON_KEY,"Authorization":authorization
            })
        if r.status_code!=200:
            raise HTTPException(401, "Sessão inválida")
        user=r.json()
        if user.get("app_metadata",{}).get("role")!="admin":
            raise HTTPException(403, "Acesso reservado a administradores")
        return str(user.get("id",""))
    except httpx.HTTPError:
        raise HTTPException(502, "Falha ao validar sessão")

@app.post("/api/generate")
async def generate(data: Generate, authorization: str=Header(default="")):
    owner=await admin_identity(authorization)
    if data.voice not in VOICES:
        raise HTTPException(400,"Voz inválida")
    text=data.text.strip()
    if not re.search(r"\w",text):
        raise HTTPException(400,"Texto vazio")
    # A lightweight per-account throttle; resets on redeploy/sleep.
    now=time.monotonic()
    with attempt_lock:
        recent=[v for v in attempts.get(owner,[]) if now-v<3600]
        if len(recent)>=8:
            raise HTTPException(429,"Limite de 8 gerações por hora atingido")
        recent.append(now);attempts[owner]=recent
    try:
        async with SLOTS:
            segments=[]
            parts=re.split(r"(?<=[.!?])\s+",text)
            current=""
            for s in parts:
                if len(s)>2500:
                    if current: segments.append(current);current=""
                    segments.extend(s[i:i+2500] for i in range(0,len(s),2500))
                elif len(current)+len(s)>2500:
                    if current:segments.append(current)
                    current=s
                else:current=(current+" "+s).strip()
            if current:segments.append(current)
            out=io.BytesIO()
            for part in segments:
                communicate=edge_tts.Communicate(part, data.voice, rate=f"{data.rate:+d}%")
                async for packet in communicate.stream():
                    if packet["type"]=="audio":out.write(packet["data"])
        sound=out.getvalue()
        if len(sound)<1024:raise RuntimeError("Áudio insuficiente")
        return Response(sound,media_type="audio/mpeg",headers={
            "Content-Disposition":'attachment; filename="arquivo-voz.mp3"',
            "Cache-Control":"no-store",
            "X-Content-Type-Options":"nosniff"
        })
    except Exception:
        raise HTTPException(502,"Geração não concluída. Tente um trecho menor.")
