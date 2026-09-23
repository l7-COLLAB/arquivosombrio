# Arquivo Voz — laboratório local

Este laboratório roda no notebook e é controlado pela V2 do Arquivo Sombrio.

## Requisito

Instale o Docker Desktop.

## Iniciar

No terminal, dentro desta pasta:

```bash
docker compose up -d
```

Na primeira execução, o modelo pode levar alguns minutos para ser baixado e carregado.

## Verificar

Abra no navegador:

```
http://localhost:8890/health
```

Quando aparecer `{"ok":true,...}`, volte para a V2 > Arquivo Voz e clique em **Testar conexão**.

## Parar

```bash
docker compose down
```

## Serviços

- Kokoro: http://localhost:8880
- Bridge Arquivo Voz: http://localhost:8890

A V2 usa apenas o bridge na porta 8890.
