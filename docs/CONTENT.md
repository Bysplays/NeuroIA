# NeuroIA public copy

## Source and scope

The product owner supplied `NeuroIA-textos-web-final.pdf` on 2026-09-23 and
requested a switch from disease/rehabilitation positioning to entertainment,
training and serious play. This is an editorial implementation of supplied copy,
not a determination of regulatory status or legal compliance.

`src/services/productCopy.ts` holds the public introduction, information sections
and supplied general notice. `ProductInformation` makes these accessible before
sign-in and from the settings footer using full document pages. The concise unauthenticated-home heading “Juega a tu ritmo” adapts the supplied claim; its
one-sentence introduction names actual practice areas. The complete product
explanation remains in About. Browser title and description follow the
same positioning. Keep descriptions grounded in observable in-game activity.

## Included sections

- Cover: “Jugar también puede ser una forma de entrenar”.
- Claim: “Juega. Practica. Progresa a tu ritmo”.
- Serious play explanation and accessible-use paragraphs.
- Skills grouped as attention, memory, language, coordination and logic.
- Adaptation and activity-data paragraphs, narrowed to existing level changes,
  completed activity durations, accuracy, errors and difficulty. Do not promise
  per-stimulus response-time logging or personalized AI that does not exist.
- The PDF's first legal-notice paragraph, verbatim with the NeuroIA name repaired
  from PDF text extraction. The EEG-specific paragraph is deferred with EEG.

The clinical-history fields are no longer rendered in the retained professional
component. Persisted field names and existing data are preserved. Historical
result feedback may contain old clinical claims, so historical summary surfaces
use neutral completion text; do not rewrite users' saved records. New generated
result feedback describes the game and avoids inferred improvement or efficacy.

## Deferred source sections

The PDF describes professional session access, AI-driven adaptation and summaries,
and EEG/Muse 2 interaction as existing features. The professional workspace now
implements read-only activity for explicitly redeemed paid seats; it is not
clinical session management. AI remains unavailable and must not be advertised as implemented. The owner
confirms the MuseJS-based Muse 2 EEG/PPG connection, battery, reconnection and saved
charts on the tested setup. Describe these as signal amplitudes, without claims of
attention, mental effort, heart rate or universal device/browser compatibility. The PDF's short introduction and “Entrena jugando” claim mention AI;
the current introduction uses the cover paragraph without that claim instead.

## Professional entry

The login offers “¿Eres un profesional?” and a reversible professional presentation.
Its owner-approved subtitle is “Gestiona los perfiles de varios jugadores”. It addresses
professionals who want to follow other people's exercise activity.
Keep “Para profesionales”, the heading and Google/email access actions in its panel;
omit the explanatory and availability paragraphs. Signing in opens a free
self-owned workspace. Selecting it alone does not grant access to anyone
else’s data or verify professional credentials. Paid seats plus explicit participant
redemption authorize read-only activity. Describe this as activity tracking, never
medical follow-up or clinically verified results.

## Editorial rules

Use “persona”, “usuario”, “actividad”, “juego”, “práctica” and “rendimiento dentro
del juego”. Do not describe NeuroIA as treating, preventing or following disease,
restoring brain functions, or providing rehabilitation. Disease and medical terms
in the supplied non-medical-purpose notice are exclusions, not promotional claims.
Keep instructions, answer keys, scoring and persistence semantics intact. Internal
legacy identifiers are not product copy and do not require a data migration.

## Supplied institutional attribution

The owner supplied the complete IGAPE funding notice on 2026-09-29. Render it
unchanged on the IGAPE information page with an HTML transcript.
The notice's AI project subtitle is funding attribution, not an additional claim
that the current product ships all planned AI capabilities. See
[asset provenance](assets/images/institutional/README.md).

## Operational privacy notice

`PRIVACY_SECTIONS` in `productCopy.ts` describes the implemented account, progress,
professional sharing, optional Muse recordings, billing providers and local storage.
It appears on the legal page, alongside the supplied non-medical notice. This is
not yet a complete approved privacy policy: the owner has confirmed CEO Aberto S.L., NIF B36232361, the Vigo address
and david@ceoaberto.com as privacy contact. Remaining approval covers legal bases (including optional signal recording),
retention criteria, rights handling and provider transfer safeguards before release.
Do not invent these details or imply that closing a session or cancelling billing
deletes account data. Reference: [AEPD information duty](https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion).
