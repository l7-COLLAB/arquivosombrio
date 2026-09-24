# Arquivo Voz Cloud — staging only

This worker is NOT connected to production. Deploy only after selecting a paid/free hosting provider and setting a strict spending cap.

1. Apply `sql/arquivo_voz_cloud.sql` using a reviewed Supabase migration.
2. Host Kokoro privately alongside this worker; do not expose Kokoro or the service-role key to the internet.
3. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `KOKORO_URL` in the host secret manager.
4. Build the worker Dockerfile. Ensure Kokoro can resolve at `http://kokoro:8880`.
5. Test with a short, explicitly approved sample job before wiring the V2 publisher.
6. A separate admin-only Edge Function must validate authorization and enqueue the content snapshot, hash, and revision; never grant browser insert access to the queue.
7. Approval and signed playback URLs require an admin-only approval endpoint and changes to public-narration. Keep Polly enabled until end-to-end tests pass.

The worker leaves every generated file in **review** state. Nothing is automatically published. Cloud hosting, migration, enqueue, approval and public playback are deliberately not activated by this branch.
