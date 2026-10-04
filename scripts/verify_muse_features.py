"""Independent numerical check of the runtime EEG spectrum; synthetic signals only.
Run with Python + numpy/scipy and Node 22+ from any working directory.
"""
import json
from pathlib import Path
import subprocess
import numpy as np
import scipy
from scipy.signal import periodogram

root = Path(__file__).resolve().parents[1]
rng = np.random.default_rng(20261004)
t = np.arange(256) / 256
signals = [
    20 * np.sin(2 * np.pi * 10 * t) + 5 * np.sin(2 * np.pi * 22 * t),
    15 * np.sin(2 * np.pi * 7.3 * t) + 70,
    rng.normal(0, 25, 256),
    8 * np.sin(2 * np.pi * 3 * t) + 16 * np.sin(2 * np.pi * 35 * t),
]
code = """
import { museFeatureFrame } from './src/services/museFeatures.ts';
let input = ''; for await (const chunk of process.stdin) input += chunk;
console.log(JSON.stringify(museFeatureFrame(1, JSON.parse(input))));
"""
result = subprocess.run(['node', '--experimental-strip-types', '--input-type=module', '-e', code],
    input=json.dumps([signal.tolist() for signal in signals]), text=True, capture_output=True,
    check=True, cwd=root)
frame = json.loads(result.stdout)
bands = dict(delta=(1,4), theta=(4,8), alpha=(8,13), beta=(13,30), gamma=(30,45))
maximum_error = 0.0
for signal, channel in zip(signals, frame['channels'], strict=True):
    frequencies, density = periodogram(signal, fs=256, window='hann', detrend='constant', scaling='density')
    np.testing.assert_allclose(channel['rms'], np.std(signal), rtol=1e-10, atol=1e-10)
    for band, (low, high) in bands.items():
        expected = float(density[(frequencies >= low) & (frequencies < high)].sum())
        actual = channel['power'][band]
        np.testing.assert_allclose(actual, expected, rtol=1e-9, atol=1e-9)
        maximum_error = max(maximum_error, abs(actual - expected))
print(json.dumps({'status':'passed', 'source':'synthetic-reference', 'numpy':np.__version__,
    'scipy':scipy.__version__, 'channels':4, 'bandComparisons':20, 'maxAbsoluteErrorUvSquared':maximum_error}))
