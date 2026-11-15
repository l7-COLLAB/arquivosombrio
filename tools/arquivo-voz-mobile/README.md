# Arquivo Voz Mobile (Edge TTS)

Serviço **separado** do site principal. Gera MP3 diretamente no Safari/Chrome móvel, com login de administrador validado pelo Supabase Auth. O site público não é alterado.

## Render Web Service
- Language: Python 3
- Branch: feat/arquivo-voz-mobile-edge-tts (enquanto o PR estiver pendente)
- Root Directory: tools/arquivo-voz-mobile
- Build Command: pip install -r requirements.txt
- Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
- Instance: Free (para testes)

Environment variables (definir no painel Render, **nunca** no GitHub):
- SUPABASE_URL=https://iuhotznurbyujzbyhizf.supabase.co
- SUPABASE_ANON_KEY=<chave pública anon ou publishable compatível com Auth>

A conta deve ter app_metadata.role = admin, validado no backend. Nunca usar service_role no Render deste serviço.

## Operação
Acesse o URL https://...onrender.com, entre com seu login de administrador, cole o roteiro adaptado, selecione voz, gere, escute e baixe MP3. Depois anexe manualmente ao arquivo correto na Admin V2. Sem upload automático no v0.1.

## Limitações
- Dependência não oficial edge-tts / endpoint Microsoft sujeita a alterações ou limitações. Avaliar política de uso antes da operação em escala.
- Plano Free pode dormir após inatividade; geração longa pode exceder timeouts da hospedagem/proxy.
- Limite de 16 mil caracteres por trabalho e 8 gerações por hora por conta (em memória; não é proteção distribuída para múltiplos processos).
- O MP3 não é armazenado permanentemente no servidor.
- Segmentar MP3 por concatenação de frames pode gerar artefatos de duração em alguns players. Validar reprodução integral.
- Requer testes reais antes de considerar produção.
