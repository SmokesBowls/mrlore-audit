import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  createEvidenceSpan,
  createObservation,
  createSourceDocument,
  KernelContractError,
} from '/mnt/data-drive/onceaponatime-g1-impl/lore-evidence-kernel/src/index.ts';
// ^ path assumption documented in README.md: this repo audits the G1 kernel
// living in the onceaponatime repo (g1-kernel-implementation branch); it does
// not vendor a copy. Adjust this path if that checkout moves.

const ARTIFACT_BATCH = '/mnt/data-drive/unclelore/raw/artifacts/batch_20260518_214757.jsonl';

const CHAPTER_TO_CURRENT_FILE: Record<string, string> = {
  book_08_the_vigil_of_the_anchor_ch047:
    '/home/mytruelove/Downloads/obsidianburdenNov25/New Folder/book_08_the_vigil_of_the_anchor/047_mika.md',
  book_19_worthy_opponents_north_ch102:
    '/home/mytruelove/Downloads/obsidianburdenNov25/New Folder/book_19_worthy_opponents_north/102_convergence_on_mars.md',
  book_25_the_seam_evolutionary_south_ch126:
    '/home/mytruelove/Downloads/obsidianburdenNov25/New Folder/book_25_the_seam_evolutionary_south/126_i_am_island.txt',
};

type ArtifactRecord = {
  readonly artifact_id: string;
  readonly surface_form: string;
  readonly source_line: number;
  readonly source_span: string;
  readonly chapter: string;
  readonly chronological_order: number;
  readonly surrounding_quote: string;
  readonly extractor_id: string;
  readonly extraction_timestamp: string;
  readonly source_file: string;
  readonly source_hash: string;
  readonly audit_only: boolean;
  readonly provisional: boolean;
};

function loadArtifact(artifactId: string): ArtifactRecord {
  const lines = readFileSync(ARTIFACT_BATCH, 'utf8').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const record = JSON.parse(line) as ArtifactRecord;
    if (record.artifact_id === artifactId) return record;
  }
  throw new Error(`artifact not found: ${artifactId}`);
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

type CaseResult = {
  readonly caseName: string;
  readonly legacyArtifactId: string;
  readonly legacySourceReference: string;
  readonly currentRecoveredSourceFile: string | null;
  readonly legacyDigestMatch: boolean | null;
  readonly sourceRecoveredFromCurrentVault: boolean;
  readonly exactRecoveredSpan: string | null;
  readonly startOffset: number | null;
  readonly endOffset: number | null;
  readonly matchCount: number | null;
  readonly newSourceDocumentId: string | null;
  readonly newEvidenceSpanId: string | null;
  readonly newObservationId: string | null;
  readonly status: 'MIGRATED' | 'UNRESOLVED' | 'REJECTED_BY_G1';
  readonly reason: string;
};

function runCase(
  caseName: string,
  artifactId: string,
  surfaceFormOverride: string | undefined,
  quoteOverride: string | undefined,
): CaseResult {
  const record = loadArtifact(artifactId);
  const surfaceForm = surfaceFormOverride ?? record.surface_form;
  const quote = quoteOverride ?? record.surrounding_quote;
  const legacySourceReference = `${record.source_file} @ line ${record.source_line} (hash ${record.source_hash})`;

  const currentFilePath = CHAPTER_TO_CURRENT_FILE[record.chapter];
  if (!currentFilePath) {
    return {
      caseName, legacyArtifactId: artifactId, legacySourceReference,
      currentRecoveredSourceFile: null, legacyDigestMatch: null,
      sourceRecoveredFromCurrentVault: false, exactRecoveredSpan: null,
      startOffset: null, endOffset: null, matchCount: null,
      newSourceDocumentId: null, newEvidenceSpanId: null, newObservationId: null,
      status: 'UNRESOLVED', reason: 'SOURCE_NOT_RECOVERABLE (no current-vault mapping for chapter)',
    };
  }

  let currentText: string;
  try {
    currentText = readFileSync(currentFilePath, 'utf8');
  } catch {
    return {
      caseName, legacyArtifactId: artifactId, legacySourceReference,
      currentRecoveredSourceFile: currentFilePath, legacyDigestMatch: null,
      sourceRecoveredFromCurrentVault: false, exactRecoveredSpan: null,
      startOffset: null, endOffset: null, matchCount: null,
      newSourceDocumentId: null, newEvidenceSpanId: null, newObservationId: null,
      status: 'UNRESOLVED', reason: 'SOURCE_NOT_RECOVERABLE (current vault file missing)',
    };
  }

  const currentDigest = sha256Hex(currentText);
  const legacyDigestMatch = currentDigest === record.source_hash;

  const startOffset = currentText.indexOf(quote);
  const matchCount = startOffset === -1 ? 0 : currentText.split(quote).length - 1;

  if (startOffset === -1) {
    return {
      caseName, legacyArtifactId: artifactId, legacySourceReference,
      currentRecoveredSourceFile: currentFilePath, legacyDigestMatch,
      sourceRecoveredFromCurrentVault: true, exactRecoveredSpan: null,
      startOffset: null, endOffset: null, matchCount: 0,
      newSourceDocumentId: null, newEvidenceSpanId: null, newObservationId: null,
      status: 'UNRESOLVED', reason: 'SOURCE_NOT_RECOVERABLE (cited quote not found verbatim in current text)',
    };
  }
  if (matchCount > 1) {
    return {
      caseName, legacyArtifactId: artifactId, legacySourceReference,
      currentRecoveredSourceFile: currentFilePath, legacyDigestMatch,
      sourceRecoveredFromCurrentVault: true, exactRecoveredSpan: quote,
      startOffset, endOffset: startOffset + quote.length, matchCount,
      newSourceDocumentId: null, newEvidenceSpanId: null, newObservationId: null,
      status: 'UNRESOLVED', reason: 'AMBIGUOUS_SPAN_LOCATION (quote occurs more than once in current text)',
    };
  }
  const endOffset = startOffset + quote.length;

  try {
    const source = createSourceDocument({
      projectId: 'unclelore-recon',
      documentKey: record.chapter,
      exactText: currentText,
    });
    const span = createEvidenceSpan({
      sourceDocumentId: source.id,
      startOffset,
      endOffset,
      exactText: quote,
      extractorId: 'unclelore-adapter-proof',
      extractorVersion: '0.1.0',
    }, source);
    const observation = createObservation({
      kind: 'unclelore:mention',
      surfaceForm,
      presenceState: 'asserted',
      scope: { scopeKind: 'unclelore:chapter', scopeId: record.chapter },
      sequencePosition: { streamId: record.chapter, ordinal: record.chronological_order },
      evidenceSpanIds: [span.id],
      detectorId: 'unclelore-adapter-proof',
      detectorVersion: '0.1.0',
      detectorMode: 'deterministic',
      languageProfile: 'en',
    }, [{ span, source }]);

    return {
      caseName, legacyArtifactId: artifactId, legacySourceReference,
      currentRecoveredSourceFile: currentFilePath, legacyDigestMatch,
      sourceRecoveredFromCurrentVault: true, exactRecoveredSpan: quote,
      startOffset, endOffset, matchCount,
      newSourceDocumentId: source.id, newEvidenceSpanId: span.id, newObservationId: observation.id,
      status: 'MIGRATED', reason: 'ok',
    };
  } catch (error) {
    const kernelError = error as InstanceType<typeof KernelContractError>;
    const reason = kernelError instanceof KernelContractError
      ? `${kernelError.code} at ${kernelError.path}`
      : String(error);
    return {
      caseName, legacyArtifactId: artifactId, legacySourceReference,
      currentRecoveredSourceFile: currentFilePath, legacyDigestMatch,
      sourceRecoveredFromCurrentVault: true, exactRecoveredSpan: quote,
      startOffset, endOffset, matchCount,
      newSourceDocumentId: null, newEvidenceSpanId: null, newObservationId: null,
      status: 'REJECTED_BY_G1', reason,
    };
  }
}

const results: CaseResult[] = [];

results.push(runCase('1a. Enlil A (ch102, Commander)', 'art_aa5e2cc7e12f', undefined, undefined));
results.push(runCase('1b. Enlil B (ch126, First Shore engineer)', 'art_099e208aa295', undefined, undefined));
results.push(runCase('2a. Mika grave (real)', 'art_1ede6aa7f907', undefined, undefined));
results.push(runCase('2b. Provenance negative control (Kyh cited against MIKA COVENANT span)', 'art_1ede6aa7f907', 'Kyh', undefined));
results.push(runCase('3. Known-good Geralt', 'art_1137989b675a', undefined, undefined));

console.log(JSON.stringify(results, null, 2));
