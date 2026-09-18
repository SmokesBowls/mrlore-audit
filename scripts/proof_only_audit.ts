import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  computeEvidenceCorroborationCount,
  createEvidenceSpan,
  createObservation,
  createSourceDocument,
  KernelContractError,
  type EvidenceBinding,
  type EvidenceSpan,
  type Observation,
  type SourceDocument,
} from '/mnt/data-drive/onceaponatime-g1-impl/lore-evidence-kernel/src/index.ts';
// ^ path assumption documented in README.md: this repo audits the G1 kernel
// living in the onceaponatime repo (g1-kernel-implementation branch); it does
// not vendor a copy. Adjust this path if that checkout moves.

const ARTIFACT_BATCH = '/mnt/data-drive/unclelore/raw/artifacts/batch_20260518_214757.jsonl';
const VAULT_ROOT = '/home/mytruelove/Downloads/obsidianburdenNov25/New Folder';

type ArtifactRecord = {
  readonly artifact_id: string;
  readonly surface_form: string;
  readonly source_line: number;
  readonly chapter: string;
  readonly chronological_order: number;
  readonly surrounding_quote: string;
  readonly source_hash: string;
};

let artifactCache: ArtifactRecord[] | null = null;
function loadArtifacts(): ArtifactRecord[] {
  if (artifactCache) return artifactCache;
  artifactCache = readFileSync(ARTIFACT_BATCH, 'utf8')
    .split('\n').filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as ArtifactRecord);
  return artifactCache;
}

function byId(artifactId: string): ArtifactRecord {
  const record = loadArtifacts().find((item) => item.artifact_id === artifactId);
  if (!record) throw new Error(`artifact not found: ${artifactId}`);
  return record;
}

function resolveChapterFile(chapter: string): string | null {
  const match = /^(book_\d+_.+)_ch(\d+)$/.exec(chapter);
  if (!match) return null;
  const [, bookPart, num] = match;
  for (const bookDir of readdirSync(VAULT_ROOT)) {
    if (bookDir === bookPart || bookDir.startsWith(bookPart!)) {
      const full = join(VAULT_ROOT, bookDir);
      for (const file of readdirSync(full)) {
        if (file.startsWith(`${num}_`)) return join(full, file);
      }
    }
  }
  return null;
}

function sourceDocumentFor(chapter: string): { source: SourceDocument; text: string } | null {
  const path = resolveChapterFile(chapter);
  if (!path) return null;
  const text = readFileSync(path, 'utf8');
  const source = createSourceDocument({ projectId: 'g1-proof-only-audit', documentKey: chapter, exactText: text });
  return { source, text };
}

function locateSpan(text: string, quote: string): { start: number; end: number; matchCount: number } {
  const start = text.indexOf(quote);
  if (start === -1) return { start: -1, end: -1, matchCount: 0 };
  const matchCount = text.split(quote).length - 1;
  return { start, end: start + quote.length, matchCount };
}

function spanFor(source: SourceDocument, text: string, quote: string): EvidenceSpan | { unresolved: string } {
  const { start, end, matchCount } = locateSpan(text, quote);
  if (start === -1) return { unresolved: 'SOURCE_NOT_RECOVERABLE (quote not found verbatim in current text)' };
  if (matchCount > 1) return { unresolved: 'AMBIGUOUS_SPAN_LOCATION (quote occurs more than once)' };
  return createEvidenceSpan({
    sourceDocumentId: source.id, startOffset: start, endOffset: end, exactText: quote,
    extractorId: 'g1-proof-only-audit', extractorVersion: '0.1.0',
  }, source);
}

function tryObservation(
  surfaceForm: string,
  chapter: string,
  ordinal: number,
  spans: readonly EvidenceSpan[],
  bindings: readonly EvidenceBinding[],
  detectorId = 'g1-proof-only-audit',
): { ok: true; observation: Observation } | { ok: false; error: string } {
  try {
    const observation = createObservation({
      kind: 'unclelore:mention', surfaceForm, presenceState: 'asserted',
      scope: { scopeKind: 'unclelore:chapter', scopeId: chapter },
      sequencePosition: { streamId: chapter, ordinal },
      evidenceSpanIds: spans.map((s) => s.id),
      detectorId, detectorVersion: '0.1.0', detectorMode: 'deterministic', languageProfile: 'en',
    }, bindings);
    return { ok: true, observation };
  } catch (error) {
    const e = error as InstanceType<typeof KernelContractError>;
    return { ok: false, error: e instanceof KernelContractError ? `${e.code} at ${e.path}` : String(error) };
  }
}

function line(s: string) { console.log(s); }
function hr(title: string) { console.log(`\n===== ${title} =====`); }

// ---------------------------------------------------------------------
// CASE 2: wrong-person attribution -- real UncleLore extractor defect
// ---------------------------------------------------------------------
hr('CASE 2: wrong-person attribution (real defect, not synthetic)');
{
  const rec = byId('art_cc5bb7210172'); // claims surface_form "Keth's", quote is actually about Torren
  const built = sourceDocumentFor(rec.chapter);
  if (!built) { line('source not recoverable'); }
  else {
    const { source, text } = built;
    const span = spanFor(source, text, rec.surrounding_quote);
    line(`legacy claim: surfaceForm=${JSON.stringify(rec.surface_form)} at ${rec.chapter}:${rec.source_line}`);
    line(`cited quote: ${JSON.stringify(rec.surrounding_quote)}`);
    if ('unresolved' in span) { line(`UNRESOLVED: ${span.unresolved}`); }
    else {
      const result = tryObservation(rec.surface_form, rec.chapter, rec.chronological_order, [span], [{ span, source }]);
      line(result.ok
        ? `MIGRATED (unexpected) observation=${result.observation.id}`
        : `REJECTED_BY_G1: ${result.error}`);
    }
  }
}

// ---------------------------------------------------------------------
// CASE 3: offstage/mentioned vs. physically present -- Brak cross-cut
// ---------------------------------------------------------------------
hr('CASE 3: offstage vs. physically present (Brak cross-cut)');
{
  const rec = byId('art_4e1eb4c83131'); // surface "Brak's", the cross-cut line
  const built = sourceDocumentFor(rec.chapter)!;
  const { source, text } = built;
  const span = spanFor(source, text, rec.surrounding_quote);
  line(`quote: ${JSON.stringify(rec.surrounding_quote)}`);
  if ('unresolved' in span) line(`UNRESOLVED: ${span.unresolved}`);
  else {
    const result = tryObservation(rec.surface_form, rec.chapter, rec.chronological_order, [span], [{ span, source }]);
    line(result.ok
      ? `MIGRATED: observation=${result.observation.id} -- this only asserts "Brak's hands rested on tired stone" is attested at this exact span.`
      : `REJECTED_BY_G1: ${result.error}`);
    line('G1 has no field or mechanism to assert/refute "same scene as Vale" -- that is a claim ABOUT the relationship between two separate observations, which v1 does not model at all.');
  }
}

// ---------------------------------------------------------------------
// CASE 4: alias/title collision -- "Commander" = Geralt AND Mika
// ---------------------------------------------------------------------
hr('CASE 4: alias/title collision ("Commander")');
{
  const geraltRec = byId('art_1264bd6d6203');
  const mikaRec = byId('art_ce4b6f1b86df');
  const built = sourceDocumentFor(geraltRec.chapter)!; // same chapter for both
  const { source, text } = built;
  for (const rec of [geraltRec, mikaRec]) {
    const span = spanFor(source, text, rec.surrounding_quote);
    if ('unresolved' in span) { line(`${rec.artifact_id}: UNRESOLVED ${span.unresolved}`); continue; }
    const result = tryObservation('Commander', rec.chapter, rec.chronological_order, [span], [{ span, source }]);
    line(result.ok
      ? `${rec.artifact_id} (line ${rec.source_line}): MIGRATED observation=${result.observation.id}`
      : `${rec.artifact_id}: REJECTED_BY_G1 ${result.error}`);
  }
  line('Both "Commander" observations coexist with distinct IDs; nothing forces them to the same identity.');
}

// ---------------------------------------------------------------------
// CASE 5: generational identity -- Merra vs. "a young woman with Merra's eyes"
// ---------------------------------------------------------------------
hr('CASE 5: generational identity (Merra vs. implied descendant)');
{
  const merraRec = byId('art_f25eb53b4059');
  const eyesRec = byId('art_2e8090a5e69e');
  const built = sourceDocumentFor(merraRec.chapter)!;
  const { source, text } = built;
  for (const rec of [merraRec, eyesRec]) {
    const span = spanFor(source, text, rec.surrounding_quote);
    if ('unresolved' in span) { line(`${rec.artifact_id}: UNRESOLVED ${span.unresolved}`); continue; }
    const result = tryObservation(rec.surface_form, rec.chapter, rec.chronological_order, [span], [{ span, source }]);
    line(result.ok
      ? `${rec.artifact_id} surfaceForm=${JSON.stringify(rec.surface_form)}: MIGRATED observation=${result.observation.id}`
      : `${rec.artifact_id}: REJECTED_BY_G1 ${result.error}`);
  }
  line('The second observation never names a person -- surfaceForm is "Merra\'s" (a possessive trait mention), not a claim of identity with Merra herself. G1 keeps them separate by construction; it has no way to assert or deny "this is her granddaughter" either way.');
}

// ---------------------------------------------------------------------
// CASE 6: near-name collision -- "Kronocht Elder" vs. "Younger" mistag
// ---------------------------------------------------------------------
hr('CASE 6: near-name collision (Kronocht Elder vs. "the Younger")');
{
  const elderRec = byId('art_867247636bcc'); // surface "Kronocht Elder", genuinely in its own quote
  const youngerRec = byId('art_d00f34cd8feb'); // surface "Younger", but cited quote is about Kronocht Elder, never says "Younger"
  const built = sourceDocumentFor(elderRec.chapter)!;
  const { source, text } = built;
  for (const rec of [elderRec, youngerRec]) {
    const span = spanFor(source, text, rec.surrounding_quote);
    if ('unresolved' in span) { line(`${rec.artifact_id}: UNRESOLVED ${span.unresolved}`); continue; }
    const result = tryObservation(rec.surface_form, rec.chapter, rec.chronological_order, [span], [{ span, source }]);
    line(result.ok
      ? `${rec.artifact_id} surfaceForm=${JSON.stringify(rec.surface_form)}: MIGRATED observation=${result.observation.id}`
      : `${rec.artifact_id} surfaceForm=${JSON.stringify(rec.surface_form)}: REJECTED_BY_G1 ${result.error}`);
  }
}

// ---------------------------------------------------------------------
// CASE 7: one observation, multiple independent spans
// ---------------------------------------------------------------------
hr('CASE 7: one observation supported by multiple independent spans');
{
  const recA = byId('art_1137989b675a'); // "We did," Geralt said...
  const recB = byId('art_a58aa4c3d2e0'); // Geralt walked at the head...
  const built = sourceDocumentFor(recA.chapter)!;
  const { source, text } = built;
  const spanA = spanFor(source, text, recA.surrounding_quote);
  const spanB = spanFor(source, text, recB.surrounding_quote);
  if ('unresolved' in spanA || 'unresolved' in spanB) {
    line('one or both spans unresolved');
  } else {
    const result = tryObservation('Geralt', recA.chapter, recA.chronological_order, [spanA, spanB], [{ span: spanA, source }, { span: spanB, source }]);
    line(result.ok
      ? `MIGRATED: observation=${result.observation.id} citing 2 evidenceSpanIds: [${result.observation.evidenceSpanIds.join(', ')}]`
      : `REJECTED_BY_G1: ${result.error}`);
  }
}

// ---------------------------------------------------------------------
// CASE 8: repeated detections of the same span -- corroboration must not inflate
// ---------------------------------------------------------------------
hr('CASE 8: repeated detections of the identical span');
{
  const recFar = byId('art_d74f55993396'); // surface "Far"
  const recBrak = byId('art_4e1eb4c83131'); // surface "Brak's" -- SAME quote/line as recFar
  const built = sourceDocumentFor(recFar.chapter)!;
  const { source, text } = built;
  const span = spanFor(source, text, recFar.surrounding_quote); // build the span once
  if ('unresolved' in span) { line(`UNRESOLVED: ${span.unresolved}`); }
  else {
    const binding: EvidenceBinding = { span, source };
    const obs1 = tryObservation('Far', recFar.chapter, recFar.chronological_order, [span], [binding], 'detector-A');
    const obs2 = tryObservation('Brak’s', recBrak.chapter, recBrak.chronological_order, [span], [binding], 'detector-B');
    if (obs1.ok && obs2.ok) {
      const count = computeEvidenceCorroborationCount([obs1.observation, obs2.observation], [binding]);
      line(`two independent observations cite the SAME EvidenceSpan (${span.id})`);
      line(`computeEvidenceCorroborationCount => ${count} (must be 1, not 2)`);
    } else {
      line(`obs1: ${obs1.ok ? 'ok' : obs1.error}, obs2: ${obs2.ok ? 'ok' : obs2.error}`);
    }
  }
}

// ---------------------------------------------------------------------
// CASE 10: genuinely unrecoverable source
// ---------------------------------------------------------------------
hr('CASE 10: source finding that cannot be recovered');
{
  const rec = byId('art_a4dbb403fcf8'); // "Neferati" -- term no longer exists in current ch009 text at all
  const built = sourceDocumentFor(rec.chapter);
  if (!built) { line('UNRESOLVED: SOURCE_NOT_RECOVERABLE (no current-vault mapping for chapter)'); }
  else {
    const { source, text } = built;
    line(`legacy quote: ${JSON.stringify(rec.surrounding_quote)}`);
    line(`current source digest: ${source.sourceDigest.slice(0, 16)}... (legacy hash: ${rec.source_hash.slice(0, 16)}..., match=${source.sourceDigest === rec.source_hash})`);
    const span = spanFor(source, text, rec.surrounding_quote);
    if ('unresolved' in span) line(`UNRESOLVED: ${span.unresolved}`);
    else line('unexpectedly recoverable');
  }
}
