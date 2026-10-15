"""Attach offline model output to the demo samples in api/src/data/audio-samples.json.

    python ml/predict_manifest.py "<ICBHI_final_database folder>" --model cnn|svm [--split-file ...]

Run after tools/build_audio_manifest.py (which rewrites the manifest without model output).
Samples below the manifest's reject threshold are skipped, matching the API's rejection.
"""
import argparse
import json
import os
import sys

import joblib
import numpy as np
import torch

sys.path.insert(0, os.path.dirname(__file__))
import features as F  # noqa: E402
from cnn import SmallCNN  # noqa: E402
from train_baseline import load_cycles, make_split  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
MANIFEST = os.path.normpath(os.path.join(HERE, "..", "api", "src", "data", "audio-samples.json"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--model", choices=["cnn", "svm"], required=True)
    ap.add_argument("--artifacts", default=os.path.join(HERE, "artifacts"))
    ap.add_argument("--split-file")
    args = ap.parse_args()

    _, y, groups, meta, _ = load_cycles(args.folder, args.artifacts)
    test_mask, _, _ = make_split(groups, y, meta, args.split_file)
    train_patients = {int(p) for p in groups[~test_mask]}

    if args.model == "cnn":
        ck = torch.load(os.path.join(args.artifacts, "cnn.pt"), weights_only=False)
        net = SmallCNN()
        net.load_state_dict(ck["state_dict"])
        net.eval()
        version = ck["model_version"]
        metrics_file = "metrics_cnn.json"

        def predict(segs):
            x = torch.from_numpy(np.stack([F.cnn_input(s).astype(np.float32) for s in segs])).unsqueeze(1)
            with torch.no_grad():
                return net(x).argmax(1).numpy()
    else:
        ck = joblib.load(os.path.join(args.artifacts, "model.joblib"))
        version = ck["model_version"]
        metrics_file = "metrics.json"

        def predict(segs):
            return ck["model"].predict(np.stack([F.cycle_features(s) for s in segs]))

    with open(os.path.join(args.artifacts, metrics_file), encoding="utf-8") as fh:
        heldout_f1 = json.load(fh)["test"]["macro_f1"]

    with open(MANIFEST, encoding="utf-8") as fh:
        manifest = json.load(fh)

    for s in manifest["samples"]:
        s.pop("model", None)
        if s["sample_rate_hz"] < manifest["reject_below_hz"]:
            continue
        audio, _ = F.load_recording(os.path.join(args.folder, s["id"] + ".wav"))
        segs, truth = [], []
        for st, en, c, w in F.read_annotations(os.path.join(args.folder, s["id"] + ".txt")):
            seg = audio[int(st * F.TARGET_SR): int(en * F.TARGET_SR)]
            if F.quality_flags(seg):
                continue
            segs.append(seg)
            truth.append(F.label_of(c, w))
        pred = predict(segs)
        truth = np.array(truth)
        patient = int(s["id"].split("_")[0])
        s["model"] = {
            "model_version": version,
            "cycles_predicted": {F.CLASSES[k]: int((pred == k).sum()) for k in range(4)},
            "cycles_matching_annotation": int((pred == truth).sum()),
            "cycles": int(len(truth)),
            "in_training_data": patient in train_patients,
            "heldout_macro_f1": heldout_f1,
            "note": "Eksperimen offline pada siklus beranotasi; bukan diagnosis dan bukan inferensi mikrofon HP.",
        }
        print(s["id"], s["model"]["cycles_predicted"], f'{s["model"]["cycles_matching_annotation"]}/{s["model"]["cycles"]}',
              "train" if s["model"]["in_training_data"] else "heldout")

    with open(MANIFEST, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False)
    print("wrote", MANIFEST)


if __name__ == "__main__":
    main()
