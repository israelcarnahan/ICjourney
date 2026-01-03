import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import xlsx from "xlsx-js-style";

const DEFAULT_CONFIG = "scripts/audit-config.json";

const args = process.argv.slice(2);
const configPathArgIndex = args.findIndex((arg) => arg === "--config");
const configPath =
  configPathArgIndex >= 0 && args[configPathArgIndex + 1]
    ? args[configPathArgIndex + 1]
    : DEFAULT_CONFIG;

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function normalizePostcode(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim().toUpperCase();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[^A-Z0-9]/g, "");
  if (cleaned === "GIR0AA") return "GIR 0AA";
  if (cleaned.length > 3) {
    return `${cleaned.slice(0, cleaned.length - 3)} ${cleaned.slice(-3)}`;
  }
  return cleaned;
}

function parsePostcode(raw) {
  const normalized = normalizePostcode(raw);
  if (!normalized) {
    return {
      raw: String(raw ?? ""),
      normalized: null,
      areaLetters: null,
      outwardDistrict: null,
      outwardFull: null,
      inwardSector: null,
      inwardUnit: null,
      status: "INVALID",
      fallbackReason: "PARSE_FAILED",
    };
  }
  if (normalized === "GIR 0AA") {
    return {
      raw: String(raw ?? ""),
      normalized,
      areaLetters: "GIR",
      outwardDistrict: null,
      outwardFull: "GIR",
      inwardSector: "0",
      inwardUnit: "AA",
      status: "ODDBALL",
      fallbackReason: "SPECIAL_CASE",
    };
  }
  const match = normalized.match(
    /^([A-Z]{1,2})(\d{1,2}[A-Z]?)[ ](\d)([A-Z]{2})$/
  );
  if (!match) {
    return {
      raw: String(raw ?? ""),
      normalized,
      areaLetters: null,
      outwardDistrict: null,
      outwardFull: null,
      inwardSector: null,
      inwardUnit: null,
      status: "INVALID",
      fallbackReason: "PARSE_FAILED",
    };
  }
  const areaLetters = match[1];
  const outwardRaw = match[2];
  const inwardSector = match[3];
  const inwardUnit = match[4];
  const outwardDigits = outwardRaw.match(/\d+/);
  const outwardDistrict = outwardDigits ? Number(outwardDigits[0]) : null;
  return {
    raw: String(raw ?? ""),
    normalized,
    areaLetters,
    outwardDistrict,
    outwardFull: `${areaLetters}${outwardRaw}`,
    inwardSector,
    inwardUnit,
    status: "OK",
    fallbackReason: null,
  };
}

const canonicalFields = {
  name: ["name", "pub", "pub name", "account", "account name"],
  postcode: ["postcode", "post code", "post_code", "zip", "zip code"],
  rtm: ["rtm"],
  address: ["address", "addr", "street"],
  town: ["town", "city"],
  lat: ["lat", "latitude"],
  lng: ["lng", "longitude", "long"],
  phone: ["phone", "telephone", "tel"],
  email: ["email", "e-mail"],
  notes: ["notes", "note", "visit_notes", "visit notes"],
};

function buildMapping(headers) {
  const mapping = {
    name: null,
    postcode: null,
    rtm: null,
    address: null,
    town: null,
    lat: null,
    lng: null,
    phone: null,
    email: null,
    notes: null,
  };
  const lower = headers.map((h) => String(h || "").trim().toLowerCase());
  for (const [field, candidates] of Object.entries(canonicalFields)) {
    const idx = lower.findIndex((h) => candidates.includes(h));
    if (idx >= 0) mapping[field] = headers[idx];
  }
  return mapping;
}

function coerceNumber(val) {
  const n = Number(String(val ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function mapRowToCanonical(row, mapping) {
  const pick = (field) => {
    const src = mapping[field];
    if (!src) return null;
    const v = row[src];
    return typeof v === "string" ? v.trim() : v ?? null;
  };
  const used = new Set(Object.values(mapping).filter(Boolean));
  const out = {
    name: String(pick("name") ?? ""),
    postcode: String(pick("postcode") ?? ""),
    rtm: pick("rtm"),
    address: pick("address"),
    town: pick("town"),
    lat: coerceNumber(pick("lat")),
    lng: coerceNumber(pick("lng")),
    phone: pick("phone"),
    email: pick("email"),
    notes: pick("notes"),
    extras: {},
  };
  for (const [k, v] of Object.entries(row)) {
    const key = String(k).trim().toLowerCase();
    if (!used.has(key)) out.extras[key] = v;
  }
  return out;
}

function classifyBucket(pub) {
  if (pub.effectivePlan?.deadline) return "deadline";
  if (pub.effectivePlan?.followUpDays) return "followUp";
  if (pub.effectivePlan?.priorityLevel) return "priority";
  if (pub.deadline) return "deadline";
  if (pub.followUpDays) return "followUp";
  if (pub.priorityLevel) return "priority";
  return "master";
}

function isValidDate(val) {
  if (!val) return false;
  const d = new Date(val);
  return !Number.isNaN(d.getTime());
}

const XLSX = xlsx?.default ?? xlsx;
const config = readJson(path.resolve(process.cwd(), configPath));
const defaults = config.defaults ?? {};
const testDir = path.resolve(
  process.cwd(),
  defaults.testDir ?? "testFiles"
);
const fileConfigs = config.files ?? {};

const files = fs
  .readdirSync(testDir)
  .filter((f) => f.toLowerCase().endsWith(".xlsx"));

const summaries = [];

for (const file of files) {
  const warnings = [];
  const configEntry = fileConfigs[file] ?? { schedulingMode: null };
  const listMeta = {
    schedulingMode: configEntry.schedulingMode ?? null,
    deadline: configEntry.deadline ?? null,
    followUpDays: configEntry.followUpDays ?? null,
    priorityLevel: configEntry.priorityLevel ?? null,
  };

  if (listMeta.schedulingMode === "deadline" && !listMeta.deadline) {
    throw new Error(`Missing deadline for ${file} (deadline mode).`);
  }
  if (
    listMeta.schedulingMode === "followup" &&
    !Number.isFinite(listMeta.followUpDays)
  ) {
    throw new Error(`Missing followUpDays for ${file} (followup mode).`);
  }
  if (
    listMeta.schedulingMode === "priority" &&
    !Number.isFinite(listMeta.priorityLevel)
  ) {
    throw new Error(`Missing priorityLevel for ${file} (priority mode).`);
  }
  if (!fileConfigs[file]) {
    warnings.push("No config entry found; schedulingMode defaults to null.");
  }

  const buf = fs.readFileSync(path.join(testDir, file));
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  });

  const headerRow = (raw[0] || []).map((h) =>
    String(h ?? "").trim().toLowerCase()
  );
  const bodyRows = raw.slice(1);

  const rowObjects = bodyRows.map((arr) => {
    const obj = {};
    headerRow.forEach((h, i) => {
      obj[h] = arr[i];
    });
    return obj;
  });

  const mapping = buildMapping(headerRow);
  const mappedWithIndex = rowObjects.map((r, index) => ({
    rowIndex: index,
    mapped: mapRowToCanonical(r, mapping),
    rawRow: r,
  }));
  const filtered = mappedWithIndex.filter(
    (r) => r.mapped.name && r.mapped.postcode
  );

  const pubs = filtered.map(({ mapped, rawRow, rowIndex }) => {
    const postcodeMeta = parsePostcode(mapped.postcode);
    return {
      pub: mapped.name,
      zip: mapped.postcode,
      postcodeMeta,
      deadline:
        listMeta.schedulingMode === "deadline"
          ? listMeta.deadline
          : undefined,
      followUpDays:
        listMeta.schedulingMode === "followup"
          ? listMeta.followUpDays
          : undefined,
      priorityLevel:
        listMeta.schedulingMode === "priority"
          ? listMeta.priorityLevel
          : undefined,
      rawRow,
      rowIndex,
      last_visited:
        rawRow["last_visited"] ?? rawRow["last_visited2.0"] ?? null,
    };
  });

  const totalRows = pubs.length;
  const deadlineAttached = pubs.filter((p) => p.deadline != null).length;
  const deadlineValid = pubs.filter((p) => isValidDate(p.deadline)).length;
  const lastVisitedPresent = pubs.filter(
    (p) => p.last_visited != null && String(p.last_visited).trim() !== ""
  ).length;
  const lastVisitedValid = pubs.filter(
    (p) =>
      p.last_visited != null &&
      String(p.last_visited).trim() !== "" &&
      isValidDate(p.last_visited)
  ).length;
  const lastVisitedInvalid = lastVisitedPresent - lastVisitedValid;

  const followUpDist = pubs.reduce((acc, p) => {
    const key = p.followUpDays == null ? "null" : String(p.followUpDays);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const bucketCounts = pubs.reduce(
    (acc, p) => {
      const b = classifyBucket(p);
      acc[b] = (acc[b] || 0) + 1;
      return acc;
    },
    { deadline: 0, followUp: 0, priority: 0, master: 0 }
  );

  const samples = {
    deadline: pubs
      .filter((p) => classifyBucket(p) === "deadline")
      .slice(0, 3)
      .map((p) => ({
        pub: p.pub,
        postcode: p.zip,
        raw_postcode: p.rawRow["postcode"] ?? p.rawRow["zip"] ?? null,
        raw_last_visited:
          p.rawRow["last_visited"] ?? p.rawRow["last_visited2.0"] ?? null,
        normalized_postcode: p.postcodeMeta.normalized,
      })),
    followUp: pubs
      .filter((p) => classifyBucket(p) === "followUp")
      .slice(0, 3)
      .map((p) => ({
        pub: p.pub,
        postcode: p.zip,
        raw_postcode: p.rawRow["postcode"] ?? p.rawRow["zip"] ?? null,
        raw_last_visited:
          p.rawRow["last_visited"] ?? p.rawRow["last_visited2.0"] ?? null,
        normalized_postcode: p.postcodeMeta.normalized,
      })),
    priority: pubs
      .filter((p) => classifyBucket(p) === "priority")
      .slice(0, 3)
      .map((p) => ({
        pub: p.pub,
        postcode: p.zip,
        raw_postcode: p.rawRow["postcode"] ?? p.rawRow["zip"] ?? null,
        raw_last_visited:
          p.rawRow["last_visited"] ?? p.rawRow["last_visited2.0"] ?? null,
        normalized_postcode: p.postcodeMeta.normalized,
      })),
    master: pubs
      .filter((p) => classifyBucket(p) === "master")
      .slice(0, 3)
      .map((p) => ({
        pub: p.pub,
        postcode: p.zip,
        raw_postcode: p.rawRow["postcode"] ?? p.rawRow["zip"] ?? null,
        raw_last_visited:
          p.rawRow["last_visited"] ?? p.rawRow["last_visited2.0"] ?? null,
        normalized_postcode: p.postcodeMeta.normalized,
      })),
  };

  summaries.push({
    file,
    config: listMeta,
    warnings,
    totalRows,
    deadlines: { attached: deadlineAttached, valid: deadlineValid },
    last_visited: {
      present: lastVisitedPresent,
      valid: lastVisitedValid,
      invalid: lastVisitedInvalid,
    },
    followUpDaysDistribution: followUpDist,
    bucketCountsCurrent: bucketCounts,
    samples,
  });
}

console.log(JSON.stringify(summaries, null, 2));
