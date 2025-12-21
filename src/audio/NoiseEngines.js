// src/audio/NoiseEngines.js
// ---------------------------------------------------------
// All noise types used in AuraLab: white, pink, brown, black,
// violet, blue, gray, gold, silver, cosmic.
// ---------------------------------------------------------

export function createNoiseBuffer(ctx, type = "white") {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut1 = 0;
  let lastOut2 = 0;
  let lastOut3 = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;

    switch (type) {
      case "white":
        data[i] = white;
        break;

      case "pink": {
        lastOut1 = 0.99886 * lastOut1 + white * 0.0555179;
        lastOut2 = 0.99332 * lastOut2 + white * 0.0750759;
        lastOut3 = 0.96900 * lastOut3 + white * 0.1538520;
        const pinkBase = lastOut1 + lastOut2 + lastOut3 + white * 0.016;
        const fresh = Math.random() * 2 - 1;
        data[i] = (pinkBase * 0.6 + fresh * 0.4) * 0.2;
        break;
      }

      case "brown": {
        const brown = (lastOut1 + 0.02 * white) / 1.02;
        lastOut1 = brown;
        data[i] = brown * 3.5;
        break;
      }

      // Black noise: slightly deeper (more low-frequency emphasis) than brown.
      // Implemented as a slower random walk + additional smoothing stage.
      case "black": {
        // slower / deeper than brown
        const walk = (lastOut1 + 0.015 * white) / 1.015;
        lastOut1 = walk;

        // extra low-pass smoothing to push energy lower
        const smooth = 0.99 * lastOut2 + 0.01 * walk;
        lastOut2 = smooth;

        data[i] = smooth * 4.5;
        break;
      }

      case "violet": {
        const v = white - lastOut1;
        lastOut1 = white;
        data[i] = v * 0.7;
        break;
      }

      case "blue": {
        const high = white - lastOut1;
        lastOut1 = white;
        data[i] = (high * 0.5 + white * 0.5) * 0.7;
        break;
      }

      case "gray": {
        const low = (lastOut1 + white) * 0.5;
        lastOut1 = low;
        const high = white - low;
        data[i] = (low * 0.3 + white * 0.4 + high * 0.3) * 0.8;
        break;
      }

      case "gold": {
        const b = (lastOut1 + 0.01 * white) / 1.01;
        lastOut1 = b;
        const mildHigh = white * 0.15;
        data[i] = (b * 0.85 + mildHigh) * 3.0;
        break;
      }

      case "silver": {
        lastOut1 = 0.99886 * lastOut1 + white * 0.0555179;
        const pinkish = lastOut1 * 0.11;
        const hi = white - pinkish;
        data[i] = (hi * 0.8 + pinkish * 0.2) * 0.7;
        break;
      }

      case "cosmic": {
        const slow = (lastOut1 + 0.005 * white) / 1.005;
        lastOut1 = slow;
        data[i] = slow * 4.0;
        break;
      }

      default:
        data[i] = white;
    }
  }

  // Normalize amplitude
  let max = 0;
  for (let i = 0; i < bufferSize; i++) {
    const v = Math.abs(data[i]);
    if (v > max) max = v;
  }
  const scale = max ? 0.9 / max : 1;
  for (let i = 0; i < bufferSize; i++) data[i] *= scale;

  return buffer;
}
