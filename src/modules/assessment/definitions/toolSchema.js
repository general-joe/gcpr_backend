/**
 * Tool schema core (Group 5) — pure functions, no DB.
 *
 * Converts the legacy `src/config/tools/*.config.js` files into versioned
 * definition snapshots, validates submissions field-by-field, scores
 * SUM/WEIGHTED_SUM generically from option data, and renders snapshots for
 * clients. Bespoke tools keep their registered scorer (CUSTOM_FN_REF).
 */

import { TOOL_CLASSIFICATION_SCALES } from "../../../services/assessment/classificationPolicy.js";

// Scoring strategy per legacy tool. The four clinically-scored tools keep
// their exact registered scorer; the rest score generically from option data.
export const TOOL_SCORING = {
  GMFM_88: { strategy: "CUSTOM_FN_REF", customFnRef: "scoreGMFM88" },
  PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT: { strategy: "CUSTOM_FN_REF", customFnRef: "scorePhysiotherapy" },
  OT_CP_CLINICAL_ASSESSMENT: { strategy: "CUSTOM_FN_REF", customFnRef: "scoreOT" },
  SLT_CP_BASELINE: { strategy: "CUSTOM_FN_REF", customFnRef: "scoreSLT" },
  CP_PROGRAM_INTAKE: { strategy: "SUM", customFnRef: null },
  HOME_REHAB_PHARMACY_PRESCRIPTION: { strategy: "SUM", customFnRef: null },
  DIETITIAN_NUTRITION_CONSULTATION: { strategy: "SUM", customFnRef: null },
};

const LEGACY_TYPE_TO_FIELD_TYPE = {
  TEXT: "TEXT",
  TEXTAREA: "TEXT",
  NUMBER: "NUMBER",
  BOOLEAN: "BOOLEAN",
  DATE: "DATE",
  SELECT: "SINGLE_CHOICE",
  RADIO: "SINGLE_CHOICE",
  CHECKBOX: "MULTI_CHOICE",
};

const normalizeOption = (option) => {
  if (option && typeof option === "object") {
    return {
      value: String(option.value),
      label: option.label ?? String(option.value),
      ...(option.score !== undefined && { score: option.score }),
    };
  }
  return { value: String(option), label: String(option) };
};

const convertItem = (item, order) => {
  const fieldType = LEGACY_TYPE_TO_FIELD_TYPE[item.type] ?? "TEXT";
  const options = Array.isArray(item.options) ? item.options.map(normalizeOption) : null;
  return {
    // Stable creation-time key: the config item id. Never position-derived,
    // so reordering fields in an admin UI cannot corrupt historical answers.
    fieldKey: String(item.id),
    order,
    label: item.text ?? item.label ?? String(item.id),
    helpText: item.helpText ?? item.help ?? null,
    fieldType,
    options,
    validation: {
      required: false,
      ...(options && { allowedValues: options.map((o) => o.value) }),
      ...(item.min !== undefined && { min: item.min }),
      ...(item.max !== undefined && { max: item.max }),
    },
    scoringWeight: item.scoringWeight ?? item.weight ?? null,
  };
};

const convertGmfm = (config) => {
  const lookup = new Map((config.items ?? []).map((item) => [item.id, item]));
  const scoringOptions = config.scoringKey
    ? Object.entries(config.scoringKey).map(([code, label]) => ({
        value: String(code),
        label,
        ...(code !== "NT" && { score: Number(code) }),
      }))
    : [];
  const sections = (config.dimensions ?? []).map((dimension, di) => {
    const [start, end] = dimension.itemRange;
    const fields = [];
    for (let n = start; n <= end; n += 1) {
      // GMFM item codes (A1..E88) are stable clinical identifiers, not
      // position-derived keys — they double as the immutable fieldKey.
      const fieldKey = `${dimension.code}${n}`;
      fields.push({
        fieldKey,
        order: n - start,
        label: lookup.get(fieldKey)?.text ?? `GMFM Item ${fieldKey}`,
        helpText: null,
        fieldType: "SINGLE_CHOICE",
        options: scoringOptions,
        // Mirrors validateGMFMResponses exactly: every key required,
        // domain 0–3 plus NT (numeric strings coerced at validation).
        validation: { required: true, allowedValues: [0, 1, 2, 3, "NT"] },
        scoringWeight: null,
      });
    }
    return {
      code: dimension.code,
      title: dimension.name,
      description: null,
      order: di,
      fields,
    };
  });
  // The legacy form appended a free-text clinical notes section to GMFM.
  sections.push({
    code: "clinical_notes",
    title: "Clinical Notes",
    description: null,
    order: sections.length,
    fields: [
      {
        fieldKey: "clinicalNotes",
        order: 0,
        label: "Clinical Notes",
        helpText: null,
        fieldType: "TEXT",
        options: null,
        validation: { required: false },
        scoringWeight: null,
      },
    ],
  });
  return sections;
};

/**
 * Convert one legacy config file into a publishable snapshot.
 * Snapshot shape: { sections: [{ code, title, description, order, fields: [...] }] }
 */
export const configToSnapshot = (config) => {
  if (Array.isArray(config?.dimensions) && config.dimensions.length > 0) {
    return { sections: convertGmfm(config) };
  }
  const sections = (config?.sections ?? []).map((section, si) => ({
    code: section.code ?? null,
    title: section.name ?? section.title ?? `Section ${si + 1}`,
    description: section.description ?? null,
    order: si,
    fields: (section.items ?? []).map((item, fi) => convertItem(item, fi)),
  }));
  return { sections };
};

/** Metadata harvested from a legacy config for the definition row. */
export const configToDefinitionMeta = (config) => {
  const code = config.toolCode;
  const scoring = TOOL_SCORING[code] ?? { strategy: "SUM", customFnRef: null };
  return {
    code,
    name: config.toolName ?? code,
    description: config.description ?? null,
    applicableScales: TOOL_CLASSIFICATION_SCALES[code] ?? [],
    allowedProfessions: config.metadata?.professions ?? [],
    scoringStrategy: scoring.strategy,
    customFnRef: scoring.customFnRef,
  };
};

const coerceScalar = (field, value) => {
  if (field.fieldType === "NUMBER" && typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  if (field.fieldType === "BOOLEAN" && typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }
  // GMFM-style domain: numeric strings ("0"–"3") coerce to numbers so the
  // generic check matches validateGMFMResponses exactly.
  if (typeof value === "string" && /^[0-3]$/.test(value)) {
    const allowed = field.validation?.allowedValues ?? [];
    if (allowed.includes(Number(value))) return Number(value);
  }
  return value;
};

const checkFieldValue = (field, rawValue) => {
  const value = coerceScalar(field, rawValue);
  const v = field.validation ?? {};
  const issues = [];
  const fail = (message) => issues.push({ fieldKey: field.fieldKey, message });

  if (value === undefined || value === null || value === "") {
    if (v.required) fail("This field is required");
    return { issues, value };
  }

  const allowed = v.allowedValues;
  switch (field.fieldType) {
    case "NUMBER":
    case "SCALE_1_5": {
      if (typeof value !== "number" || Number.isNaN(value)) fail("Must be a number");
      else {
        if (allowed && !allowed.includes(value)) fail(`Must be one of: ${allowed.join(", ")}`);
        if (v.min !== undefined && value < v.min) fail(`Must be at least ${v.min}`);
        if (v.max !== undefined && value > v.max) fail(`Must be at most ${v.max}`);
      }
      break;
    }
    case "BOOLEAN": {
      if (typeof value !== "boolean") fail("Must be true or false");
      break;
    }
    case "DATE": {
      const t = new Date(value).getTime();
      if (Number.isNaN(t)) fail("Must be a valid date");
      break;
    }
    case "MULTI_CHOICE": {
      if (!Array.isArray(value)) fail("Must be a list of choices");
      else if (allowed) {
        const bad = value.filter((entry) => !allowed.includes(entry));
        if (bad.length > 0) fail(`Invalid choice(s): ${bad.join(", ")}`);
      }
      break;
    }
    case "SINGLE_CHOICE": {
      if (typeof value !== "string" && typeof value !== "number") fail("Must be a single choice");
      else if (allowed && !allowed.includes(value)) fail(`Must be one of: ${allowed.join(", ")}`);
      break;
    }
    case "FILE_UPLOAD": {
      if (typeof value !== "string" || value.length === 0) fail("Must be a file reference");
      break;
    }
    case "TEXT":
    default: {
      if (typeof value !== "string" && typeof value !== "number") fail("Must be text");
      break;
    }
  }
  return { issues, value };
};

/**
 * Validate a submission payload against a published snapshot.
 * Unknown keys are ignored (forward-compatible); every known field present
 * in the payload is type/range-checked. Returns { valid, issues, coerced }.
 */
export const validateSnapshotResponses = (snapshot, responses = {}) => {
  const issues = [];
  const coerced = {};
  for (const section of snapshot?.sections ?? []) {
    for (const field of section.fields ?? []) {
      const raw = responses[field.fieldKey];
      if (raw === undefined && !(field.validation?.required)) continue;
      const { issues: fieldIssues, value } = checkFieldValue(field, raw);
      issues.push(...fieldIssues);
      if (fieldIssues.length === 0 && raw !== undefined) coerced[field.fieldKey] = value;
    }
  }
  return { valid: issues.length === 0, issues, coerced };
};

const optionScore = (field, value) => {
  const match = (field.options ?? []).find((o) => o.value === value || o.value === String(value));
  return match?.score ?? 0;
};

/**
 * Generic data-driven scoring: sum of option scores x field weights.
 * Custom tools bypass this via CUSTOM_FN_REF (existing exact scorers).
 */
export const scoreSnapshotResponses = (snapshot, strategy, responses = {}) => {
  const fieldScores = {};
  let total = 0;
  for (const section of snapshot?.sections ?? []) {
    for (const field of section.fields ?? []) {
      const value = responses[field.fieldKey];
      if (value === undefined) continue;
      let score = 0;
      if (field.options) {
        score = Array.isArray(value)
          ? value.reduce((sum, entry) => sum + optionScore(field, entry), 0)
          : optionScore(field, value);
      } else if (typeof value === "number") {
        score = value;
      }
      const weight = strategy === "WEIGHTED_SUM" ? (field.scoringWeight ?? 1) : 1;
      const weighted = score * weight;
      fieldScores[field.fieldKey] = weighted;
      total += weighted;
    }
  }
  return { strategy, total, fieldScores };
};

/** Client-facing render of a snapshot (form + preview share this). */
export const renderSnapshotAsForm = (snapshot) => {
  const sections = (snapshot?.sections ?? []).map((section) => {
    const fields = (section.fields ?? []).map((field) => ({
      fieldKey: field.fieldKey,
      question: field.label,
      helpText: field.helpText ?? null,
      fieldType: field.fieldType,
      expectedAnswerFormat: field.fieldType === "SINGLE_CHOICE" ? "select" : field.fieldType.toLowerCase(),
      options: field.options ?? null,
      required: field.validation?.required ?? false,
    }));
    return {
      sectionCode: section.code,
      sectionName: section.title,
      sectionDescription: section.description ?? null,
      fields,
    };
  });
  return { sections };
};
