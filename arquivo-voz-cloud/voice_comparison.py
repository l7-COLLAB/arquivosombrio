"""Private A/B Kokoro samples for Lizzie Borden. No production job or public audio changes."""
import os, re, io, httpx, boto3
# Fixed excerpt from the existing approved narration; no database permissions required.
sample="A casa da Second Street.\n\nNa manhã de quatro de agosto de mil oitocentos e noventa e dois, a casa de número 92 da Second Street parecia guardar apenas os desconfortos comuns de uma família que não atravessava seus melhores dias.\n\nFall River, Massachusetts, era uma cidade industrial marcada pelas fábricas têxteis que haviam impulsionado seu crescimento. No centro dessa cidade vivia Andrew Jackson Borden, um empresário de 69 anos que havia acumulado uma fortuna considerável. Dinheiro não faltava à família. Conforto, porém, era uma questão mais complicada.\n\nAndrew morava com a segunda esposa, Abby Durfee Gray Borden, e duas filhas adultas de seu primeiro casamento, Emma e Lizzie. Emma estava fora da cidade naquele início de agosto. Dentro da residência estavam Andrew, Abby, Lizzie e a empregada doméstica Bridget Sullivan. Um quinto personagem também havia passado a noite ali: John Vinnicum Morse, irmão da falecida primeira esposa de Andrew e tio materno de Lizzie.\n\nA convivência entre as filhas e a madrasta já havia conhecido tensões. Questões patrimoniais estavam entre os motivos de ressentimento apontados posteriormente. Ainda assim, transformar essa relação difícil em uma explicação para o que aconteceria naquela manhã seria simples demais.\n\nPoucas horas depois, duas pessoas estariam mortas. E alguém teria conseguido matar ambas dentro daquela casa sem ser visto cometendo os crimes.\n\nA manhã de 4 de agosto. O dia começou cedo. Andrew, Abby e John Morse tomaram o café da manhã. Bridget Sullivan, a jovem irlandesa que trabalhava havia quase três anos para a família, cuidava das tarefas domésticas. Segundo seu depoimento posterior, foram servidos alimentos que haviam feito parte das refeições dos Borden nos dias anteriores, entre eles carne de carneiro, caldo, johnnycakes, café e biscoitos.\n\nA família vinha enfrentando problemas gastrointestinais. Bridget também acordara indisposta naquela quinta-feira, com dor de cabeça e náusea. Em determinado momento da manhã, enquanto realizava suas tarefas, precisou sair para o quintal para vomitar. Lizzie desceu mais tarde. Bridget perguntou o que ela gostaria de comer. Lizzie respondeu que talvez tomasse café e comesse alguns biscoitos. Nada naquele momento anunciava que a casa estava prestes a se transformar em uma cena de homicídio."
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
