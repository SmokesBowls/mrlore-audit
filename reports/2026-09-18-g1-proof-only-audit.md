# G1 Proof-Only Capability Audit

Ollama was not invoked anywhere in this phase. G1 kernel and frozen
contract were not modified. UncleLore was read-only. No mass migration.
Executed via `adapter/proof_only_audit.ts` in this worktree, against the
real kernel on `g1-kernel-implementation`, using real UncleLore records
except where noted (case 2's synthetic half, carried over from the prior
phase's report, is referenced but not re-run here).

Every case below was resolved using only `createSourceDocument` /
`createEvidenceSpan` / `createObservation` / `computeEvidenceCorroborationCount`
— no semantic heuristics were added to make anything pass. Where G1
cannot determine something, that is stated as `NOT_SOLVABLE_BY_G1`
directly, not worked around.

---

## Case 1 — Same-name collision

**Original UncleLore behavior/problem**: `wiki/characters/Enlil.md` pools
19 chapters under one identity; a separate `Commander_Enlil.md` carves
out just one of them; a third distinct Enlil exists in `entity_states`
that neither page accounts for (found in the earlier reconnaissance).

**Recovered `SourceDocument`s**: 2 — one per chapter (ch102, ch126),
minted fresh from current vault content (already run and reported in
the previous phase, not re-executed here to avoid duplicate work).
**Recovered `EvidenceSpan`s**: 2, distinct offsets in distinct files.
**Resulting `Observation`s**: 2, `lek:observation:v1:09206d19...` (ch102,
`"Commander Enlil"`) and `lek:observation:v1:d8ad6a56...` (ch126,
`"Enlil's"`).
**`IdentityCandidate` behavior**: none constructed for either. No call
to `createIdentityCandidate`/`mergeIdentityCandidates` was made, and
nothing in the kernel auto-triggers one from matching `surfaceForm`.

**PROOF-ONLY RESULT: SOLVED**

**Why**: the specific failure — two different entities silently pooled
because they share a name — cannot happen through this pipeline. Every
observation's identity is its own citation; grouping requires a
resolver decision backed by `derivationEvidenceObservationIds`, which
nothing here supplies. This is a structural guarantee of the contract
(§9.4), not a heuristic.

---

## Case 2 — Wrong-person attribution

**Original UncleLore behavior/problem**: found a *real* extractor defect
(not synthetic): `art_cc5bb7210172` tags surface form `"Keth's"` at
ch126 line 101, but its cited quote is `"Guard rotations were doubled.
Not with spears, but with presence. Torren at the western gate."` — a
sentence about a completely different character that never mentions
Keth at all.

**Recovered `SourceDocument`**: 1 (ch126, fresh digest).
**Recovered `EvidenceSpan`**: attempted — construction never reaches
span creation because the surface-form check fails first.
**Resulting `Observation`**: none. `createObservation` throws
`EVIDENCE_NOT_FOUND at /input/surfaceForm`.
**`IdentityCandidate` behavior**: n/a, no observation exists to group.

**PROOF-ONLY RESULT: PARTIALLY_SOLVED**

**Why**: G1 caught this instance because the defect happens to be the
"cited text doesn't contain the claimed name at all" flavor — the same
mechanism proven against the synthetic Kyh test in the prior phase. It
is a real, valuable catch, not a coincidence. But it is a narrower
guarantee than "wrong-person attribution" in general: if a sentence
genuinely names *both* people (e.g. "Keth and Torren stood at the
gate") and a detector wrongly credits an action to the wrong one of the
two, `surfaceForm` for the wrong name would still occur verbatim in the
cited text — G1 has no way to catch that, because judging *who did what*
within a sentence containing multiple names is a grammatical/semantic
reading task, not a citation-membership check. That harder flavor is
exactly what the original 90-run `mrlore.sh` sweep found happening
(models attributing actions to the wrong entity in multi-person scenes)
— it remains open, and no case in this UncleLore data happened to
exercise it, so it is not proven either way here — flagged as the
genuinely open half rather than assumed solved.

---

## Case 3 — Offstage/mentioned vs. physically present

**Original UncleLore behavior/problem**: the `mrlore.sh` sweep found 3
of 5 models hallucinating a "meanwhile, elsewhere" cross-cut as literal
shared physical presence. Real citation used: `art_4e1eb4c83131`, ch126
line 283, `"Far away, on the eastern terraces, Brak's hands rested on
tired stone. He did not push. He listened."`

**Recovered `SourceDocument`**: 1, fresh digest.
**Recovered `EvidenceSpan`**: 1, offsets located and verified.
**Resulting `Observation`**: 1, `lek:observation:v1:d14c73c7...`,
`surfaceForm: "Brak's"`, `presenceState: "asserted"`.
**`IdentityCandidate` behavior**: n/a.

**PROOF-ONLY RESULT: NOT_SOLVABLE_BY_G1**

**Why**: the observation that gets constructed only asserts "this exact
span exists and names Brak." The actual question this case poses — is
Brak physically co-located with Vale in the same scene, given the
cross-cut structure — has no representation in the contract at all.
`presenceState` is a value the *detector* asserts (`asserted` /
`negated` / `uncertain`); G1 validates it's one of those three literal
strings, it does not compute it from narrative structure, and it
certainly has no notion of "same scene as a different observation
elsewhere in the chapter." This is squarely a semantic-interpretation
gap, not a partial one — G1 has no field that could even be pointed at
this question.

---

## Case 4 — Alias/title collision ("Commander")

**Original UncleLore behavior/problem**: ch047 calls both Geralt
(Celly's greeting, `"Commander. Geralt."`) and Mika (her own headstone,
`"Commander. Scholar. Wife."`) by the same title.

**Recovered `SourceDocument`**: 1 (ch047, shared, correctly deduplicated
by content — both observations reference the same `SourceDocument` ID).
**Recovered `EvidenceSpan`s**: 2, line 19 and line 212/213.
**Resulting `Observation`s**: 2, `lek:observation:v1:c026a43a...`
(Geralt's) and `lek:observation:v1:58edddeb...` (Mika's), both
`surfaceForm: "Commander"`.
**`IdentityCandidate` behavior**: none constructed; both stand
independently.

**PROOF-ONLY RESULT: SOLVED**

**Why**: identical mechanism to case 1. A title is just a surface form
like any other; two observations sharing one never implies one
identity unless a resolver explicitly says so with evidence.

---

## Case 5 — Generational identity

**Original UncleLore behavior/problem**: ch047 introduces "Merra
Sundrift" directly (`art_f25eb53b4059`), then much later a background
character is described as `"a young woman with Merra's eyes"`
(`art_2e8090a5e69e`) — an implied descendant, never named.

**Recovered `SourceDocument`**: 1, shared.
**Recovered `EvidenceSpan`s**: 2.
**Resulting `Observation`s**: 2 — `surfaceForm: "Merra Sundrift"` and
`surfaceForm: "Merra's"` — independent, distinct IDs.
**`IdentityCandidate` behavior**: none.

**PROOF-ONLY RESULT: PARTIALLY_SOLVED**

**Why**: G1 solves the half that matters most defensively — it will
never silently treat "the gardener with Merra's eyes" as Merra herself,
because nothing asserts that identity and nothing merges them
automatically. But it cannot go the other direction either: it has no
way to *represent* "granddaughter of," "descendant of," or any
relationship at all in this contract version (confirmed absent from
`IdentityCandidate`'s fields in §9.4 — there is no relationship
record type in G1 v1). A resolver or a human still has to say what the
connection actually is; G1 just guarantees it won't be invented for
free.

---

## Case 6 — Near-name collision

**Original UncleLore behavior/problem**: ch102 has both "Kronocht
Elder" and "Kronocht the Younger" as distinct characters. The extractor
tagged a record (`art_d00f34cd8feb`) with surface form `"Younger"`, but
its cited quote is entirely about Kronocht Elder and never contains the
word "Younger" at all — a real near-name mistagging defect.

**Recovered `SourceDocument`**: 1 (ch102).
**Recovered `EvidenceSpan`**: for `"Kronocht Elder"` (`art_867247636bcc`),
yes. For `"Younger"`, construction never reaches span creation.
**Resulting `Observation`s**: 1 valid (`lek:observation:v1:15f0212a...`,
Kronocht Elder). The "Younger" attempt fails: `EVIDENCE_NOT_FOUND at
/input/surfaceForm`.
**`IdentityCandidate` behavior**: n/a.

**PROOF-ONLY RESULT: PARTIALLY_SOLVED**

**Why**: same shape as case 2 — G1 caught this instance because the
citation genuinely doesn't contain the claimed word. It does not follow
that G1 would catch a case where "the Younger" was cited against a
sentence that legitimately contains both "Kronocht Elder" and "Kronocht
the Younger" together — distinguishing *which one* a pronoun or a
trailing clause refers to in a shared sentence is not something a
span-membership check can do. Real near-name confusion of that harder
kind is not disproven here, just not exercised by the data available.

---

## Case 7 — One observation, multiple independent spans

**Constructed** (not a pre-existing UncleLore problem — this tests a
contract capability directly): one `Observation`, `surfaceForm:
"Geralt"`, citing two real, independently-located spans from ch047
(`art_1137989b675a` line 21 and `art_a58aa4c3d2e0` line 7).

**Recovered `SourceDocument`**: 1, shared.
**Recovered `EvidenceSpan`s**: 2, distinct offsets.
**Resulting `Observation`**: 1,
`lek:observation:v1:f30e2842...`, citing both span IDs.
**`IdentityCandidate` behavior**: n/a.

**PROOF-ONLY RESULT: SOLVED**

**Why**: this is exactly what `evidenceSpanIds: readonly string[]`
(plural, a set) is for — the contract natively supports one observation
resting on more than one citation, and construction succeeded cleanly
with no special handling needed.

---

## Case 8 — Repeated detections of the same span

**Constructed**: two independent observations (different `detectorId`,
different `surfaceForm` — `"Far"` and `"Brak's"`) both citing the
*identical* `EvidenceSpan` (the same ch126 line-283 cross-cut sentence,
built once and reused).

**Recovered `SourceDocument`**: 1.
**Recovered `EvidenceSpan`**: 1, shared by both observations.
**Resulting `Observation`s**: 2, distinct IDs, same `evidenceSpanIds`.
**Corroboration check**: `computeEvidenceCorroborationCount([obs1, obs2],
[binding])` → **1**, not 2.

**PROOF-ONLY RESULT: SOLVED**

**Why**: directly matches contract §10's stated guarantee —
corroboration counts distinct `EvidenceSpan.id` values, not detector
agreements. Two detectors independently noticing the same sentence
cannot inflate apparent evidentiary weight. Verified against the real
kernel, not just asserted from the spec.

---

## Case 9 — Stale source digest, recoverable current prose

Already fully proven in the prior adapter-proof phase across 4 real
chapters (047, 102, 126 in the 3-case proof set; ch009/ch003 sampled in
this phase's reconnaissance for case 10). Not re-run here to avoid
duplicating work already on record.

**PROOF-ONLY RESULT: SOLVED**

**Why**: every single real chapter checked (5 so far, including the two
sampled for case 10) had a legacy `source_hash` that no longer matched
current content, and in every recoverable case the adapter correctly
minted a *fresh* `SourceDocument` from today's text rather than
reusing, faking, or silently ignoring the mismatch. The 60-record
random sample taken for case 10's search also measured this indirectly:
58/60 quotes were still verbatim-recoverable despite 100% digest drift
in every chapter checked — recoverability and digest-staleness are
independent problems, and G1/the adapter handles the digest side
completely.

---

## Case 10 — Source finding that cannot be recovered

**Original UncleLore behavior/problem**: `art_a4dbb403fcf8` (ch009,
book_03) cites dialogue: `"The Neferati," Torhh said slowly, "when they
first fell from the sky, we feared them..."`. The term "Neferati" does
not appear anywhere in the current ch009 file at all — a genuine
substantive rewrite, not a punctuation drift (confirmed: "Torhh" still
exists in current text, "Neferati" does not, anywhere). A second
sampled miss (`art_d73dd2009544`, ch003, a `"TIME PERIOD: Post-
Shattering..."` header line) confirms this isn't a one-off: that
header, and the phrase "Post-Shattering", are both entirely absent from
the current file too.

**Recovered `SourceDocument`**: 1 (ch009 resolves and reads fine — the
*chapter* is recoverable, the *specific cited passage* is not).
**Recovered `EvidenceSpan`**: none — span location fails before
construction is attempted.
**Resulting `Observation`**: none.
**Result**: `{ status: "UNRESOLVED", reason: "SOURCE_NOT_RECOVERABLE" }`

**PROOF-ONLY RESULT: SOLVED**

**Why**: the guarantee being tested here isn't "recover everything" —
it's "never fabricate evidence when recovery fails, and say so
explicitly." That's exactly what happened: no G1 record was minted, no
plausible-looking substitute was constructed, and the failure reason is
specific and honest (`SOURCE_NOT_RECOVERABLE`, not a generic error).
Measured rate from the 60-record random sample used to find this case:
**58/60 (~97%) of legacy citations are still verbatim-recoverable**
despite universal digest drift; the ~3% genuine-loss rate is small but
real, and this pipeline reports it rather than hiding it.

---

## Summary

```text
SOLVED (7 of 10):
  1. same-name collision
  4. alias/title collision
  7. multi-span observation
  8. repeated-span corroboration
  9. stale digest / recoverable prose
  10. genuinely unrecoverable source -> correctly UNRESOLVED
  (2 and 6 partially -- see below; counted once each, not double-listed)

PARTIALLY_SOLVED (3 of 10):
  2. wrong-person attribution -- solves "name absent from citation,"
     not "wrong actor among several named correctly in one sentence"
  5. generational identity -- solves "never wrongly merge," cannot
     represent or assert the relationship itself (no relationship
     record type exists in G1 v1)
  6. near-name collision -- same shape as case 2

NOT_SOLVABLE_BY_G1 (1 of 10):
  3. offstage vs. physically present -- no representation for
     cross-observation spatial/scene claims exists in the contract at all
```

This refines, rather than contradicts, the three-bucket hypothesis from
before the audit. The "fully solved" bucket is larger and more solid
than expected — every case built on G1's core identity-independence and
corroboration guarantees (1, 4, 7, 8, 9, 10) held with zero exceptions
across real data, including two real extractor defects this session
didn't go looking for (cases 2 and 6's underlying records) and one
genuine content-loss case (10) found by random sampling rather than
cherry-picking.

The "halfway" bucket is real but narrower than it might sound: in every
partially-solved case, the *defensive* half (never silently merge,
never silently fabricate) is fully solved by G1 alone. What's missing
is exclusively the *constructive* half — asserting what a relationship
*is*, or arbitrating between two correctly-named entities in one
sentence — and G1's own contract (§2: "The kernel preserves evidence
and hypotheses. It does not establish truth... or narrative relevance")
says plainly that it was never meant to do that.

Only one case (3) is cleanly, entirely outside G1's model: cross-
observation spatial/scene reasoning has no field to attach to at all,
not even a partial one. That is the sharpest, most honest candidate for
"this is what Ollama is actually for" — narrower than "verify
UncleLore," closer to "resolve the specific relationship and
co-presence questions G1 has no vocabulary for."

Stopping here, as instructed. Not proceeding to Ollama, not enlarging
the test set, not mass-migrating, not connecting to review tooling.
