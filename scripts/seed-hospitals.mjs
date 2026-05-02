import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").replace(/^['"]|['"]$/g, "");
    }
  }
}

function toText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toTextArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => toText(item))
        .filter((item) => typeof item === "string"),
    ),
  );
}

function getRegion(streetAddress) {
  const firstToken = streetAddress.split(/\s+/)[0] ?? "기타";
  return firstToken.trim() || "기타";
}

function toHospitalRow(record, index) {
  const name = toText(record.place_name);
  const streetAddress = toText(record.address?.street);
  const latitude = Number(record.address?.latitude);
  const longitude = Number(record.address?.longitude);

  if (!name) {
    throw new Error(`${index + 1}번째 항목의 place_name이 비어 있습니다.`);
  }

  if (!streetAddress) {
    throw new Error(`${index + 1}번째 항목의 address.street이 비어 있습니다.`);
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error(`${index + 1}번째 항목의 위도/경도 값이 올바르지 않습니다.`);
  }

  return {
    input_url: toText(record.input_url),
    name,
    phone: toText(record.phone),
    street_address: streetAddress,
    region: getRegion(streetAddress),
    latitude,
    longitude,
    homepage: toText(record.homepage),
    instagram: toText(record.instagram),
    specialty: Boolean(record.specialty),
    emergency: Boolean(record.emergency),
    hours: toTextArray(record.hours),
    veterinarian_specs: toTextArray(record.veterinarian_specs),
    veterinarian_schedule: record.veterinarian_schedule ?? null,
    exotic_animals: toTextArray(record.exotic_animals),
    source_urls: toTextArray(record.source_urls),
    kakao: record.kakao ?? null,
  };
}

loadLocalEnv();

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const jsonPath = args.find((arg) => arg !== "--dry-run");

if (!jsonPath) {
  throw new Error(
    "JSON 경로가 필요합니다. 예: npm run seed:hospitals -- /Users/gunwoo/Downloads/updated_clinic.json",
  );
}

const sourcePath = resolve(process.cwd(), jsonPath);
const rawRecords = JSON.parse(readFileSync(sourcePath, "utf8"));

if (!Array.isArray(rawRecords)) {
  throw new Error("병원 JSON의 최상위 값은 배열이어야 합니다.");
}

const rows = rawRecords.map(toHospitalRow);

if (isDryRun) {
  console.log(`[dry-run] ${rows.length}개 병원 데이터를 변환했습니다.`);
  console.log(JSON.stringify(rows[0], null, 2));
  process.exit(0);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(".env.local에 NEXT_PUBLIC_SUPABASE_URL이 없습니다.");
}

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY가 필요합니다. 이 키는 브라우저에 노출하지 말고 로컬 seed 실행 환경에만 넣어주세요.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const { error } = await supabase.from("hospitals").upsert(rows, {
  onConflict: "input_url",
});

if (error) {
  throw new Error(`Supabase hospitals upsert 실패: ${error.message}`);
}

console.log(`${rows.length}개 병원 데이터를 Supabase hospitals 테이블에 저장했습니다.`);
