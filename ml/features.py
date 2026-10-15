"""Audio loading, quality checks, and MFCC features for ICBHI respiratory cycles.

Pure numpy/scipy so the same code can run at inference time without librosa.
"""
import math
import os

import numpy as np
import soundfile as sf
from scipy.fft import dct
from scipy.signal import butter, resample_poly, sosfiltfilt

TARGET_SR = 4000
BAND_HZ = (50.0, 1800.0)
MIN_CYCLE_S = 0.2
MAX_CYCLE_S = 8.0
N_FFT = 256
HOP = 64
N_MELS = 26
N_MFCC = 13

CLASSES = ["normal", "crackle", "wheeze", "both"]


def load_recording(path):
    """Return mono float32 audio at TARGET_SR and the original sample rate."""
    audio, sr = sf.read(path, dtype="float32", always_2d=True)
    audio = audio.mean(axis=1)
    if sr != TARGET_SR:
        g = math.gcd(int(sr), TARGET_SR)
        audio = resample_poly(audio, TARGET_SR // g, int(sr) // g).astype(np.float32)
    sos = butter(4, BAND_HZ, btype="bandpass", fs=TARGET_SR, output="sos")
    audio = sosfiltfilt(sos, audio).astype(np.float32)
    return audio, int(sr)


def quality_flags(segment):
    """Return a rejection reason or None. Thresholds are experiment settings, not validated."""
    n = len(segment)
    if n < MIN_CYCLE_S * TARGET_SR:
        return "terlalu_pendek"
    peak = float(np.max(np.abs(segment)))
    if peak < 1e-4:
        return "amplitudo_terlalu_kecil"
    if np.mean(np.abs(segment) > 0.99 * peak) > 0.05 and peak > 0.5:
        return "clipping"
    return None


def _mel_filterbank(n_mels=N_MELS):
    def hz2mel(f):
        return 2595.0 * np.log10(1.0 + f / 700.0)

    def mel2hz(m):
        return 700.0 * (10.0 ** (m / 2595.0) - 1.0)

    fmax = TARGET_SR / 2
    mels = np.linspace(hz2mel(0.0), hz2mel(fmax), n_mels + 2)
    bins = np.floor((N_FFT + 1) * mel2hz(mels) / TARGET_SR).astype(int)
    fb = np.zeros((n_mels, N_FFT // 2 + 1))
    for i in range(1, n_mels + 1):
        l, c, r = bins[i - 1], bins[i], bins[i + 1]
        for k in range(l, c):
            fb[i - 1, k] = (k - l) / max(c - l, 1)
        for k in range(c, r):
            fb[i - 1, k] = (r - k) / max(r - c, 1)
    return fb


CNN_MELS = 40
CNN_SECONDS = 5.0
CNN_FRAMES = 1 + (int(CNN_SECONDS * TARGET_SR) - N_FFT) // HOP

_FB = _mel_filterbank()
_FB_CNN = _mel_filterbank(CNN_MELS)
_WIN = np.hanning(N_FFT)


def log_mel(segment, fb=None):
    fb = _FB if fb is None else fb
    seg = segment - np.mean(segment)
    if len(seg) < N_FFT:
        seg = np.pad(seg, (0, N_FFT - len(seg)))
    n_frames = 1 + (len(seg) - N_FFT) // HOP
    idx = np.arange(N_FFT)[None, :] + HOP * np.arange(n_frames)[:, None]
    frames = seg[idx] * _WIN
    power = np.abs(np.fft.rfft(frames, axis=1)) ** 2
    return np.log(power @ fb.T + 1e-10)  # (frames, mels)


def cycle_features(segment):
    """Fixed-length summary vector for one respiratory cycle."""
    seg = segment[: int(MAX_CYCLE_S * TARGET_SR)]
    seg = seg / (np.max(np.abs(seg)) + 1e-9)  # per-cycle peak norm; no train statistics involved
    lm = log_mel(seg)
    mfcc = dct(lm, type=2, axis=1, norm="ortho")[:, :N_MFCC]
    delta = np.gradient(mfcc, axis=0)
    zcr = np.mean(np.abs(np.diff(np.sign(seg)))) / 2.0
    rms = np.sqrt(np.mean(seg ** 2))
    return np.concatenate([
        mfcc.mean(0), mfcc.std(0),
        delta.mean(0), delta.std(0),
        lm.mean(0)[::2],
        [zcr, rms, len(seg) / TARGET_SR],
    ]).astype(np.float32)


def cnn_input(segment):
    """(CNN_MELS, CNN_FRAMES) log-mel image for one cycle.

    Cycles shorter than CNN_SECONDS are tiled, longer ones cropped. Standardised per
    sample, so no statistics are learned from the training set.
    """
    seg = segment[: int(CNN_SECONDS * TARGET_SR)]
    seg = seg / (np.max(np.abs(seg)) + 1e-9)
    need = int(CNN_SECONDS * TARGET_SR)
    if len(seg) < need:
        seg = np.tile(seg, int(np.ceil(need / len(seg))))[:need]
    lm = log_mel(seg, _FB_CNN)[:CNN_FRAMES].T
    lm = (lm - lm.mean()) / (lm.std() + 1e-6)
    return lm.astype(np.float16)


def read_annotations(txt_path):
    """Rows of (start_s, end_s, crackle, wheeze)."""
    rows = []
    with open(txt_path, encoding="utf-8") as fh:
        for line in fh:
            p = line.split()
            if len(p) >= 4:
                rows.append((float(p[0]), float(p[1]), int(p[2]), int(p[3])))
    return rows


def label_of(crackle, wheeze):
    return {(0, 0): 0, (1, 0): 1, (0, 1): 2, (1, 1): 3}[(crackle, wheeze)]


def parse_name(stem):
    """`104_1b1_Al_sc_Litt3200` -> patient, site, device."""
    p = stem.split("_")
    return int(p[0]), p[2], p[-1]


def build_dataset(folder, log=print, extractor=None):
    """Walk the folder and return (X, y, groups, meta, rejected).

    Order is deterministic (sorted files, annotation order), so arrays built with
    different extractors line up row for row.
    """
    extractor = extractor or cycle_features
    X, y, groups, meta, rejected = [], [], [], [], []
    stems = sorted(f[:-4] for f in os.listdir(folder) if f.endswith(".wav"))
    for i, stem in enumerate(stems):
        txt = os.path.join(folder, stem + ".txt")
        if not os.path.exists(txt):
            continue
        audio, sr = load_recording(os.path.join(folder, stem + ".wav"))
        patient, site, device = parse_name(stem)
        for k, (s, e, c, w) in enumerate(read_annotations(txt)):
            seg = audio[int(s * TARGET_SR): int(e * TARGET_SR)]
            reason = quality_flags(seg)
            if reason:
                rejected.append({"file": stem, "cycle": k, "reason": reason})
                continue
            X.append(extractor(seg))
            y.append(label_of(c, w))
            groups.append(patient)
            meta.append({"file": stem, "cycle": k, "site": site, "device": device, "sr": sr})
        if (i + 1) % 100 == 0:
            log(f"  {i + 1}/{len(stems)} rekaman")
    return np.stack(X), np.array(y), np.array(groups), meta, rejected
