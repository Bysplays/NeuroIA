# NeuroIA public copy

## Source and scope

The product owner supplied `NeuroIA-textos-web-final.pdf` on 2026-09-23 and
requested a switch from disease/rehabilitation positioning to entertainment,
training and serious play. This is an editorial implementation of supplied copy,
not a determination of regulatory status or legal compliance.

`src/services/productCopy.ts` holds the public introduction, information sections
and supplied general notice. `ProductInformation` makes these accessible before
sign-in and from the settings footer using the shared dialog. The login heading
and dashboard claim come from the PDF. Browser title and description follow the
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
and EEG/Muse 2 interaction as existing features. These are not currently available
in the shipped user flow and must not be advertised as available. They can be
published when implemented or when the owner explicitly chooses future-feature
wording. The PDF's short introduction and “Entrena jugando” claim mention AI;
the current introduction uses the cover paragraph without that claim instead.

## Professional entry preview

The login offers “Eres un profesional?” and a reversible professional presentation.
It addresses professionals who want to follow other people's exercise activity.
This is an audience introduction, not a new authorization flow: the copy explicitly
says professional tracking is in preparation and Google still opens the existing
personal account flow. Do not imply that selecting this view grants cross-account
access or verified professional status.

## Editorial rules

Use “persona”, “usuario”, “actividad”, “juego”, “práctica” and “rendimiento dentro
del juego”. Do not describe NeuroIA as treating, preventing or following disease,
restoring brain functions, or providing rehabilitation. Disease and medical terms
in the supplied non-medical-purpose notice are exclusions, not promotional claims.
Keep instructions, answer keys, scoring and persistence semantics intact. Internal
legacy identifiers are not product copy and do not require a data migration.
