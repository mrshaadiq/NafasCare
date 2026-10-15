"""Log-mel CNN candidate, compared with the MFCC+SVM baseline on the same patient split.

    python ml/train_cnn.py "<ICBHI_final_database folder>" [--split-file ICBHI_challenge_train_test.txt]

Early stopping uses a validation set of whole patients carved out of train. The held-out
test patients are scored once, with the checkpoint chosen on validation.
"""
import argparse
import json
import os
import sys
import time

import numpy as np
import torch
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from torch import nn

sys.path.insert(0, os.path.dirname(__file__))
import features as F  # noqa: E402
from cnn import SmallCNN, spec_augment  # noqa: E402
from train_baseline import abnormal_metrics, describe, load_cycles, make_split  # noqa: E402

SEED = 42
EPOCHS = 40
PATIENCE = 8
BATCH = 64


def load_specs(folder, out, y_ref):
    cache = os.path.join(out, "cnn_specs.npz")
    if os.path.exists(cache):
        return np.load(cache)["S"]
    print("ekstraksi log-mel ...")
    t0 = time.time()
    S, y, _, _, _ = F.build_dataset(folder, extractor=F.cnn_input)
    assert np.array_equal(y, y_ref), "urutan siklus tidak sama dengan cache MFCC"
    np.savez_compressed(cache, S=S)
    print(f"selesai {time.time() - t0:.0f} detik")
    return S


def val_patients(groups_train, y_train, seed=SEED, frac=0.15):
    pats = np.unique(groups_train)
    rng = np.random.default_rng(seed)
    for _ in range(200):
        v = set(rng.choice(pats, size=max(1, int(round(len(pats) * frac))), replace=False))
        m = np.array([g in v for g in groups_train])
        if all((y_train[m] == k).sum() >= 15 for k in range(4)):
            return m
    raise RuntimeError("no validation split with all classes")


def predict(model, S, device="cpu"):
    model.eval()
    out = []
    with torch.no_grad():
        for i in range(0, len(S), 256):
            xb = torch.from_numpy(S[i:i + 256].astype(np.float32)).unsqueeze(1).to(device)
            out.append(model(xb).argmax(1).cpu().numpy())
    return np.concatenate(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "artifacts"))
    ap.add_argument("--split-file")
    ap.add_argument("--epochs", type=int, default=EPOCHS)
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    torch.manual_seed(SEED)
    np.random.seed(SEED)

    _, y, groups, meta, rejected = load_cycles(args.folder, args.out)
    S = load_specs(args.folder, args.out, y)
    test_mask, test_patients, split_desc = make_split(groups, y, meta, args.split_file)

    S_tr, y_tr, g_tr = S[~test_mask], y[~test_mask], groups[~test_mask]
    S_te, y_te = S[test_mask], y[test_mask]
    vmask = val_patients(g_tr, y_tr)
    S_fit, y_fit = S_tr[~vmask], y_tr[~vmask]
    S_val, y_val = S_tr[vmask], y_tr[vmask]
    print("split:", split_desc)
    print(f"fit {describe(y_fit)}  val {describe(y_val)}  test {describe(y_te)}")

    counts = np.bincount(y_fit, minlength=4).astype(np.float32)
    weights = torch.tensor((counts.sum() / counts) ** 0.5, dtype=torch.float32)
    weights = weights / weights.mean()
    model = SmallCNN()
    print("parameter:", sum(p.numel() for p in model.parameters()))
    opt = torch.optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-3)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=args.epochs)
    loss_fn = nn.CrossEntropyLoss(weight=weights)
    gen = torch.Generator().manual_seed(SEED)

    best_f1, best_state, bad, history = -1.0, None, 0, []
    for epoch in range(args.epochs):
        model.train()
        perm = np.random.permutation(len(S_fit))
        total = 0.0
        for i in range(0, len(perm), BATCH):
            idx = perm[i:i + BATCH]
            xb = torch.from_numpy(S_fit[idx].astype(np.float32)).unsqueeze(1)
            xb = spec_augment(xb, generator=gen)
            yb = torch.from_numpy(y_fit[idx].astype(np.int64))
            opt.zero_grad()
            loss = loss_fn(model(xb), yb)
            loss.backward()
            opt.step()
            total += float(loss) * len(idx)
        sched.step()
        f1 = f1_score(y_val, predict(model, S_val), average="macro")
        history.append({"epoch": epoch + 1, "train_loss": round(total / len(perm), 4), "val_macro_f1": round(float(f1), 4)})
        print(history[-1], flush=True)
        if f1 > best_f1:
            best_f1, bad = f1, 0
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
        else:
            bad += 1
            if bad >= PATIENCE:
                print("early stop")
                break

    model.load_state_dict(best_state)
    pred = predict(model, S_te)
    report = classification_report(y_te, pred, labels=[0, 1, 2, 3], target_names=F.CLASSES,
                                   output_dict=True, zero_division=0)
    cm = confusion_matrix(y_te, pred, labels=[0, 1, 2, 3])
    print(classification_report(y_te, pred, labels=[0, 1, 2, 3], target_names=F.CLASSES, zero_division=0))
    print("confusion matrix (baris = anotasi, kolom = prediksi):\n", cm)

    metrics = {
        "model_version": "logmel-cnn-v0",
        "status": "eksperimen offline; belum divalidasi klinis; bukan inferensi mikrofon HP",
        "split": split_desc,
        "test_patients": test_patients,
        "validation": {"best_macro_f1": round(float(best_f1), 4), "epochs_run": len(history), "history": history},
        "test": {"macro_f1": round(float(f1_score(y_te, pred, average="macro")), 4),
                 "per_class": {k: {m: round(report[k][m], 4) for m in ("precision", "recall", "f1-score")} | {"support": int(report[k]["support"])}
                               for k in F.CLASSES},
                 "confusion_matrix": {"labels": F.CLASSES, "rows_true_cols_pred": cm.tolist()},
                 "abnormal_vs_normal": abnormal_metrics(y_te, pred),
                 "test_class_counts": describe(y_te)},
        "caveats": [
            "Satu split pasien; checkpoint dipilih pada validasi, test dipakai sekali.",
            "Evaluasi pada siklus yang sudah disegmentasi anotasi, bukan rekaman mentah.",
            "Data dari stetoskop/mikrofon klinis; tidak mewakili mikrofon HP.",
        ],
    }
    with open(os.path.join(args.out, "metrics_cnn.json"), "w", encoding="utf-8") as fh:
        json.dump(metrics, fh, indent=2, ensure_ascii=False)
    torch.save({"state_dict": best_state, "classes": F.CLASSES, "model_version": metrics["model_version"],
                "n_mels": F.CNN_MELS, "seconds": F.CNN_SECONDS, "target_sr": F.TARGET_SR},
               os.path.join(args.out, "cnn.pt"))
    print("tersimpan di", args.out)


if __name__ == "__main__":
    main()
