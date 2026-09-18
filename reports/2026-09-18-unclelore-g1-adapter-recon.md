# UncleLore → G1 Evidence Adapter — Reconnaissance Report

Phase: **reconnaissance only**. No adapter code written. No G1 kernel code
touched. No frozen G1 contract/tests/fixtures touched.

Branch: `unclelore-g1-adapter`, worktree
`/mnt/data-drive/onceaponatime-adapter-recon`, branched from the completed
`g1-kernel-implementation` (commit `4f65a6c`) so the adapter can call the
real, working kernel once this phase is approved. Separate commit history
from G1 implementation, as instructed.

UncleLore itself was shallow-cloned read-only to
`/mnt/data-drive/unclelore` (`github.com/SmokesBowls/unclelore`, HEAD
`a9ec5ff "checkpoint: freeze Narrative Identity Verifier and 25-test
suite"`) purely for inspection — nothing in it was modified.

## Executive finding, before the detail

UncleLore is not one dataset with one schema. It's **four different
layers of decreasing coverage and increasing richness**, produced by
different pipelines at different times, that were never reconciled with
each other:

```text
Layer                          Records    Chapters   Has quotes/offsets?   Has source_hash?
raw/artifacts (Pass 1)          46,717      139/143   yes (see caveat)      yes (stale, see below)
review/identity_review_queue      405        n/a       no                   no
review/human_identity_reviews     501        n/a       no                   no
wiki/entity_states (Pass 3-ish)    123      <20/143    yes (excerpt field)   yes (stale, see below)
wiki/* pages (characters, etc.)  ~3,188      n/a       no (mostly stubs)     no
```

Only `raw/artifacts` and `wiki/entity_states` carry anything resembling
G1 evidence. The other layers (identity_review_queue,
human_identity_reviews, and the ~3,188 wiki pages) are aggregate
statistics, human decisions about a whole surface form, or LLM-written
summaries — none of them cite a specific span of source text and none of
them are G1 adapter inputs in this phase. This distinction matters
enough that I'm stating it up front: **"35k+ UncleLore observations" is
not one number** — it depends entirely on which layer you mean, and only
one layer (`raw/artifacts`, 46,717 records) is even shaped like a G1
`Observation` candidate.

## Answers to the specific reconnaissance questions

**UncleLore's real current storage/schema.** Flat files in git, no
database. `schema/*.md` documents an intended multi-pass pipeline
(`ARTIFACT_SCHEMA.md` = Pass 1 raw capture, `CHAPTER_LEDGER_SCHEMA.md` /
`ENTITY_COMPILER_SCHEMA.md` = Pass 2/3 classification and ledger
extraction, `REGISTRY_SYMBOL_TABLE_SCHEMA.md` = registry). Only Pass 1
(`raw/artifacts/`) and a partial, low-coverage Pass 3
(`wiki/entity_states/*.yaml`) actually have data on disk under this
checkout. Genuinely notable: `ARTIFACT_SCHEMA.md` §4 ("Strict
Prohibitions") independently arrives at almost the same discipline as
G1 — no entity typing, no confidence scoring, no identity resolution at
the capture stage, evidence-only. That's a real point in the adapter's
favor for this one layer.

**Total observation count.** 46,717 in `raw/artifacts/batch_20260518_214757.jsonl`
(the only artifact batch present), covering 7,832 distinct surface forms
across 139 of the 143 chapters currently in the vault. This is the
number to use for "how much of UncleLore can become G1 evidence" — not
the 35k figure from the earlier Hermes side-by-side comparison, which
was a different, temporary run against a different vault-copy and isn't
data that persists in this repo.

**How source provenance is stored.** Each `raw/artifacts` record carries
`source_file` (an *absolute path*, e.g.
`/home/mytruelove/Downloads/obsidianburdenNov25/_mrlore/raw/chapters/book_19_worthy_opponents_north_102_convergence_on_mars.md`),
`source_hash` (a 64-hex-char digest, presumably SHA-256 of that file at
ingest time — format matches G1's `sourceDigest` exactly), `source_line`
+ `source_span` (line-based, not character-offset), and
`surrounding_quote` (claimed verbatim text). `wiki/entity_states/*.yaml`
carries an analogous `source_file`/`source_hash` plus an `evidence[]`
array with `excerpt` — but `line_start`/`line_end` were `null` in the
one sample inspected, so even this richer layer doesn't reliably give
offsets either.

**Whether exact source files still exist.** The literal path in
`source_file` (`.../_mrlore/raw/chapters/...`) **no longer exists** —
confirms the vault un-nesting move already on record in memory. The same
chapter is recoverable by filename under
`obsidianburdenNov25/New Folder/<book>/<chapter>.md` (the paths this
session has been using throughout). But — and this is the load-bearing
finding — **the recovered file is not byte-identical to what was
ingested.** I recomputed SHA-256 for the three chapters used in the
proof set below and none matched the recorded `source_hash`:

| Chapter | Recorded `source_hash` | Current file SHA-256 |
|---|---|---|
| ch102 (`102_convergence_on_mars.md`) | `7c4957a2...` | `c1ca0aaa...` — different |
| ch126 (`126_i_am_island.txt`) | `0e452519...` | `0c37f8ee...` — different |
| ch047 (`047_mika.md`) | `c9d7d680...` | `81956d54...` — different |

The prose itself has **not** been rewritten wholesale — I confirmed the
exact quoted passages ("Commander Enlil...", "MIKA COVENANT",
"Enlil's slate was a storm of crossed lines...") are still present,
verbatim or near-verbatim, just shifted by a couple of line numbers
(e.g. "MIKA COVENANT" moved from line 211 to line 213). This means: the
adapter **cannot** treat a legacy `source_hash` as reusable. It must
build a fresh `SourceDocument` from today's file content (new digest,
by construction always self-consistent) and **re-locate** the
`surrounding_quote`/`surface_form` text within that fresh content to
derive fresh offsets — it can never carry the old line/offset numbers
forward as-is.

**Whether existing records contain excerpts/spans/offsets.** Yes for
`raw/artifacts` (line-based) and `wiki/entity_states` (excerpt, but
offsets frequently null). No for everything else (`identity_review_queue`,
`human_identity_reviews`, wiki pages).

**How identities are represented.** No stable identity ID exists
anywhere in this data. The closest things are: (a) a wiki page per
surface-form-ish name under `wiki/characters|locations|.../<Name>.md`,
and (b) `wiki/registry.md`, a flat table of `Canonical Name | Canon
State | Variants | First Source | Page`. Critically, **`First Source`
is `wiki_scan` for essentially every row I sampled** — it does not
record which chapter or which extraction run actually produced the
entry, only that the wiki-registry-builder tool found a wiki page for
that name. Identity, in other words, is currently represented by *file
naming convention*, not by any evidence-backed record.

**How aliases are represented.** `wiki/registry.md`'s `Variants` column
(e.g. `Aeon Keepers | ... | Aaon Keepers`) — a flat string list, no
provenance for why two strings were judged variants of the same thing.

**Whether same-name observations are currently merged — confirmed yes,
inconsistently, and this is the concrete case the adapter must not
inherit uncritically.** `wiki/characters/Enlil.md` (tag
`candidate_extract_6_4B`, dated 2026-05-14) says "Detected in 19 chapter
files" and presents ONE canon summary for all of them. Separately,
`wiki/characters/Commander_Enlil.md` (tag `ollama_cockpit_7_5A`, dated
2026-05-15, a day later, a different pipeline) carves out just the Mars
scenario with its own distinct summary. Neither page references or
excludes the other's chapters. And a third data point:
`wiki/entity_states/.../enlil.yaml` exists for `book_02_ch006` ("The
First Coming") — an Anunnaki Overseer assessing a landing site — which
is neither the Mars commander nor the First-Shore engineer. **"Enlil" is
at minimum three distinct entities across this corpus** (Overseer in
ch006, Commander in ch102, First Shore engineer in ch126), and the
current wiki layer's bare-name page (`Enlil.md`) has already silently
pooled at least some of them under one 19-chapter blob with no
per-chapter evidence trail. This is exactly the failure mode G1 exists
to prevent, now confirmed present in the live data, not hypothetical.

**What fields cannot map cleanly to G1.** See the mapping table below.
Short version: the `identity_review_queue`/`human_identity_reviews`
layer's whole schema (aggregate ratios, routing heuristics, a decision
about a surface form rather than an instance) has no G1 equivalent at
all — it answers a different question (should this name go to human
review) than G1 asks (does this specific mention have a specific
citation). It is legacy signal for a resolver to consult, not
observation data itself.

## Field mapping: UncleLore → G1

### `raw/artifacts/*.jsonl` (Pass 1) → G1 chain

| UncleLore field | G1 target | Classification |
|---|---|---|
| `source_file` (path) + re-read current file | `SourceDocument.exactText` | DERIVABLE FROM SOURCE — must re-locate by chapter name, not by the stale path |
| (current file content, freshly hashed) | `SourceDocument.sourceDigest` | DERIVABLE FROM SOURCE — never reuse the recorded `source_hash` |
| `surrounding_quote` | search target to locate `EvidenceSpan.startOffset/endOffset` | DERIVABLE FROM SOURCE — must re-verify substring presence in current text; **do not trust blindly** (see defect below) |
| `surrounding_quote` (once verified) | `EvidenceSpan.exactText` | DERIVABLE FROM SOURCE |
| `extractor_id` | `EvidenceSpan.extractorId` / `Observation.detectorId` | DIRECTLY MAPPABLE |
| (a fixed adapter version string) | `EvidenceSpan.extractorVersion` / `Observation.detectorVersion` | DIRECTLY MAPPABLE (adapter's own version, not UncleLore's) |
| `surface_form` | `Observation.surfaceForm` | DIRECTLY MAPPABLE, contingent on the span check above passing |
| `chapter` + `source_line` | `Observation.scope` / `Observation.sequencePosition` | DERIVABLE FROM SOURCE (opaque scope/sequence strings, not semantic) |
| `chronological_order` | `Observation.sequencePosition.ordinal` | DIRECTLY MAPPABLE |
| `artifact_id` | none — not carried into the G1 record; may be logged in adapter metadata for traceability | LEGACY METADATA ONLY |
| `extraction_timestamp` | none | LEGACY METADATA ONLY |
| `audit_only` / `provisional` (always `true`) | none — G1 has no such field by design | NOT REPRESENTABLE |
| — (no confidence field exists in this schema) | `Observation.detectorConfidence` (optional) | left absent, not fabricated |
| — (no `kind` typing exists in this schema) | `Observation.kind` | MISSING REQUIRED EVIDENCE unless the adapter assigns a generic placeholder term (e.g. `unclelore:mention`) — needs a decision, not a guess |
| — (no presence/negation signal) | `Observation.presenceState` | MISSING REQUIRED EVIDENCE — Pass 1 by design never asserts this; adapter must default to `asserted` only because raw mention implies presence, and must say so explicitly, not silently |

### `wiki/entity_states/*.yaml` → G1 chain

| UncleLore field | G1 target | Classification |
|---|---|---|
| `evidence[].excerpt` | `EvidenceSpan.exactText` (after re-verification) | DERIVABLE FROM SOURCE |
| `evidence[].line_start/line_end` | offsets | NOT REPRESENTABLE as recorded — frequently `null`; must derive from `excerpt` search instead |
| `entity_type`, `identity_evidence.*`, `relationships[]`, `actions[]` | no G1 record type accepts these (G1 has no relationship/action record in v1) | NOT REPRESENTABLE in this contract version |
| `identity_confidence`, `classification_notes` | resolver-side signal, not observation data | LEGACY METADATA ONLY |
| `compiler_notes.suggested_registry_action` | out of scope — this is exactly the kind of automatic-identity-action G1 exists to gate | NOT REPRESENTABLE |

### `identity_review_queue.jsonl` / `human_identity_reviews.jsonl` / wiki pages → G1

All of it is **LEGACY METADATA ONLY** with respect to this adapter phase.
None of these records name a specific source document, span, or single
mention — they describe a surface form in aggregate or a human's
decision about one. They may be useful later as *resolver* input (e.g.
`human_identity_reviews`'s `approved`/`merge_review` decisions could one
day inform an `IdentityCandidate` resolver), but they produce no
`SourceDocument`/`EvidenceSpan`/`Observation` themselves and are out of
scope for the adapter's first cut.

## A concrete defect the adapter's re-verification step will actually catch

Not every `raw/artifacts` record's `surrounding_quote` is trustworthy
even before the digest-drift problem. Example, chapter 126, four
consecutive `"Enlil's"`-tagged records at lines 19, 33, 59, 63: the
first two quotes genuinely contain "Enlil's slate" / "Enlil's abacus".
The third and fourth (lines 59, 63) return quotes about "the northern
Nexus" and "guard rotations... Brak at the western gate" — text that
does not contain "Enlil" at all. This looks like a line-window bug in
`artifact_extractor.py` (grabbing an adjacent line's snippet instead of
the tagged one) affecting an unknown fraction of the 46,717 records.
This is exactly why the adapter's step 5 ("verify the observation's
surface form occurs in the cited evidence") cannot be skipped or
weakened — it isn't paperwork, it will genuinely reject real, already
mis-recorded UncleLore data. G1's `createObservation` already enforces
this (`EVIDENCE_NOT_FOUND`) for free once the adapter calls it correctly.

## Proof set (3 cases, not run yet — this is the design, next message/phase runs it)

All three are real `raw/artifacts` records, already located:

1. **Enlil A vs Enlil B** (same surface name, different entities):
   - `art_aa5e2cc7e12f` — ch102, "Commander Enlil", line 56, quote
     verified present in current file at line 59 ("Standing at the
     canyon's highest point... Commander Enlil...").
   - `art_099e208aa295` — ch126, "Enlil's", line 19, quote verified
     present in current file at line 22 ("At the southern survey
     table, Enlil's slate...").
   - Expected outcome: **both individually reach valid G1 `Observation`s**
     (after fresh `SourceDocument`s + re-located spans), with different
     `projectId`/scope/source — proving the adapter does *not* need any
     identity step to keep these separate. They only become a problem if
     something later tries to build one `IdentityCandidate` from both
     `surfaceForm: "Enlil"` observations without evidence for a merge —
     which is exactly what G1's `mergeIdentityCandidates` refuses to do
     for free. That refusal is what this case is meant to demonstrate,
     not a rejection at the observation stage.

2. **Mika/Kyh grave** (incorrect entity attribution must not survive
   evidence validation):
   - `art_1ede6aa7f907` — ch047, surface form `"MIKA COVENANT"`, quote
     `"MIKA COVENANT"` at (recorded) line 211, verified present in
     current file at line 213 (the headstone line, unchanged).
   - Real case: constructing the `Observation` with `surfaceForm: "MIKA
     COVENANT"` against this span should succeed.
   - Synthetic negative control (not a real UncleLore record — deliberately
     constructed to test the failure path): the same span with
     `surfaceForm: "Kyh"` substituted. Expected outcome: G1's
     `createObservation` rejects it with `EVIDENCE_NOT_FOUND` at
     `/input/surfaceForm`, because "Kyh" does not occur in "MIKA
     COVENANT" — proving the exact class of hallucination this session
     already observed from `mrlore.sh`/qwen3:8b earlier cannot survive
     this pipeline if routed through G1 first.

3. **One straightforward known-good observation** (establishes the
   successful path): `art_1137989b675a` — ch047, surface form
   `"Geralt"`, quote `"We did," Geralt said, his voice gravelly with
   dust. "We're home."` at (recorded) line 21. Not yet checked against
   the current file's exact current line number — should be trivial
   (this passage is very early in the chapter, unlikely to have shifted
   far) but will be confirmed, not assumed, when this proof set is
   actually run.

None of these three have been run through the kernel yet. This report
stops at the design/selection stage as instructed.

## Proposed adapter boundary (design only, not implemented)

```text
for each raw/artifacts record:
  1. map record.chapter → current vault file path (filename-based lookup,
     not the stale absolute path)
  2. read current file content
  3. createSourceDocument({ projectId, documentKey: record.chapter, exactText })
     → always succeeds structurally; digest is whatever it is today
  4. search exactText for record.surrounding_quote (exact substring)
     → not found: emit { legacyObservationId, status: "unresolved",
       reason: "SOURCE_NOT_RECOVERABLE" }
     → found at one or more offsets: proceed (ambiguous multi-match
       needs its own reason code, e.g. "AMBIGUOUS_SPAN_LOCATION" — not
       silently picking the first match)
  5. createEvidenceSpan({ sourceDocumentId, startOffset, endOffset,
     exactText: matchedText, extractorId: "unclelore-adapter",
     extractorVersion: "0.1.0" }, source)
     → kernel throws on any offset/replay defect: caught, mapped to
       { status: "unresolved", reason: "<kernel error code>" }
  6. createObservation({ kind: <placeholder ontology term, TBD>,
     surfaceForm: record.surface_form, presenceState: "asserted",
     scope: {...}, sequencePosition: {...}, evidenceSpanIds: [span.id],
     detectorId: "unclelore-adapter", detectorVersion: "0.1.0",
     detectorMode: "deterministic", languageProfile: "en" }, [{span, source}])
     → kernel throws EVIDENCE_NOT_FOUND if surfaceForm isn't literally in
       matchedText (catches the line-window bug class found above): caught,
       mapped to { status: "unresolved", reason: "SURFACE_FORM_NOT_IN_EVIDENCE" }
  7. success → { legacyObservationId: record.artifact_id, status: "migrated",
     observation: <the G1 record> }

IdentityCandidate construction is explicitly OUT OF SCOPE for this first
adapter cut. Grouping same-surface-form observations into identities is
a resolver decision requiring real evidence for merge/split, not
something the adapter should do automatically just because two
observations share a `surfaceForm` string — doing so would reproduce
the exact `Enlil.md`-conflation defect this recon just found.
```

## What this recon does not yet tell us

- The true "how much of UncleLore survives" number — that requires
  actually running the above over all 46,717 records, which this phase
  was explicitly told not to do yet.
- Whether the digest-drift problem (recorded hash never matches current
  file) is total (100% of records) or partial — only 3 chapters were
  checked. If it is total, as the three checks suggest, every single
  migrated observation will carry a *fresh* digest with no cryptographic
  link back to the exact bytes originally read by the human/LLM who
  wrote the wiki summary — only a re-verified textual match. Worth
  being explicit about that limit before anyone treats a migrated G1
  observation as literally reproducing 2026-05-19's exact reading.
