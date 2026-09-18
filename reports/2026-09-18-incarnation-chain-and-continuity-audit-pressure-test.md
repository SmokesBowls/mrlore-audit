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

**Correction to how this finding was first stated (author feedback,
recorded here rather than silently edited away): two separate errors in
the original framing.**

**First** — `needs_review: false` / `reviewed_by: human` next to a
source page that says "No sources linked" does not prove the review
never happened. It proves the *surviving record* cannot demonstrate or
be audited against that review. Absent independent evidence that no
human ever looked at this, calling the authority claim "fabricated"
overstates what was actually shown. The supportable finding is:

```text
The registry asserts human review, but preserves no review receipt,
source, decision record, or evidence trail sufficient to audit that
assertion.

Result: HUMAN-REVIEW CLAIM UNAUDITABLE — not proven false.
```

**Second, and more important** — treating the absence of current
textual evidence as evidence *against* the five-name chain was wrong in
a deeper way. This character is explicitly designed to persist across
roughly 6,000 in-story years, presenting under different names to
different eras and different observers, by intent — not as a data gap
to close. A given chapter, including one that's been rewritten many
times, has no obligation to re-expose the connection between "Geralt"
and "Mr GPT" for that connection to still be true at the author/canon
level. The people in that scene may not know it either. So the right
model is six distinguishable things, not one collapsed "is there
evidence" question:

```text
story-facing identity     — who this being appears to be within one
                             era/scene, to the characters around them
persistent identity       — the one underlying being across all eras,
                             an author/canon-level fact
current textual evidence  — what today's version of a chapter says
historical textual evidence — what an earlier draft/version said,
                             possibly since rewritten away
human/author canon        — what the author has actually established,
                             independent of what any single draft states
derived inference          — what a tool concluded by pattern-matching,
                             not by citation
```

G1 governs exactly one of those six layers: current textual evidence.
It has no way to confirm or deny persistent identity or author canon,
and it must not be read as having done so just because a particular
rewrite doesn't happen to expose the connection. The cross-check against
`raw/artifacts` below is reported as a fact about that one layer only,
not as an argument against the chain itself:

```text
"Ragnarok"                   -> 96 records, all in book_05_the_nameless_one
"Nameless One"                -> 568 records, all in book_05_the_nameless_one
"Man Who Flew Into The Sun"   -> 0 records anywhere in the corpus
```

These numbers describe the current-textual-evidence layer only. Zero
records for "Man Who Flew Into The Sun" is unsurprising and not
counter-evidence — hundreds of chapters have been rewritten, some
identity-chain links may only ever have existed in earlier drafts, and
some may be author canon that has never yet been re-exposed in current
prose at all. None of that bears on whether the persistent identity is
real.

**Revised finding:**

```text
The five-name chain is not disproven.

Its surviving registry representation lacks sufficient provenance to
distinguish author-established canon from extraction/inference — the
record gives no way to tell which of the six layers above any given
part of the chain actually rests on.
```

The architectural problem this exposes is provenance and layering, not
the chain itself. `entities.yaml` currently flattens "author canon,"
"derived inference," and "textual evidence" into one undifferentiated
`incarnation_chain` block with a single `authority` field — exactly the
structure that makes it impossible to tell, from the record alone,
whether any given link is something the author actually established or
something a tool guessed. Fixing that means the registry (or whatever
replaces it) needs to keep those layers distinguishable, not that the
chain needs to be re-proven or dropped.

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
   now: tested. Not disproven -- the chain may well be real
        author-established canon. What's actually broken is narrower:
        the registry record can't demonstrate whether any given link
        is author canon, derived inference, or draft-specific textual
        evidence, and its human-review claim can't be audited from
        what survives. That's a provenance/layering defect, not a
        false-identity defect.

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

Neither finding is about G1's scope, and the two are not the same shape
of problem. Test B's resolution is actively *contradicted* by cited
prose (the Aeon Keepers create the Nephoretti; the text says so
directly) — that's real evidence against a specific claim, not merely
absent evidence. Test A has no such contradiction; it has no
demonstrable evidence either way, which — for a persistent identity the
author may have established independently of any single chapter's
prose — is not the same thing as being wrong. What both share is a
provenance failure: neither record preserves enough information to
tell a reader (or Dragon) which of author canon, derived inference, or
textual citation it's actually resting on.

## Recommendation

G1 governs the textual-evidence layer and should stay the authority for
exactly that layer — what a specific passage in a specific version of a
chapter actually says, verifiable and reproducible. It has no business
being treated as the authority over author-established persistent
identity, which is a separate, higher layer that current prose is not
obligated to re-derive on demand. The right shape going forward is two
distinguishable layers, not one collapsed into the other:

```text
Persistent identity registry:
  "These otherwise separate story-facing identities are canonically
   the same being." (author/canon authority, may exceed what any
   current chapter's text alone can show)

G1 / textual-evidence layer:
  "Here is what this particular source passage actually establishes."
  (reproducible, citation-bound, silent about anything a passage
   doesn't say)

Dragon:
  can ask either layer, depending on which question it's actually
  asking — "is Geralt canonically the same being as Mr GPT" is a
  persistent-identity question; "does this chapter say so" is a G1
  question. They are different questions with different authorities,
  not one question G1 can settle by itself.
```

Concretely: `entities.yaml`'s `incarnation_chain` should keep existing
as an author/canon-level assertion — it should not be deleted, flattened
into "unproven," or forced to wait for G1 evidence before being trusted.
What it should stop doing is presenting itself as if it were already
audited the way a G1-backed claim is (the `authority: human_review` /
`needs_review: false` fields), when what actually survives is a record
with no way to show that audit happened. Whatever eventually replaces
or wraps `entities.yaml` needs to keep persistent-identity assertions
and textual-evidence citations as visibly separate fields, so a reader
can tell which authority any given part of an answer is actually
resting on.

`continuity_audit.py`'s output is a different case and the earlier
recommendation there stands unchanged: its one checkable decision
contradicts cited prose, and none of its 86 decisions can currently be
audited at all (the per-conflict evidence files don't exist). That
output should not be trusted as-is regardless of which layer it's
claiming to speak from.

Not run in this pass, deliberately: re-checking all 111 registry
entities' incarnation chains, or re-running `continuity_audit.py`
itself. This was a pressure test of two specific, previously-cited
examples, not a full re-audit.
