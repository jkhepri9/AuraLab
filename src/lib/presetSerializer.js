// src/lib/presetSerializer.js
// -----------------------------------------------------------------------------
// AuraLab — Studio ↔ Public Preset helpers (Creator Mode / Option 1)
//
// Goals:
// 1) Import any built-in preset into Aura Studio editor state (layers + optional studioFx).
// 2) Export the *current Studio mix* into a public preset object you can paste into
//    src/data/presets/*.js (Featured/Community/Fan Favorites/etc).
//
// Key requirements (per user request):
// - Preserve ALL existing preset metadata (Discover/Explorer fields like goals/tags/etc).
//   Implementation: export merges a preserved `basePreset` object and only overrides
//   the fields Aura Studio can author (layers + selected top-level meta).
// - Output "lateral" code formatting (compact, space-saving) similar to your preset files:
//   top-level fields one-per-line, and layers rendered one object per line.
// -----------------------------------------------------------------------------

const SAFE_ID_RE = /^[a-zA-Z0-9_]+$/;

export function slugifyPresetId(name, { prefix = "m_" } = {}) {
  const raw = String(name || "").trim().toLowerCase();
  const slug = raw
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);

  const core = slug || "new_mode";
  const id = `${prefix}${core}`;
  return id.replace(/__+/g, "_");
}

function deepClone(v) {
  try {
    return typeof structuredClone === "function"
      ? structuredClone(v)
      : JSON.parse(JSON.stringify(v));
  } catch {
    if (Array.isArray(v)) return v.map((x) => deepClone(x));
    if (v && typeof v === "object") {
      const out = {};
      for (const k of Object.keys(v)) out[k] = deepClone(v[k]);
      return out;
    }
    return v;
  }
}

function num(v, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function studioStateFromPreset(preset) {
  const p = preset || {};
  return {
    projectName: String(p.name || p.title || "Aura Mode"),
    layers: deepClone(Array.isArray(p.layers) ? p.layers : []),
    studioFx:
      p.studioFx && typeof p.studioFx === "object"
        ? deepClone(p.studioFx)
        : p.fx && typeof p.fx === "object"
          ? deepClone(p.fx)
          : null,
  };
}

/**
 * Build a public preset object from the current Aura Studio state.
 * This object is compatible with existing preset arrays.
 *
 * If `basePreset` is provided, ALL of its extra metadata fields are preserved.
 * Only the following keys are overridden:
 * - id, name, symbol, color, imageUrl, description, layers, studioFx
 */
export function buildPublicPresetFromStudio({
  basePreset = null,
  projectName,
  layers,
  studioFx,
  meta = {},
} = {}) {
  const base =
    basePreset && typeof basePreset === "object" ? deepClone(basePreset) : {};

  const name = String(
    (meta && Object.prototype.hasOwnProperty.call(meta, "name") ? meta.name : undefined) ??
      projectName ??
      base.name ??
      base.title ??
      "Aura Mode"
  );

  const idRaw = String(
    (meta && Object.prototype.hasOwnProperty.call(meta, "id") ? meta.id : undefined) ??
      base.id ??
      slugifyPresetId(name)
  );

  const id = SAFE_ID_RE.test(idRaw) ? idRaw : slugifyPresetId(idRaw);

  const symbol =
    meta && Object.prototype.hasOwnProperty.call(meta, "symbol")
      ? meta.symbol
      : base.symbol;

  const color =
    meta && Object.prototype.hasOwnProperty.call(meta, "color")
      ? meta.color
      : base.color;

  const imageUrl =
    meta && Object.prototype.hasOwnProperty.call(meta, "imageUrl")
      ? meta.imageUrl
      : base.imageUrl;

  const description =
    meta && Object.prototype.hasOwnProperty.call(meta, "description")
      ? meta.description
      : base.description;

  const out = {
    ...base,

    // Authorable top-level fields:
    id,
    name,
    symbol: typeof symbol === "string" ? symbol : "✧",
    color:
      typeof color === "string" && String(color).trim()
        ? String(color).trim()
        : "linear-gradient(135deg, #0f172a, #10b981)",
    imageUrl: typeof imageUrl === "string" ? imageUrl : "",
    description: typeof description === "string" ? description : "",

    // Authorable patch:
    layers: deepClone(Array.isArray(layers) ? layers : []),
  };

  if (studioFx && typeof studioFx === "object") {
    out.studioFx = {
      reverbWet: num(studioFx.reverbWet, 0),
      delayWet: num(studioFx.delayWet, 0),
      delayTime: num(studioFx.delayTime, 0.5),
    };
  }

  return out;
}

export function presetToJsonString(preset, { indent = 2 } = {}) {
  return JSON.stringify(preset ?? {}, null, indent);
}

// -----------------------------------------------------------------------------
// "Lateral" formatter: matches your preset file style
// - Top-level: one key per line
// - layers: one layer object per line
// - Nested objects (e.g., filter) are rendered inline
// -----------------------------------------------------------------------------

function isSafeIdentifier(k) {
  return /^[A-Za-z_$][\w$]*$/.test(k);
}

function formatInlineValue(v) {
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "0";
  if (typeof v === "boolean") return v ? "true" : "false";

  if (Array.isArray(v)) {
    // Render arrays laterally (single line) with spaces after commas, matching preset files.
    return "[" + v.map((x) => formatInlineValue(x)).join(", ") + "]";
  }

  if (typeof v === "object") {
    return formatInlineObject(v);
  }

  // undefined / function / symbol should not appear in presets; omit safely
  return "null";
}

function formatInlineObject(obj) {
  const o = obj && typeof obj === "object" ? obj : {};
  const parts = [];
  for (const key of Object.keys(o)) {
    const k = isSafeIdentifier(key) ? key : JSON.stringify(key);
    parts.push(`${k}: ${formatInlineValue(o[key])}`);
  }
  return `{ ${parts.join(", ")} }`;
}

/**
 * Returns a JS object literal string suitable for pasting into preset arrays.
 * - Keeps metadata keys intact (because we format whatever object you pass in).
 * - Formats layers as one-per-line to save vertical space.
 */
export function presetToAuralabObjectLiteral(
  preset,
  { trailingComma = true } = {}
) {
  const p = preset && typeof preset === "object" ? preset : {};
  const keys = Object.keys(p);

  const lines = ["{"];

  for (const key of keys) {
    if (key === "layers" && Array.isArray(p.layers)) {
      lines.push("  layers: [");
      for (const layer of p.layers) {
        lines.push(`    ${formatInlineObject(layer)},`);
      }
      lines.push("  ],");
      continue;
    }

    const k = isSafeIdentifier(key) ? key : JSON.stringify(key);
    lines.push(`  ${k}: ${formatInlineValue(p[key])},`);
  }

  lines.push(trailingComma ? "}," : "}");
  return lines.join("\n");
}

/**
 * Generic object literal formatter (kept for compatibility).
 * If you want minimal vertical space, prefer presetToAuralabObjectLiteral().
 */
export function presetToJsObjectLiteral(
  preset,
  { indent = 2, trailingComma = false } = {}
) {
  const space = typeof indent === "number" ? Math.max(0, indent) : 2;
  let s = JSON.stringify(preset ?? {}, null, space);

  // Unquote safe JS identifiers: "foo": -> foo:
  // Leaves keys with hyphens/spaces/etc quoted.
  s = s.replace(/"([A-Za-z_$][\w$]*)":/g, "$1:");

  if (trailingComma) {
    if (s.endsWith("}")) s = s.slice(0, -1) + "},";
    else if (s.endsWith("]")) s = s.slice(0, -1) + "],";
  }

  return s;
}
