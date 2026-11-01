var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export function detectBpm(samples, sampleRate) {
    var _a, _b, _c, _d, _e;
    if (samples.length / sampleRate < 3)
        return null;
    var hop = Math.max(1, Math.round(sampleRate / 200));
    var rate = sampleRate / hop;
    var count = Math.floor(samples.length / hop);
    var energy = new Float64Array(count);
    var alpha = 1 - Math.exp(-2 * Math.PI * 180 / sampleRate);
    var low = 0;
    for (var b = 0; b < count; b++) {
        var sum = 0;
        for (var j = 0; j < hop; j++) {
            var x = samples[b * hop + j];
            low += alpha * (x - low);
            sum += low * low + 0.025 * x * x;
        }
        energy[b] = Math.sqrt(sum / hop);
    }
    var onset = new Float64Array(count);
    // A sustained tone can alias into periodic bin-to-bin flux. Require actual
    // envelope dynamics, ignoring the initial filter transient.
    var stableStart = Math.min(count - 1, Math.round(rate * .5));
    var mean = 0, square = 0;
    for (var i = stableStart; i < count; i++) {
        mean += energy[i];
        square += Math.pow(energy[i], 2);
    }
    mean /= count - stableStart;
    square /= count - stableStart;
    if (Math.sqrt(Math.max(0, square - mean * mean)) < mean * .08)
        return null;
    var power = 0;
    for (var i = 1; i < count; i++) {
        onset[i] = Math.max(0, energy[i] - energy[i - 1]);
        power += onset[i] * onset[i];
    }
    if (power / count < 1e-10)
        return null;
    var onsetMean = onset.reduce(function (sum, value) { return sum + value; }, 0) / count;
    var minLag = Math.floor(rate * 60 / 180);
    var maxLag = Math.ceil(rate * 60 / 70);
    var correlations = new Float64Array(maxLag + 2);
    var bestLag = 0;
    var bestScore = 0;
    for (var lag = minLag; lag <= maxLag; lag++) {
        var dot = 0, a = 0, b = 0;
        for (var i = lag; i < count; i++) {
            var x = onset[i] - onsetMean, y = onset[i - lag] - onsetMean;
            dot += x * y;
            a += x * x;
            b += y * y;
        }
        var correlation = dot / Math.max(1e-20, Math.sqrt(a * b));
        correlations[lag] = correlation;
        // Gentle tie-break toward common dance tempos; no claim of musical certainty.
        var score = correlation * (1 - 0.03 * Math.abs(Math.log2((rate * 60 / lag) / 120)));
        if (score > bestScore) {
            bestScore = score;
            bestLag = lag;
        }
    }
    if (bestScore < 0.15 || !bestLag)
        return null;
    var l = (_a = correlations[bestLag - 1]) !== null && _a !== void 0 ? _a : 0, c = correlations[bestLag], r = (_b = correlations[bestLag + 1]) !== null && _b !== void 0 ? _b : 0;
    var denom = l - 2 * c + r;
    var delta = denom < -1e-8 ? Math.max(-0.5, Math.min(0.5, 0.5 * (l - r) / denom)) : 0;
    var period = bestLag + delta;
    // Refine using separated peaks: bin quantization alone drifts on long tracks.
    var peaks = [];
    var maxOnset = 0;
    for (var _i = 0, onset_1 = onset; _i < onset_1.length; _i++) {
        var value = onset_1[_i];
        maxOnset = Math.max(maxOnset, value);
    }
    for (var i = 1; i < count - 1; i++) {
        if (onset[i] > maxOnset * .25 && onset[i] >= onset[i - 1] && onset[i] > onset[i + 1])
            peaks.push(i);
    }
    var phase = 0, phaseScore = -1;
    for (var p = 0; p < period; p++) {
        var score = 0;
        for (var beat = p; beat < count; beat += period) {
            var i = Math.round(beat);
            score += ((_c = onset[i]) !== null && _c !== void 0 ? _c : 0) + .5 * (((_d = onset[i - 1]) !== null && _d !== void 0 ? _d : 0) + ((_e = onset[i + 1]) !== null && _e !== void 0 ? _e : 0));
        }
        if (score > phaseScore) {
            phaseScore = score;
            phase = p;
        }
    }
    var strongest = new Map();
    for (var _f = 0, peaks_1 = peaks; _f < peaks_1.length; _f++) {
        var p = peaks_1[_f];
        var n = Math.round((p - phase) / period);
        if (Math.abs(p - (phase + n * period)) >= period * .1)
            continue;
        var old = strongest.get(n);
        if (old === undefined || onset[p] > onset[old])
            strongest.set(n, p);
    }
    var fitted = __spreadArray([], strongest, true).map(function (_a) {
        var n = _a[0], p = _a[1];
        return ({ n: n, p: p });
    });
    var refined = period;
    if (fitted.length >= 4) {
        var meanN_1 = fitted.reduce(function (s, v) { return s + v.n; }, 0) / fitted.length;
        var meanP_1 = fitted.reduce(function (s, v) { return s + v.p; }, 0) / fitted.length;
        var cov = fitted.reduce(function (s, v) { return s + (v.n - meanN_1) * (v.p - meanP_1); }, 0);
        var variance = fitted.reduce(function (s, v) { return s + Math.pow((v.n - meanN_1), 2); }, 0);
        if (variance > 0) {
            var candidate = cov / variance;
            if (Math.abs(candidate - period) < period * .02) {
                refined = candidate;
                phase = meanP_1 - refined * meanN_1;
            }
        }
    }
    var bpm = 60 * rate / refined;
    var offset = ((phase / rate) % (60 / bpm) + 60 / bpm) % (60 / bpm);
    return { bpm: Math.round(bpm * 10) / 10, offset: offset, confidence: Math.min(1, bestScore) };
}
