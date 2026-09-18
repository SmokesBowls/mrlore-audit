# mrlore-audit

Dedicated audit/investigation repo for the MrLore → G1 Lore Evidence
Kernel → UncleLore adapter line of work. Kept separate from the project
repos it audits (`onceaponatime`, `unclelore`) so that reconnaissance,
proof runs, and capability audits don't accumulate as noise inside
those repos' own history.

This repo does not implement anything on its own. It reads/exercises
systems that live elsewhere and records what was found.

## Dependencies (not vendored here)

- **G1 kernel** — `onceaponatime` repo, `g1-kernel-implementation`
  branch, `lore-evidence-kernel/src/index.ts`. Scripts in `scripts/`
  import it by absolute path; update that path if the checkout moves.
  Frozen contract: `onceaponatime`'s `G1_LORE_EVIDENCE_KERNEL_CONTRACT.md`.
- **UncleLore** — read-only clone of `github.com/SmokesBowls/unclelore`,
  expected at `/mnt/data-drive/unclelore`. Never written to.
- **Source prose** — the vault at
  `/home/mytruelove/Downloads/obsidianburdenNov25/New Folder/`.

## Layout

```text
reports/   dated markdown reports, one per audit/proof run
scripts/   the executable proof harnesses that produced them (tsx/TypeScript,
           run against the real G1 kernel — no mocking, no synthetic kernel)
```

## Reports so far

- `2026-09-18-unclelore-g1-adapter-recon.md` — reconnaissance: how
  UncleLore's existing data is actually stored, which layers carry real
  source citations, confirmed digest drift, confirmed a live same-name
  identity conflation, and the full UncleLore-field → G1-chain mapping.
- `2026-09-18-unclelore-g1-proof-set.md` — 3-case proof (Enlil A/B,
  Mika grave + Kyh provenance negative control, known-good Geralt) run
  against the real kernel.
- `2026-09-18-g1-proof-only-audit.md` — 10-case capability audit
  determining which known lore/identity failure classes G1 already
  solves on its own (no Ollama, no semantic model) versus which remain
  genuinely out of its scope.

## Running a script

```bash
tsx scripts/proof.ts
tsx scripts/proof_only_audit.ts
```

Requires a `tsx`/TypeScript toolchain reachable on `PATH` (or invoked
via its absolute path) and the dependencies above checked out at their
expected locations.
