import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import xlsx from "xlsx-js-style";
import { planVisits } from "../src/utils/scheduleUtils.ts";
import { parsePostcode } from "../src/utils/postcodeUtils.ts";
import { getProximityScore } from "../src/geo/mockGeo.ts";

const XLSX = xlsx?.default ?? xlsx;
const DEFAULT_CONFIG = "scripts/audit-config.json";

const args = process.argv.slice(2);
const configPathArgIndex = args.findIndex((arg) => arg === "--config");
const testDirArgIndex = args.findIndex((arg) => arg === "--testDir");
const configPath =
  configPathArgIndex >= 0 && args[configPathArgIndex + 1]
    ? args[configPathArgIndex + 1]
    : DEFAULT_CONFIG;

const config = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), configPath), "utf8")
);
const defaults = config.defaults ?? {};
const testDirOverride =
  testDirArgIndex >= 0 && args[testDirArgIndex + 1]
    ? args[testDirArgIndex + 1]
    : process.env.TEST_DIR;
const testDir = path.resolve(
  process.cwd(),
  testDirOverride ?? defaults.testDir ?? "testFiles"
);
const fileConfigs = config.files ?? {};

const visitsPerDay = defaults.visitsPerDay ?? 5;
const businessDays = defaults.businessDays ?? 5;
const startDate = new Date(defaults.startDate ?? new Date());

const canonicalFields = {
  name: ["name", "pub", "pub name", "account", "account name", "place"],
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

function driverLabel(pub) {
  if (pub.deadline) return `Visit by ${pub.deadline}`;
  if (pub.followUpDays != null) return `Follow-up ${pub.followUpDays}d`;
  if (pub.priorityLevel != null) return `Priority ${pub.priorityLevel}`;
  return "Masterfile";
}

const pubs = [];

for (const [fileName, meta] of Object.entries(fileConfigs)) {
  if (!fileName.toLowerCase().endsWith(".xlsx")) continue;
  const filePath = path.join(testDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`Missing file ${fileName}`);
    continue;
  }
  const buf = fs.readFileSync(filePath);
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
  }));
  const filtered = mappedWithIndex.filter(
    (r) => r.mapped.name && r.mapped.postcode
  );

  const schedulingMode = meta.schedulingMode ?? null;
  const deadline = schedulingMode === "deadline" ? meta.deadline : undefined;
  const followUpDays =
    schedulingMode === "followup" ? meta.followUpDays : undefined;
  const priorityLevel =
    schedulingMode === "priority" ? meta.priorityLevel : undefined;
  const listType =
    schedulingMode === "followup"
      ? "wins"
      : schedulingMode === "deadline" || schedulingMode === "priority"
      ? "hitlist"
      : "masterhouse";

  filtered.forEach(({ mapped }) => {
    const postcodeMeta = parsePostcode(mapped.postcode);
    pubs.push({
      uuid: crypto.randomUUID(),
      fileId: crypto.randomUUID(),
      fileName,
      listType,
      deadline,
      followUpDays,
      priorityLevel,
      zip: postcodeMeta.normalized ?? mapped.postcode,
      pub: mapped.name,
      postcodeMeta,
      rtm: mapped.rtm ?? undefined,
      last_visited: mapped.extras?.last_visited ?? null,
      sourceLists: [fileName],
    });
  });
}

const debugDays = [];
const schedule = await planVisits(
  pubs,
  startDate,
  businessDays,
  "",
  visitsPerDay,
  15,
  (entry) => debugDays.push(entry)
);

const geoDebug = schedule.map((day) => {
  const visits = day.visits || [];
  if (visits.length === 0) {
    return {
      date: day.date,
      seed: null,
      tierCounts: {},
      ineligibleCount: 0,
      samples: [],
    };
  }
  const seed = visits[0];
  const tierCounts = {};
  let ineligibleCount = 0;
  const samples = visits.slice(0, 5).map((visit) => {
    const score = getProximityScore(seed.zip, visit.zip);
    if (!score.eligible) ineligibleCount += 1;
    tierCounts[score.tier] = (tierCounts[score.tier] ?? 0) + 1;
    return {
      pub: visit.pub,
      postcode: visit.zip,
      tier: score.tier,
      eligible: score.eligible,
    };
  });

  visits.slice(5).forEach((visit) => {
    const score = getProximityScore(seed.zip, visit.zip);
    if (!score.eligible) ineligibleCount += 1;
    tierCounts[score.tier] = (tierCounts[score.tier] ?? 0) + 1;
  });

  return {
    date: day.date,
    seed: { pub: seed.pub, postcode: seed.zip },
    tierCounts,
    ineligibleCount,
    samples,
  };
});

const flatSchedule = schedule.flatMap((day) =>
  (day.visits || []).map((visit) => ({
    Date: day.date,
    "Pub Name": visit.pub,
    "Post Code": visit.zip,
    Priority: driverLabel(visit),
    Lists: (visit.sourceLists || []).join("; "),
  }))
);

const worksheet = XLSX.utils.json_to_sheet(flatSchedule);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Visit Schedule");
const scheduleTag = startDate.toISOString().slice(0, 10);
const outputName = `visit_schedule_${scheduleTag} (auto).xlsx`;
const outputPath = path.join(testDir, outputName);
XLSX.writeFile(workbook, outputPath);

const debugPath = path.join(testDir, "schedule_debug.json");
fs.writeFileSync(debugPath, JSON.stringify(debugDays, null, 2));
const geoDebugPath = path.join(testDir, "schedule_geo_debug.json");
fs.writeFileSync(geoDebugPath, JSON.stringify(geoDebug, null, 2));

console.log(
  JSON.stringify(
    {
      scheduleFile: outputPath,
      debugFile: debugPath,
      geoDebugFile: geoDebugPath,
      days: schedule.length,
      visits: flatSchedule.length,
    },
    null,
    2
  )
);
