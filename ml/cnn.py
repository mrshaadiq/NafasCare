"""Small log-mel CNN for respiratory-cycle classification (PyTorch)."""
import torch
from torch import nn


def block(cin, cout):
    return nn.Sequential(
        nn.Conv2d(cin, cout, 3, padding=1, bias=False),
        nn.BatchNorm2d(cout),
        nn.ReLU(inplace=True),
        nn.MaxPool2d(2),
    )


class SmallCNN(nn.Module):
    """~25k parameters; global pooling so it is robust to the exact input size."""

    def __init__(self, n_classes=4, width=(16, 32, 64), dropout=0.3):
        super().__init__()
        c1, c2, c3 = width
        self.features = nn.Sequential(block(1, c1), block(c1, c2), block(c2, c3))
        self.head = nn.Sequential(nn.Dropout(dropout), nn.Linear(c3, n_classes))

    def forward(self, x):  # (B, 1, mels, frames)
        x = self.features(x)
        x = x.mean(dim=(2, 3))
        return self.head(x)


def spec_augment(x, freq_mask=6, time_mask=30, generator=None):
    """In-place time/frequency masking on a (B, 1, F, T) batch, plus a random time roll."""
    b, _, f, t = x.shape
    for i in range(b):
        shift = int(torch.randint(0, t, (1,), generator=generator))
        x[i] = torch.roll(x[i], shifts=shift, dims=2)
        fw = int(torch.randint(0, freq_mask + 1, (1,), generator=generator))
        f0 = int(torch.randint(0, max(f - fw, 1), (1,), generator=generator))
        x[i, :, f0:f0 + fw, :] = 0
        tw = int(torch.randint(0, time_mask + 1, (1,), generator=generator))
        t0 = int(torch.randint(0, max(t - tw, 1), (1,), generator=generator))
        x[i, :, :, t0:t0 + tw] = 0
    return x
