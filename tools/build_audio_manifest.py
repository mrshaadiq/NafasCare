"""Build api/src/data/audio-samples.json from the local ICBHI 2017 folder.

Only metadata derived from the dataset's own annotation files is written. No audio
is copied, because redistribution terms are not verified. Run:

    python tools/build_audio_manifest.py "<path to ICBHI_final_database folder>"
"""
import json
import os
import sys
import wave

# Curated demo set: (sample id, why it is in the demo)
SAMPLES = [
    ("103_2b2_Ar_mc_LittC2SE", "wheeze pada anotasi"),
    ("107_2b3_Al_mc_AKGC417L", "crackle pada anotasi"),
    ("107_2b3_Ar_mc_AKGC417L", "crackle dan wheeze pada anotasi"),
    ("101_1b1_Al_sc_Meditron", "tanpa crackle/wheeze pada anotasi"),
]
REJECT_BELOW_HZ = 8000  # demo threshold, not validated
REJECT_EXAMPLES = 1  # how many <8 kHz recordings to include as rejection examples

SITE = {
    "Tc": "trakea", "Al": "anterior kiri", "Ar": "anterior kanan", "Pl": "posterior kiri",
    "Pr": "posterior kanan", "Ll": "lateral kiri", "Lr": "lateral kanan",
}


def summarise(folder, sid):
    with open(os.path.join(folder, sid + ".txt"), encoding="utf-8") as fh:
        cycles = [line.split() for line in fh if line.strip()]
    with wave.open(os.path.join(folder, sid + ".wav")) as w:
        rate, dur = w.getframerate(), w.getnframes() / w.getframerate()
    crackle = sum(1 for c in cycles if c[2] == "1")
    wheeze = sum(1 for c in cycles if c[3] == "1")
    both = sum(1 for c in cycles if c[2] == "1" and c[3] == "1")
    parts = sid.split("_")
    return {
        "id": sid,
        "device": parts[-1],
        "site": SITE.get(parts[2], parts[2]),
        "duration_s": round(dur, 1),
        "sample_rate_hz": rate,
        "cycles": len(cycles),
        "cycles_with_crackle": crackle,
        "cycles_with_wheeze": wheeze,
        "cycles_with_both": both,
    }


def main(folder):
    chosen = list(SAMPLES)
    # Add real files that fail the demo sample-rate rule, so rejection is shown on real data.
    extra = []
    for name in sorted(os.listdir(folder)):
        if len(extra) >= REJECT_EXAMPLES:
            break
        if not name.endswith(".wav"):
            continue
        sid = name[:-4]
        if not os.path.exists(os.path.join(folder, sid + ".txt")):
            continue
        with wave.open(os.path.join(folder, name)) as w:
            if w.getframerate() < REJECT_BELOW_HZ:
                extra.append((sid, "laju sampel di bawah ambang demo"))
    chosen += extra

    out = []
    for sid, note in chosen:
        row = summarise(folder, sid)
        row["note"] = note
        out.append(row)

    dest = os.path.join(os.path.dirname(__file__), "..", "api", "src", "data", "audio-samples.json")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "w", encoding="utf-8") as fh:
        json.dump(
            {
                "source": "ICBHI 2017 Respiratory Sound Database",
                "citation": "Rocha et al. 2019, Physiological Measurement 40 035001",
                "reject_below_hz": REJECT_BELOW_HZ,
                "samples": out,
            },
            fh,
            indent=2,
            ensure_ascii=False,
        )
    print("wrote", os.path.normpath(dest), len(out), "samples")


if __name__ == "__main__":
    main(sys.argv[1])
