# UncleLore → G1 Three-Case Proof Set — Results

Executed against the real kernel (`lore-evidence-kernel/src/index.ts` on
`g1-kernel-implementation`, unmodified) via `adapter/proof.ts` in this
worktree. G1 was not modified. Ollama was not invoked. Only 5 individual
runs were executed (not all 46,717 records) — the two Enlil cases, the
two Mika/Kyh runs, and the one Geralt case, exactly as scoped.

Three statuses only, as instructed: `MIGRATED`, `UNRESOLVED`,
`REJECTED_BY_G1`.

## Case 1: Enlil A vs. Enlil B — same-name collision

| Field | Case 1a — Enlil A (ch102, commander) | Case 1b — Enlil B (ch126, engineer) |
|---|---|---|
| legacy `artifact_id` | `art_aa5e2cc7e12f` | `art_099e208aa295` |
| legacy source reference | `.../_mrlore/raw/chapters/book_19_worthy_opponents_north_102_convergence_on_mars.md` @ line 56, hash `7c4957a2...` | `.../_mrlore/raw/chapters/book_25_the_seam_evolutionary_south_126_i_am_island.txt` @ line 19, hash `0e452519...` |
| current recovered source file | `.../New Folder/book_19_worthy_opponents_north/102_convergence_on_mars.md` | `.../New Folder/book_25_the_seam_evolutionary_south/126_i_am_island.txt` |
| `legacy_digest_match` | **false** | **false** |
| `source_recovered_from_current_vault` | **true** | **true** |
| exact recovered span | "Standing at the canyon's highest point, orchestrating this display of power with casual confidence, was Commander Enlil. His armor was a masterwork of Anunnaki engineering, covered in script that rewrote local physics to his advantage. The spear he carried wasn't a weapon but a fundamental force—it existed in all dimensions simultaneously, ensuring that any thrust would hit its target regardless of defensive measures." | "At the southern survey table, Enlil's slate was a storm of crossed lines. Load vectors spiraled into dead ends. Harmonic convergence ratios fractured at the third decimal." |
| start/end offsets | 10500 / 10921 | 3312 / 3483 |
| new `SourceDocument` ID | `lek:source-document:v1:8e4a5175...` | `lek:source-document:v1:a20582cf...` |
| new `EvidenceSpan` ID | `lek:evidence-span:v1:410d2724...` | `lek:evidence-span:v1:2056cce7...` |
| new `Observation` ID | `lek:observation:v1:09206d19...` | `lek:observation:v1:d8ad6a56...` |
| G1 validation result | valid | valid |
| status / reason | **MIGRATED** / ok | **MIGRATED** / ok |

**A != B, confirmed by construction, not just by inspection**: distinct
`SourceDocument`, `EvidenceSpan`, and `Observation` IDs, because they
cite different source files with different content. No
`IdentityCandidate` was constructed for either — the adapter never
called `createIdentityCandidate`, `mergeIdentityCandidates`, or anything
that groups by `surfaceForm`. Both observations happily coexist in G1
with `surfaceForm: "Commander Enlil"` and `surfaceForm: "Enlil's"`
respectively, fully independent. This is the success condition exactly
as specified: G1 represents both without being asked to decide, or
accidentally implying, that they're the same entity.

## Case 2: Mika grave + Kyh negative control

| Field | Case 2a — Mika grave (real) | Case 2b — provenance negative control |
|---|---|---|
| legacy `artifact_id` | `art_1ede6aa7f907` | `art_1ede6aa7f907` (same record, different `surfaceForm` substituted) |
| legacy source reference | `.../_mrlore/raw/chapters/book_08_the_vigil_of_the_anchor_047_mika.md` @ line 211, hash `c9d7d680...` | same |
| current recovered source file | `.../New Folder/book_08_the_vigil_of_the_anchor/047_mika.md` | same |
| `legacy_digest_match` | **false** | **false** |
| `source_recovered_from_current_vault` | **true** | **true** |
| exact recovered span | `"MIKA COVENANT"` | `"MIKA COVENANT"` (identical span; the headstone name line) |
| start/end offsets | 16279 / 16292 | 16279 / 16292 |
| new `SourceDocument` ID | `lek:source-document:v1:20ce1499...` | — (never minted; construction failed before ID assignment) |
| new `EvidenceSpan` ID | `lek:evidence-span:v1:0973a510...` | — |
| new `Observation` ID | `lek:observation:v1:e2add634...` | — |
| G1 validation result | valid | **rejected**: `EVIDENCE_NOT_FOUND` at `/input/surfaceForm` |
| status / reason | **MIGRATED** / ok | **REJECTED_BY_G1** / `EVIDENCE_NOT_FOUND at /input/surfaceForm` |

**What 2b actually proves, precisely stated**: the cited span's exact
text is the two-word headstone line `"MIKA COVENANT"`. The string `"Kyh"`
does not occur anywhere in it. G1's `createObservation` requires the
`surfaceForm` to occur verbatim in at least one cited span's `exactText`
— it does not, so construction fails closed before any record is
minted. This is a **provenance** rejection: G1 correctly refused to let
an unsupported string ride along with a citation that doesn't contain
it. It says nothing about whether "Kyh" appears elsewhere in the
chapter, and nothing about grave ownership as a semantic claim.

**The semantic negative control (test B in the instruction — "Kyh
owns/is buried in this grave" where Kyh may genuinely occur elsewhere in
the same passage) was deliberately not run.** That test requires judging
what a passage *means*, not just what string a span contains — exactly
the job reserved for the Ollama verifier phase, not this adapter or the
kernel. Running it here and reporting a pass/fail would have
misattributed a semantic judgment to G1, which the contract never
promises. Recording that boundary explicitly, as instructed.

## Case 3: Known-good Geralt

| Field | Value |
|---|---|
| legacy `artifact_id` | `art_1137989b675a` |
| legacy source reference | `.../_mrlore/raw/chapters/book_08_the_vigil_of_the_anchor_047_mika.md` @ line 21, hash `c9d7d680...` |
| current recovered source file | `.../New Folder/book_08_the_vigil_of_the_anchor/047_mika.md` |
| `legacy_digest_match` | **false** |
| `source_recovered_from_current_vault` | **true** |
| exact recovered span | `"We did," Geralt said, his voice gravelly with dust. "We're home."` |
| start/end offsets | 2224 / 2290 |
| new `SourceDocument` ID | `lek:source-document:v1:20ce1499...` (same as case 2a — same chapter, same content, same digest, correctly deduplicated by content rather than by call) |
| new `EvidenceSpan` ID | `lek:evidence-span:v1:f42ef1a1...` |
| new `Observation` ID | `lek:observation:v1:6a1c903c...` |
| G1 validation result | valid |
| status / reason | **MIGRATED** / ok |

Establishes the uncomplicated path cleanly: legacy record → digest
mismatch acknowledged and a fresh `SourceDocument` minted from the
current file anyway → span located and verified → observation
constructed and accepted by the real kernel, no shortcuts.

## What this proves about the adapter boundary itself

```text
recoverable legacy evidence → valid G1        (cases 1a, 1b, 2a, 3 — 4/5 runs)
missing/incorrect evidence  → cannot masquerade as valid G1   (case 2b)
same name                   → does not imply same identity   (case 1a vs 1b)
semantic interpretation     → remains separate from provenance (case 2b's scope note)
```

Every one of the four `legacy_digest_match: false` results was expected
going into this run (recorded in the reconnaissance report) and is
recorded explicitly rather than papered over — no case pretended a
legacy hash still applied. All four successful migrations minted a
*fresh* `SourceDocument` from today's vault content, not a reconstructed
copy of 2026-05-19's bytes.

Stopping here, as instructed. Not proceeding to the full 46,717-record
migration or to Ollama in this phase.
