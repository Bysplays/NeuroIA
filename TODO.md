# NeuroIA — remaining work

Keep this checklist current when completing work. See [AGENTS.md](AGENTS.md)
and [DESIGN.md](DESIGN.md) for development and design guidance.

## Public text availability

- [ ] Revisit the PDF's professional, AI and EEG sections when those features ship,
  or when future-feature wording is explicitly chosen. See `CONTENT.md`.
- New neutral completion messages use the existing speech fallback if narrated;
  do not regenerate or reintroduce obsolete clinical-claim audio to fill gaps.

## Complete the ElevenLabs audio collection

- 279 of 370 clips are available in `public/audio/elevenlabs-v3/`.
- 91 feedback clips remain (listed below); the account last showed 6 credits.
- Resume with Alejandro Castellanos (`WWVK6dYMrl0ZHnHT7cRj`), Eleven v3,
  Spanish override (`es`), stability 0.5. Do not regenerate existing blocks.
- The pending text totals 2924 characters; actual billed credits may differ.
- Follow the collection README. Wait for full generation completion before
  downloading; recover incomplete downloads from History before regenerating.
- Run `python scripts/index_elevenlabs_v3.py` after downloading. Update this
  checklist, `pending.json`, `generation-status.json`, and the collection README.
- Do not purchase a subscription, merge, or deploy without explicit authorization.

- [ ] `0f79f47a8e305be5.mp3` — ¡Correcto! Cepillo de Dientes pertenece a Higiene y Baño.
- [ ] `b4aea95c021d0022.mp3` — El objeto Cepillo de Dientes corresponde a Higiene y Baño.
- [ ] `c299a3ba7b9abdd9.mp3` — ¡Correcto! Taza pertenece a Cocina.
- [ ] `74926270ed30ccf3.mp3` — El objeto Taza corresponde a Cocina.
- [ ] `15403096e00261d4.mp3` — ¡Correcto! Toalla pertenece a Higiene y Baño.
- [ ] `a69e2953dcefb98f.mp3` — El objeto Toalla corresponde a Higiene y Baño.
- [ ] `6696198efc033022.mp3` — ¡Correcto! Olla pertenece a Cocina.
- [ ] `a8ca6233746a7e18.mp3` — El objeto Olla corresponde a Cocina.
- [ ] `480851e77a6bc588.mp3` — ¡Correcto! Esponja de Baño pertenece a Higiene y Baño.
- [ ] `19699de3b9d2fa33.mp3` — El objeto Esponja de Baño corresponde a Higiene y Baño.
- [ ] `686a7f24b09fcc5d.mp3` — ¡Correcto! Martillo pertenece a Herramientas.
- [ ] `a244ee06529d11b8.mp3` — El objeto Martillo corresponde a Herramientas.
- [ ] `0d3570458142f217.mp3` — ¡Correcto! Sofá pertenece a Muebles del Hogar.
- [ ] `92e213ac2d0493c7.mp3` — El objeto Sofá corresponde a Muebles del Hogar.
- [ ] `5b2b73ba97a078a6.mp3` — ¡Correcto! Destornillador pertenece a Herramientas.
- [ ] `2120e2070799d8ed.mp3` — El objeto Destornillador corresponde a Herramientas.
- [ ] `adf426e76190cc13.mp3` — ¡Correcto! Cama pertenece a Muebles del Hogar.
- [ ] `355bd5e99e85b5de.mp3` — El objeto Cama corresponde a Muebles del Hogar.
- [ ] `66b8864f733fd98f.mp3` — ¡Correcto! Alicates pertenece a Herramientas.
- [ ] `ee0c132bc756ad91.mp3` — El objeto Alicates corresponde a Herramientas.
- [ ] `f4c44e710e339c81.mp3` — ¡Correcto! Silla pertenece a Muebles del Hogar.
- [ ] `f52d78ade85a2687.mp3` — El objeto Silla corresponde a Muebles del Hogar.
- [ ] `412d5586f42421b5.mp3` — ¡Correcto! Perro pertenece a Animales.
- [ ] `3276daa85c5006aa.mp3` — El objeto Perro corresponde a Animales.
- [ ] `3077cf9d9621cb58.mp3` — ¡Correcto! Autobús pertenece a Medios de Transporte.
- [ ] `51df25a436ba929b.mp3` — El objeto Autobús corresponde a Medios de Transporte.
- [ ] `4f64028a5ec39ffe.mp3` — ¡Correcto! Gato pertenece a Animales.
- [ ] `1dabe6a02b997284.mp3` — El objeto Gato corresponde a Animales.
- [ ] `4bf2452bc3cea516.mp3` — ¡Correcto! Bicicleta pertenece a Medios de Transporte.
- [ ] `14cf914989302933.mp3` — El objeto Bicicleta corresponde a Medios de Transporte.
- [ ] `07aee1e4ab93b282.mp3` — ¡Correcto! Caballo pertenece a Animales.
- [ ] `0f492aeb2ddb5ed3.mp3` — El objeto Caballo corresponde a Animales.
- [ ] `97928a064007e7c3.mp3` — ¡Correcto! Avión pertenece a Medios de Transporte.
- [ ] `4d5a5fe046bcc861.mp3` — El objeto Avión corresponde a Medios de Transporte.
- [ ] `d6fd7110d956069a.mp3` — ¡Pareja de Reloj!
- [ ] `a6a2f9cdfcef3d78.mp3` — ¡Pareja de Casa!
- [ ] `5e1f3e1baee0c969.mp3` — ¡Pareja de Llave!
- [ ] `81cfbc51a329e718.mp3` — ¡Pareja de Teléfono!
- [ ] `e620af502e20bca1.mp3` — ¡Pareja de Taza!
- [ ] `8df3c67520a8ebea.mp3` — ¡Pareja de Gafas!
- [ ] `291c91e0a0642318.mp3` — ¡Pareja de Zapato!
- [ ] `f74b76e203536fc4.mp3` — ¡Pareja de Manzana!
- [ ] `29d1245707e04740.mp3` — ¡Pareja de Pan!
- [ ] `ad7eead5bdd09852.mp3` — ¡Pareja de Cuchara!
- [ ] `71c90a8c4455726f.mp3` — ¡Pareja de Camisa!
- [ ] `cac1da12bb87d760.mp3` — ¡Pareja de Coche!
- [ ] `66a397555829ad94.mp3` — ¡Pareja de Silla!
- [ ] `89e4ea5ad025b571.mp3` — ¡Pareja de Lámpara!
- [ ] `c5b28e32f2a9f63d.mp3` — ¡Pareja de Libro!
- [ ] `0e81455f72740bea.mp3` — ¡Pareja de Tijeras!
- [ ] `5542af481aad61fc.mp3` — ¡Pareja de Cepillo!
- [ ] `a767aadfcc95c209.mp3` — ¡Pareja de Paraguas!
- [ ] `0e4e07a3b693c4d5.mp3` — ¡Pareja de Bicicleta!
- [ ] `b133bc4274bb6f8d.mp3` — ¡Pareja de Girasol!
- [ ] `68051a73a9b3def4.mp3` — ¡Pareja de Gato!
- [ ] `5804a6e13373da8a.mp3` — ¡Pareja de Perro!
- [ ] `69e520ccb67d478f.mp3` — ¡Pareja de Plátano!
- [ ] `edce5a363420b1fc.mp3` — ¡Pareja de Cama!
- [ ] `1f38df76717dfc2f.mp3` — ¡Pareja de Guitarra!
- [ ] `aac60d91993e403b.mp3` — ¡Pareja de Radio!
- [ ] `20aac4476d9bba6f.mp3` — ¡Pareja de Plato!
- [ ] `ef223de8b54846c1.mp3` — ¡Pareja de Sombrero!
- [ ] `bb0e3bb76d7ebb76.mp3` — ¡Pareja de Vaso!
- [ ] `ddc59fa2128e65e8.mp3` — ¡Pareja de Jabón!
- [ ] `cd6fe760f9458a56.mp3` — Recuerda buscar las manzanas rojas.
- [ ] `bea21a17325dad5d.mp3` — Recuerda buscar las peras verdes.
- [ ] `2168a55f6174a83f.mp3` — Recuerda buscar las racimos de uvas.
- [ ] `410a3172ee3a1137.mp3` — Recuerda buscar las naranjas.
- [ ] `c729f84ce4215ae7.mp3` — Recuerda buscar las plátanos.
- [ ] `a8add0a362d5fb71.mp3` — Recuerda buscar las fresas.
- [ ] `ad9eabf598eeabd1.mp3` — Recuerda buscar las cerezas.
- [ ] `938fa6921cd1e8ed.mp3` — Recuerda buscar las limones.
- [ ] `1ec915e2b6ce15a2.mp3` — Recuerda buscar las sandías.
- [ ] `0173c327a84f9cd5.mp3` — Recuerda buscar las melocotones.
- [ ] `ff795bfebc258560.mp3` — Recuerda buscar las piñas.
- [ ] `313c73b610514878.mp3` — Recuerda buscar las kiwis.
- [ ] `93ad2f8a398228d1.mp3` — Recuerda buscar las aguacates.
- [ ] `9645f78af0b96fbd.mp3` — Recuerda buscar las cocos.
- [ ] `ec56a8bde7f7a527.mp3` — Recuerda buscar las zanahorias.
- [ ] `9fc48d2f8ecefc0d.mp3` — Recuerda buscar las mazorcas de maíz.
- [ ] `169e07a58d4abade.mp3` — Recuerda buscar las tomates.
- [ ] `1147919de20491ee.mp3` — Recuerda buscar las brócolis.
- [ ] `b651f14c7f8f2001.mp3` — Recuerda buscar las patatas.
- [ ] `63580b578dc4e2ee.mp3` — Recuerda buscar las berenjenas.
- [ ] `6b4a90f2a239e798.mp3` — Recuerda buscar las champiñones.
- [ ] `1ae24b213fcc7629.mp3` — Recuerda buscar las croissants.
- [ ] `7cfaa03e39db9f3d.mp3` — Recuerda buscar las aceitunas.
- [ ] `d427dbbfc08443fb.mp3` — Recuerda buscar las melones.
- [ ] `5a6e02fb621a998b.mp3` — Velocidad de voz pausada y tranquila.
- [ ] `e316be71ff89bb71.mp3` — Velocidad de voz normal.
- [ ] `67cfd5922cec7b1e.mp3` — Lee las opciones y responde a tu ritmo.

## Review and integrate the narrator

- [ ] Listen to the generated clips, especially phonetic hints and extracted
  words. Sample approval does not verify every recording.
- [ ] Confirm licensing before a commercial release. Current recordings were
  generated on the free plan for non-commercial evaluation with attribution.
  A later subscription does not retroactively license those files.
- [x] Connect the accepted audio collection to the shared sound service,
  preserving narration controls, cancellation, callbacks and playback speed.
  Available clips play locally; missing files and playback failures use browser speech.

## Unresolved game issue

- [ ] Reproduce the reported blank background in object naming. It was not
  reproduced through the catalog; inspect the domain entry and modal/scroll
  state. Do not mark fixed without a reproduction and verification.

## Accounts and professional access

- [x] Google sign-in confirmed by the project owner.
- [x] Implement Firestore profile/settings/results synchronization, transaction
  receipts, local pending queue, initial import choice and emulator tests.
- [ ] Publish the reviewed `firestore.rules` in the real Firebase project. Local
  CLI has no authorized account; the production-mode default still needs replacing.
- [ ] Verify real-account cloud saving from two devices after publishing rules.
- [ ] Authorize the final deployment hostname in Firebase Authentication.
- [ ] Implement verified professional roles, patient-professional care links and
  revocation before restoring professional navigation.
- [ ] Add private clinical notes and patient-facing instructions with distinct
  permissions, account deletion, and explicit merge of retained local backups
  into an already-existing cloud account. Initial empty-account import is available.

## Onboarding and subscriptions

- [x] Mandatory modal, server-timed seven-day trial and transactional invitation
  redemption with care links; CEOABERTO is the only accepted code for now,
  permanent and reusable. Other codes remain disabled until professional profiles.
- [x] Add Stripe Checkout, signed webhook and customer portal integration code.
- [ ] Supply monthly Stripe Price ID, configure secrets, APP_URL, webhook and
  portal; run the payment lifecycle in Stripe test mode. See `ONBOARDING.md`.
- [ ] Assign CeoAberto's actual Firebase owner UID before enabling professional
  account access. The code now links to a reserved unclaimed professional record.
- [ ] Publish reviewed Spark-compatible rules for real-account invitation/trial
  access. No Cloud Functions or Blaze required; localhost:5173 keeps real Google login.
- [ ] Implement verified professional profile and code creation; care-link
  revocation and professional permissions remain unavailable.

## Cloudflare billing deployment

- Worker deployed: `/health` reports test mode, localhost CORS preflight succeeds,
  unauthenticated requests return 401 and unsigned webhooks return 400. Local Vite
  billing flags are enabled in ignored `.env.local`. Verify the configured secrets
  and six sandbox webhook events with a signed end-to-end payment.
- Verify real service-account access, signed delivery, Checkout, renewal, declined
  payment and portal cancellation; automated checks do not make live API calls.
- Measure CPU usage against the Workers Free limit before enabling the Pages
  purchase flag. No billing backend was deployed by the local frontend build.

- [ ] Redeploy the renewal-aware Worker and enable Cron `*/5 * * * *`; verify
  daily reconciliation and Stripe test-clock failed renewal/recovery/cancellation.
  See `worker/README.md` for bounded batches and checkpoint monitoring.
