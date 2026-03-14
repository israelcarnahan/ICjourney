import {
  parsePostcode,
  type ParsedPostcode,
  type FallbackReason,
} from "../utils/postcodeUtils";

type LocalityTier = "unit" | "sector" | "district" | "area" | "cross_area";

type PostcodeInput = string | ParsedPostcode | null | undefined;

type ProximityScore = {
  eligible: boolean;
  tier: LocalityTier;
  districtDelta: number | null;
  sectorDelta: number | null;
  unitDelta: number | null;
  rankKey: number[];
  debugLabel: string;
  anchor: ParsedPostcode;
  candidate: ParsedPostcode;
};

const TIER_RANK: Record<LocalityTier, number> = {
  unit: 0,
  sector: 1,
  district: 2,
  area: 3,
  cross_area: 4,
};

const TIER_LABEL: Record<LocalityTier, string> = {
  unit: "same postcode",
  sector: "same sector",
  district: "same district",
  area: "same area",
  cross_area: "cross area",
};

const buildParsed = (
  raw: string,
  areaLetters: string | null,
  outwardFull: string | null,
  outwardDistrict: number | null
): ParsedPostcode => {
  const fallbackReason: FallbackReason = "PARSE_FAILED";
  return {
    raw,
    normalized: raw ? raw.toUpperCase() : null,
    areaLetters,
    outwardDistrict,
    outwardFull,
    inwardSector: null,
    inwardUnit: null,
    status: areaLetters ? "ODDBALL" : "INVALID",
    fallbackReason,
  };
};

const parseInput = (value: PostcodeInput): ParsedPostcode => {
  if (!value) return parsePostcode("");
  if (typeof value !== "string") return value;

  const parsed = parsePostcode(value);
  if (parsed.status !== "INVALID") return parsed;

  const raw = String(value).trim().toUpperCase();
  const outwardMatch = raw.match(/^([A-Z]{1,2})(\d{1,2}[A-Z]?)$/);
  if (outwardMatch) {
    const areaLetters = outwardMatch[1];
    const outwardRaw = outwardMatch[2];
    const outwardDigits = outwardRaw.match(/\d+/);
    const outwardDistrict = outwardDigits ? Number(outwardDigits[0]) : null;
    return buildParsed(raw, areaLetters, `${areaLetters}${outwardRaw}`, outwardDistrict);
  }

  const areaMatch = raw.match(/^([A-Z]{1,2})$/);
  if (areaMatch) {
    return buildParsed(raw, areaMatch[1], areaMatch[1], null);
  }

  return parsed;
};

const isSameArea = (a: ParsedPostcode, b: ParsedPostcode): boolean => {
  if (!a.areaLetters || !b.areaLetters) return false;
  return a.areaLetters === b.areaLetters;
};

const districtDelta = (a: ParsedPostcode, b: ParsedPostcode): number | null => {
  if (a.outwardDistrict == null || b.outwardDistrict == null) return null;
  return Math.abs(a.outwardDistrict - b.outwardDistrict);
};

const sectorDelta = (a: ParsedPostcode, b: ParsedPostcode): number | null => {
  if (!a.inwardSector || !b.inwardSector) return null;
  const aNum = Number(a.inwardSector);
  const bNum = Number(b.inwardSector);
  if (Number.isNaN(aNum) || Number.isNaN(bNum)) return null;
  return Math.abs(aNum - bNum);
};

const unitDelta = (a: ParsedPostcode, b: ParsedPostcode): number | null => {
  if (!a.inwardUnit || !b.inwardUnit) return null;
  const aFirst = a.inwardUnit.charCodeAt(0);
  const bFirst = b.inwardUnit.charCodeAt(0);
  const aSecond = a.inwardUnit.charCodeAt(1);
  const bSecond = b.inwardUnit.charCodeAt(1);
  const firstDiff = Math.abs(aFirst - bFirst);
  const secondDiff = Math.abs(aSecond - bSecond);
  if (a.inwardUnit[0] === b.inwardUnit[0]) {
    return secondDiff;
  }
  return 100 + firstDiff * 10 + secondDiff;
};

const resolveTier = (a: ParsedPostcode, b: ParsedPostcode): LocalityTier => {
  if (!isSameArea(a, b)) return "cross_area";
  if (
    a.outwardFull &&
    b.outwardFull &&
    a.inwardSector &&
    b.inwardSector &&
    a.inwardUnit &&
    b.inwardUnit &&
    a.outwardFull === b.outwardFull &&
    a.inwardSector === b.inwardSector &&
    a.inwardUnit === b.inwardUnit
  ) {
    return "unit";
  }
  if (
    a.outwardFull &&
    b.outwardFull &&
    a.inwardSector &&
    b.inwardSector &&
    a.outwardFull === b.outwardFull &&
    a.inwardSector === b.inwardSector
  ) {
    return "sector";
  }
  if (a.outwardFull && b.outwardFull && a.outwardFull === b.outwardFull) {
    return "district";
  }
  return "area";
};

export const getProximityScore = (
  anchorInput: PostcodeInput,
  candidateInput: PostcodeInput
): ProximityScore => {
  const anchor = parseInput(anchorInput);
  const candidate = parseInput(candidateInput);
  const eligible = isSameArea(anchor, candidate);
  const tier = resolveTier(anchor, candidate);
  const dDelta = districtDelta(anchor, candidate);
  const sDelta = sectorDelta(anchor, candidate);
  const uDelta = unitDelta(anchor, candidate);
  const rankKey = [
    TIER_RANK[tier],
    dDelta ?? 999,
    sDelta ?? 999,
    uDelta ?? 999,
  ];

  return {
    eligible,
    tier,
    districtDelta: dDelta,
    sectorDelta: sDelta,
    unitDelta: uDelta,
    rankKey,
    debugLabel: TIER_LABEL[tier],
    anchor,
    candidate,
  };
};

export const compareByProximity = (
  anchorInput: PostcodeInput,
  aInput: PostcodeInput,
  bInput: PostcodeInput
): number => {
  const aScore = getProximityScore(anchorInput, aInput);
  const bScore = getProximityScore(anchorInput, bInput);

  if (aScore.eligible !== bScore.eligible) {
    return aScore.eligible ? -1 : 1;
  }

  for (let i = 0; i < aScore.rankKey.length; i += 1) {
    const diff = aScore.rankKey[i] - bScore.rankKey[i];
    if (diff !== 0) return diff;
  }

  const aNorm = aScore.candidate.normalized ?? "";
  const bNorm = bScore.candidate.normalized ?? "";
  return aNorm.localeCompare(bNorm);
};

export const getProximityRank = (
  anchorInput: PostcodeInput,
  candidateInput: PostcodeInput
): number => {
  const score = getProximityScore(anchorInput, candidateInput);
  return score.rankKey.reduce(
    (acc, value, idx) => acc + value * 10 ** (score.rankKey.length - idx),
    0
  );
};

const tierBaseMileage: Record<LocalityTier, number> = {
  unit: 5,
  sector: 10,
  district: 20,
  area: 35,
  cross_area: 60,
};

export const estimateMockDistance = (
  anchorInput: PostcodeInput,
  candidateInput: PostcodeInput
): { mileage: number; driveTime: number; tier: LocalityTier } => {
  const score = getProximityScore(anchorInput, candidateInput);
  const base = tierBaseMileage[score.tier];
  const mileage = base + (score.districtDelta ?? 0) * 2 + (score.sectorDelta ?? 0);
  const driveTime = mileage >= 50 ? 90 : mileage >= 25 ? 60 : 30;
  return { mileage, driveTime, tier: score.tier };
};
