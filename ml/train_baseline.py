"""MFCC + SVM baseline for ICBHI cycle classification (normal / crackle / wheeze / both).

    python ml/train_baseline.py "<ICBHI_final_database folder>" [--out ml/artifacts]

Split policy (no official ICBHI split file or demographics are available locally):
  1. Patients (not cycles) are split once into train / held-out test, fixed seed.
  2. Hyperparameters are chosen by GroupKFold on the train patients only.
  3. The held-out test patients are scored once, after the configuration is locked.
"""
import argparse
import json
import os
import sys
import time

import joblib
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

sys.path.insert(0, os.path.dirname(__file__))
import features as F  # noqa: E402

SEED = 42
TEST_FRACTION = 0.2
GRID = [(c, g) for c in (0.1, 0.3, 1.0, 10.0) for g in ("scale", 0.01)]


def make_model(c, gamma):
    return make_pipeline(
        StandardScaler(),  # fitted inside the pipeline, so on train data only
        SVC(C=c, gamma=gamma, kernel="rbf", class_weight="balanced", random_state=SEED),
    )


def patient_split(groups, y, seed=SEED, frac=TEST_FRACTION):
    """Random patient split that keeps rare classes present in test."""
    patients = np.unique(groups)
    rng = np.random.default_rng(seed)
    for _ in range(200):
        test_p = set(rng.choice(patients, size=max(1, int(round(len(patients) * frac))), replace=False))
        mask = np.array([g in test_p for g in groups])
        if all((y[mask] == k).sum() >= 20 for k in range(4)) and all((y[~mask] == k).sum() >= 100 for k in range(4)):
            return mask, sorted(int(p) for p in test_p)
    raise RuntimeError("no patient split with all classes represented")


def make_split(groups, y, meta, split_file=None):
    """Return (test_mask, test_patients, description).

    With the official ICBHI file ("<recording stem>\\t<train|test>" per line) the official
    split is used. Official recordings of one patient never straddle the split.
    """
    if not split_file:
        mask, patients = patient_split(groups, y)
        return mask, patients, "patient-level random, seed=%d, test_fraction=%.2f; tanpa file split resmi" % (SEED, TEST_FRACTION)
    side = {}
    with open(split_file, encoding="utf-8") as fh:
        for line in fh:
            p = line.split()
            if len(p) >= 2:
                side[os.path.splitext(p[0])[0]] = p[1].lower()
    mask = np.array([side.get(m["file"]) == "test" for m in meta])
    unknown = sorted({m["file"] for m in meta if m["file"] not in side})
    if unknown:
        raise SystemExit(f"{len(unknown)} rekaman tidak ada di file split, contoh: {unknown[:3]}")
    both = set(groups[mask]) & set(groups[~mask])
    if both:
        raise SystemExit(f"pasien di train dan test sekaligus: {sorted(both)[:5]}")
    return mask, sorted(int(p) for p in set(groups[mask])), "split resmi ICBHI (%s)" % os.path.basename(split_file)


def load_cycles(folder, out):
    """Cached MFCC features: X, y, groups, meta, rejected."""
    cache = os.path.join(out, "features.npz")
    if os.path.exists(cache):
        z = np.load(cache, allow_pickle=True)
        return z["X"], z["y"], z["groups"], z["meta"].tolist(), z["rejected"].tolist()
    print("ekstraksi fitur MFCC ...")
    X, y, groups, meta, rejected = F.build_dataset(folder)
    np.savez_compressed(cache, X=X, y=y, groups=groups,
                        meta=np.array(meta, dtype=object), rejected=np.array(rejected, dtype=object))
    return X, y, groups, meta, rejected


def describe(y):
    return {F.CLASSES[k]: int((y == k).sum()) for k in range(4)}


def abnormal_metrics(y_true, y_pred):
    t, p = y_true > 0, y_pred > 0
    tp, tn = int((t & p).sum()), int((~t & ~p).sum())
    fp, fn = int((~t & p).sum()), int((t & ~p).sum())
    return {
        "definition": "positif = crackle, wheeze, atau keduanya; negatif = normal",
        "sensitivity": round(tp / max(tp + fn, 1), 4),
        "specificity": round(tn / max(tn + fp, 1), 4),
        "tp": tp, "tn": tn, "fp": fp, "fn": fn,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "artifacts"))
    ap.add_argument("--split-file", help="ICBHI_challenge_train_test.txt (split resmi), opsional")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    X, y, groups, meta, rejected = load_cycles(args.folder, args.out)
    print(f"siklus: {len(y)}  pasien: {len(np.unique(groups))}  ditolak: {len(rejected)}")
    print("distribusi:", describe(y))

    test_mask, test_patients, split_desc = make_split(groups, y, meta, args.split_file)
    Xtr, ytr, gtr = X[~test_mask], y[~test_mask], groups[~test_mask]
    Xte, yte = X[test_mask], y[test_mask]
    print(f"train: {len(np.unique(gtr))} pasien {describe(ytr)}")
    print(f"test : {len(test_patients)} pasien {describe(yte)}")

    # Hyperparameter search on train patients only.
    cv = GroupKFold(n_splits=5)
    results = []
    for c, g in GRID:
        scores = []
        for a, b in cv.split(Xtr, ytr, gtr):
            m = make_model(c, g).fit(Xtr[a], ytr[a])
            scores.append(f1_score(ytr[b], m.predict(Xtr[b]), average="macro"))
        results.append({"C": c, "gamma": g, "cv_macro_f1": round(float(np.mean(scores)), 4),
                        "cv_std": round(float(np.std(scores)), 4)})
        print("  ", results[-1])
    best = max(results, key=lambda r: r["cv_macro_f1"])

    # Locked configuration -> one evaluation on the held-out patients.
    model = make_model(best["C"], best["gamma"]).fit(Xtr, ytr)
    pred = model.predict(Xte)
    report = classification_report(yte, pred, labels=[0, 1, 2, 3], target_names=F.CLASSES,
                                   output_dict=True, zero_division=0)
    cm = confusion_matrix(yte, pred, labels=[0, 1, 2, 3])
    print(classification_report(yte, pred, labels=[0, 1, 2, 3], target_names=F.CLASSES, zero_division=0))
    print("confusion matrix (baris = anotasi, kolom = prediksi):\n", cm)

    # Per-device breakdown on held-out cycles.
    te_meta = [m for m, t in zip(meta, test_mask) if t]
    per_device = {}
    for dev in sorted({m["device"] for m in te_meta}):
        idx = np.array([m["device"] == dev for m in te_meta])
        if idx.sum() >= 30:
            per_device[dev] = {"cycles": int(idx.sum()),
                               "macro_f1": round(float(f1_score(yte[idx], pred[idx], average="macro")), 4)}

    metrics = {
        "model_version": "mfcc-svm-v0",
        "status": "eksperimen offline; belum divalidasi klinis; bukan inferensi mikrofon HP",
        "data": {"source": "ICBHI 2017 (lokal)", "cycles": int(len(y)), "patients": int(len(np.unique(groups))),
                 "rejected_cycles": len(rejected), "class_counts": describe(y),
                 "split": split_desc,
                 "train_patients": int(len(np.unique(gtr))), "test_patients": test_patients,
                 "test_class_counts": describe(yte)},
        "tuning": {"method": "GroupKFold(5) pada pasien train", "results": results, "selected": best},
        "test": {"macro_f1": round(float(f1_score(yte, pred, average="macro")), 4),
                 "per_class": {k: {m: round(report[k][m], 4) for m in ("precision", "recall", "f1-score")} | {"support": int(report[k]["support"])}
                               for k in F.CLASSES},
                 "confusion_matrix": {"labels": F.CLASSES, "rows_true_cols_pred": cm.tolist()},
                 "abnormal_vs_normal": abnormal_metrics(yte, pred),
                 "per_device": per_device},
        "caveats": [
            "Satu split pasien acak; interval ketidakpastian lebar karena jumlah pasien uji kecil.",
            "Evaluasi pada siklus yang sudah disegmentasi anotasi, bukan rekaman mentah.",
            "Data dari stetoskop/mikrofon klinis; tidak mewakili mikrofon HP.",
            "Probabilitas/kelas adalah pola suara, bukan diagnosis penyakit.",
        ],
    }
    with open(os.path.join(args.out, "metrics.json"), "w", encoding="utf-8") as fh:
        json.dump(metrics, fh, indent=2, ensure_ascii=False)
    with open(os.path.join(args.out, "rejected_cycles.json"), "w", encoding="utf-8") as fh:
        json.dump(rejected, fh, indent=1)
    joblib.dump({"model": model, "classes": F.CLASSES, "model_version": metrics["model_version"],
                 "target_sr": F.TARGET_SR, "config": best}, os.path.join(args.out, "model.joblib"))
    print("tersimpan di", args.out)


if __name__ == "__main__":
    main()
