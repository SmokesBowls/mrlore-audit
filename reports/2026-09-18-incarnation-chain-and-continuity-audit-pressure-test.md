# Pressure test: does UncleLore's own identity/authority evidence hold up?

Follows directly from the Dragon-facing capability comparison in the
previous audit. Two of MrLore's already-promised capabilities — alias/
incarnation-chain identity resolution, and contradiction/authority
resolution — were marked "untested" and "genuinely open" respectively.
This report tests them against real, specific UncleLore records rather
than leaving them as abstractions. No G1 code touched, no Ollama
invoked, UncleLore read-only (same clone as before,
`/mnt/data-drive/unclelore`, HEAD `a9ec5ff`).

## Test A: Geralt's incarnation chain (`entities.yaml`)

The MrLore door design doc cited this exact chain as its flagship proof
of "a real identity/canon authority layer": *"Geralt's own chain: The
Nameless One → Geralt → Ragnarok → Man Who Flew Into The Sun → Mr
GPT."* Pulling the actual record (`wiki/registry/entities.yaml`,
`entity_id: CHR-0017-geralt`, parsed with the real separator format
`mrlore_query.py` uses, not naive YAML — the file is not valid as one
YAML document) shows this is far weaker than the door doc's citation
implied:

```text
incarnation_chain:
  authority: human_review
  status: provisional
  sequence:
    1. The Nameless One   (entity_ref: null)
    2. Geralt              (entity_ref: null)
    3. Ragnarok             (entity_ref: null)
    4. Man Who Flew Into The Sun  (entity_ref: null)
    5. Mr GPT                (entity_ref: null)

evidence:
  primary_sources: ["wiki/characters/Geralt.md"]
  entity_states: []
  book_profiles: []
  canon_decisions: []

review:
  needs_review: false
  reviewed_by: human
  last_reviewed: 2026-05-19

book_appearances / chapter_appearances: 2 entries, confidence: "low" (both)
signal_stats: total_mentions: 1585, chapter_count: 37, book_count: 8
```

Checked what that sole cited source actually contains —
`wiki/characters/Geralt.md` in full:

```text
## Current Continuity State
Stub: Baseline established.
## Core Identity
Stub: Pending behavioral synthesis.
## Contradictions / Drift
None detected.
## Source Notes
No sources linked. Page created to establish registry anchor.
```

**The entire evidentiary basis for a 5-step identity-transformation
claim is a page that states, in its own words, that it has no sources.**
Every `entity_ref` in the chain is `null` — the five names aren't even
cross-linked to each other's registry entries, just five bare strings
in a list. `needs_review: false` / `reviewed_by: human` asserts human
sign-off over a claim resting on admitted zero evidence.

Cross-checked against the only place real per-mention citations exist
(`raw/artifacts`, 46,717 records) to see whether the corpus itself at
least supports the chain even if the registry doesn't cite it properly:

```text
"Ragnarok"                   -> 96 records, all in book_05_the_nameless_one
"Nameless One"                -> 568 records, all in book_05_the_nameless_one
"Man Who Flew Into The Sun"   -> 0 records anywhere in the corpus
```

"Ragnarok" and "The Nameless One" are at least real, heavily-attested
terms — but concentrated entirely in one book/arc (`book_05`), with no
citation anywhere connecting them to "Geralt" as the same entity (that
would require reading the actual chapter 24/25 prose to check, which
this report did not attempt — the point here is narrower: *the registry
itself does not do this work either*, despite claiming
`authority: human_review`). "Man Who Flew Into The Sun" — one of five
links in the chain — does not occur as extractable text anywhere in the
139-chapter artifact batch at all.

**This is worse than the Enlil case, not the same shape.** Enlil was
three real, textually well-attested entities wrongly pooled under one
name. This is a claimed five-step identity transformation for the
book's central character (1,585 mentions, 37 chapters) resting on a
page that admits zero sources, a chain with no internal cross-references,
and a terminal link that may not exist in the prose at all.

**Verdict: does not survive evidence-checking. Fails at "is there any
evidence," not merely "was the evidence checked before merging."**

## Test B: `continuity_audit.py`'s contradiction/authority claims

The door design doc's second flagship claim: *"`tools/continuity_audit.py`
runs five deterministic detectors... and writes real, reviewable
`wiki/continuity/CONT-NNNN-*.yaml` conflict records."*

`wiki/continuity/` contains exactly one file: `auto_resolved_log.md`.
**Not one `CONT-NNNN-*.yaml` file exists anywhere in this checkout, and
`git log --all -- 'wiki/continuity/*'` shows they were never committed
at any point in this repo's history** (the log file references them by
name — `CONT-0004-entity-alias-drift.yaml`, etc. — but the referenced
files themselves are absent, and unlike `raw/chapters/` this path isn't
even gitignored; they simply never existed here as tracked or
untracked artifacts).

What the log claims:

```text
Date: 2026-05-13
Files Scanned: 314
Conflicts Auto-Resolved: 86
Conflicts Unresolved: 0
```

**86 "conflicts," 0 requiring human review — and all 86 collapse into
exactly two distinct resolution rules**, repeated dozens of times each:

```text
'Aaon Keepers?' -> 'Nephoretti'    (9 occurrences in the log)
'Graviton[^i]' -> 'Graviton'       (77 occurrences in the log)
```

Checked each independently:

- **`'Graviton[^i]' -> 'Graviton'`**: `[^i]` is a Markdown footnote
  marker syntax accidentally captured as part of the token. This is
  legitimate mechanical cleanup, not a narrative contradiction. Calling
  it a "conflict" is a labeling overstatement, but the resolution
  itself is correct.
- **`'Aaon Keepers?' -> 'Nephoretti'`**: checked against real prose.
  `raw/artifacts` has 165 "Aeon/Aaon Keeper" records and 234 "Nephoretti"
  records — both real, heavily-attested, and **explicitly distinct in
  the source text**: chapter 001 has the Aeon Keepers *creating* the
  Nephoretti as a separate act — `"It's been three thousand years
  since we've created Nephoretti," Korath cautioned... "we manifested
  hundreds of Nephoretti to serve as living extensions of our
  consciousness."` A creator race and the beings it manifests are not
  the same entity. **This "auto-resolution" appears to be a real,
  incorrect entity conflation** — the same failure class as `Enlil.md`
  and the Geralt incarnation chain, just automated and logged as
  already-settled rather than left as a candidate.

**There is no way to check any of this more carefully, because the
actual per-conflict evidence files (`CONT-NNNN-*.yaml`) that would show
what the detector saw and why it decided to merge don't exist.** The
door design doc's claim of "real, reviewable conflict records" and
"explainable scoring, not a confidence-vote black box" cannot currently
be honored — what's reviewable is a two-line summary asserting a
100% auto-resolution rate, one of whose two underlying rules appears to
be wrong.

**Verdict: unauditable as claimed, and the one substantive resolution
checkable at all looks incorrect.** This is a stronger, more concrete
finding than "genuinely open" — it's not just that G1 can't do
contradiction resolution (expected, by design); it's that UncleLore's
own claimed contradiction-resolution system left no evidence trail to
inspect, and its one visible non-trivial decision doesn't hold up
against the actual source text.

## What this changes about the Dragon-facing capability table

Revising the two "untested"/"genuinely open" rows from the previous
audit with what's now actually known:

```text
1. Alias/canonical-name resolution
   was: untested, not proven either way
   now: tested, FAILS -- the specific example the door design cited as
        proof of this capability rests on zero cited evidence

2. Contradiction/authority resolution
   was: genuinely open, likely the real Ollama boundary
   now: still likely a real semantic task for later, BUT the existing
        implementation's own output is not just "not evidence-backed
        the G1 way" -- it's unauditable (missing files) and its one
        checkable decision is wrong. This is not a gap to hand to
        Ollama as-is; it's a reason not to trust continuity_audit.py's
        past output at all until it's re-run and its individual
        decisions are evidence-checked one at a time, the same way
        entities.yaml's incarnation chains need to be.
```

Neither finding is about G1's scope. Both are about whether the
specific claims UncleLore already made — the ones the door design
leaned on to argue MrLore has a working identity/authority layer — are
actually true. They are not, in both cases checked. This doesn't mean
UncleLore is worthless (`raw/artifacts`'s 46,717 per-mention citations
remain real and, per the adapter proof set, ~97% recoverable); it means
the *identity and contradiction conclusions layered on top of that raw
data* were never verified and, spot-checked twice now, don't hold up.

## Recommendation

Before any Dragon-facing door surfaces an identity or contradiction
answer from UncleLore's existing registry/continuity output, it should
be re-derived through G1 rather than read from `entities.yaml`/
`wiki/continuity/` directly — exactly the "MrLore door reads G1
evidence, not raw UncleLore claims" shift from the earlier discussion,
now with two concrete, named examples of why the raw claims can't be
trusted as-is rather than a general worry.

Not run in this pass, deliberately: re-checking all 111 registry
entities' incarnation chains, or re-running `continuity_audit.py`
itself. This was a pressure test of two specific, previously-cited
examples, not a full re-audit.
