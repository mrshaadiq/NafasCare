import type { AudioModelOutput, AudioPattern, AudioResult, AudioSampleInfo } from "../../../shared/types";
import { MODE } from "../../../shared/types";
import manifest from "../data/audio-samples.json";

interface ManifestSample extends AudioSampleInfo {
  cycles_with_crackle: number;
  cycles_with_wheeze: number;
  cycles_with_both: number;
  /** Written by `ml/predict_manifest.py`; absent when no model output was generated. */
  model?: AudioModelOutput;
}

const SAMPLES = manifest.samples as ManifestSample[];
const SOURCE_LABEL = `${manifest.source} (sampel riset; ${manifest.citation})`;

export const REJECT_BELOW_HZ = manifest.reject_below_hz;

export const listSamples = (): AudioSampleInfo[] =>
  SAMPLES.map(({ id, device, site, duration_s, sample_rate_hz, cycles, note }) => ({
    id,
    device,
    site,
    duration_s,
    sample_rate_hz,
    cycles,
    note,
  }));

const NOTICE_BASE =
  "Pola berasal dari anotasi dataset riset, bukan prediksi model dan bukan rekaman mikrofon HP. " +
  "Hasil audio tidak menurunkan arahan tanda bahaya.";

/**
 * Pure. The pattern is read from the dataset's own cycle labels. A recording below the demo
 * sample-rate threshold is rejected instead of being scored; the threshold is a draft value.
 */
export function describeSample(sampleId: string, screeningId: string, nowIso: string): AudioResult | null {
  const s = SAMPLES.find((x) => x.id === sampleId);
  if (!s) return null;

  const base = {
    screening_id: screeningId,
    sample_id: s.id,
    source: "anotasi-dataset" as const,
    source_label: SOURCE_LABEL,
    cycles: s.cycles,
    cycles_with_crackle: s.cycles_with_crackle,
    cycles_with_wheeze: s.cycles_with_wheeze,
    device: s.device,
    site: s.site,
    mode: MODE,
    created_at: nowIso,
  };

  if (s.sample_rate_hz < REJECT_BELOW_HZ) {
    return {
      ...base,
      model_version: null,
      model: null, // a rejected recording is not scored, by the model or otherwise
      status: "ditolak",
      rejection_reason: `Laju sampel ${s.sample_rate_hz} Hz di bawah ambang pemeriksaan demo (${REJECT_BELOW_HZ} Hz, belum divalidasi).`,
      pattern: null,
      notice: `${NOTICE_BASE} Rekaman ditolak, jadi tidak ada pola yang dilaporkan.`,
    };
  }

  const crackle = s.cycles_with_crackle > 0;
  const wheeze = s.cycles_with_wheeze > 0;
  const pattern: AudioPattern =
    crackle && wheeze ? "crackle-dan-wheeze" : crackle ? "crackle" : wheeze ? "wheeze" : "tidak-terdeteksi";

  const model = s.model ?? null;
  const modelNote = model
    ? ` Bidang "model" berisi keluaran eksperimen offline ${model.model_version} pada sampel riset ini; ` +
      `performanya masih rendah, belum divalidasi klinis, dan tidak dipakai oleh aturan triase.`
    : "";

  return {
    ...base,
    model_version: model?.model_version ?? null,
    model,
    status: "diterima",
    rejection_reason: null,
    pattern,
    notice:
      (pattern === "tidak-terdeteksi"
        ? `${NOTICE_BASE} Tidak adanya crackle atau wheeze pada anotasi bukan bukti bahwa pengguna sehat.`
        : NOTICE_BASE) + modelNote,
  };
}
