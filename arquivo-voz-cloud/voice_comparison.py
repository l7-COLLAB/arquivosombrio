"""Private A/B Kokoro samples for Lizzie Borden. No production job or public audio changes."""
import os, re, io, httpx, boto3
from supabase import create_client
db=create_client(os.environ["SUPABASE_URL"],os.environ["SUPABASE_SERVICE_ROLE_KEY"])
r=db.table("narration_projects").select("id").eq("content_type","dossie").eq("content_id",4).single().execute()
script=db.table("arquivo_voz_full_scripts").select("script_text").eq("project_id",r.data["id"]).single().execute().data["script_text"]
# Use the same opening for a fair A/B test; ~3 minutes, end on a sentence boundary.
sample=script[:2500]
end=max(sample.rfind("."),sample.rfind("!"),sample.rfind("?"))
sample=sample[:end+1]
sentences=re.split(r"(?<=[.!?])\s+",sample)
chunks=[];part=""
for sentence in sentences:
    if len(part)+len(sentence)>600:
        if part: chunks.append(part)
        part=sentence
    else: part=(part+" "+sentence).strip()
if part:chunks.append(part)
r2=boto3.client("s3",endpoint_url=os.environ["R2_ENDPOINT"],aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],region_name="auto")
for label,voice,speed in [("a","pf_dora",0.96),("b","pf_alice",0.96)]:
    audio=io.BytesIO()
    with httpx.Client(timeout=240,headers={"Authorization":"Bearer "+os.environ["KOKORO_API_KEY"]}) as client:
        for i,chunk in enumerate(chunks):
            response=client.post(os.environ["KOKORO_URL"]+"/v1/audio/speech",json={"model":"tts-1","input":chunk,"voice":voice,"response_format":"mp3","speed":speed})
            response.raise_for_status()
            if len(response.content)<1000:raise ValueError("Invalid audio")
            audio.write(response.content)
            print(f"Variant {label}: {i+1}/{len(chunks)} segments",flush=True)
    path=f"private-tests/lizzie-borden/voice-comparison-{label}.mp3"
    r2.put_object(Bucket=os.environ["R2_BUCKET"],Key=path,Body=audio.getvalue(),ContentType="audio/mpeg",CacheControl="private, no-store")
    print(f"Variant {label} uploaded ({audio.tell()} bytes)",flush=True)
