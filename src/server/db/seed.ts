import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { hash } from "bcryptjs";

import { env } from "~/env";

const sql = postgres(env.DATABASE_URL);

const DATA_SCRIPTS_DIR = join(process.cwd(), "drizzle/data_scripts");

const DATA_SCRIPT_ORDER = [
  "zenflix_category",
  "zenflix_video",
  "zenflix_profile",
  "zenflix_video_category",
  "zenflix_review",
] as const;

function resolveDataScript(tablePrefix: string): string {
  const file = readdirSync(DATA_SCRIPTS_DIR).find(
    (name) => name.startsWith(`${tablePrefix}_`) && name.endsWith(".sql"),
  );
  if (!file) {
    throw new Error(`No SQL file found for ${tablePrefix} in ${DATA_SCRIPTS_DIR}`);
  }
  return join(DATA_SCRIPTS_DIR, file);
}

function databaseName(): string {
  return new URL(env.DATABASE_URL).pathname.replace(/^\//, "");
}

function runWithPsql(filePath: string): boolean {
  try {
    execFileSync(
      "psql",
      [env.DATABASE_URL, "-v", "ON_ERROR_STOP=1", "-q", "-f", filePath],
      { stdio: "inherit" },
    );
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
}

function runWithDockerPsql(filePath: string): boolean {
  const dbName = databaseName();
  const composeFile = join(process.cwd(), "../docker-compose.yml");

  if (existsSync(composeFile)) {
    try {
      execFileSync(
        "docker",
        [
          "compose",
          "-f",
          composeFile,
          "exec",
          "-T",
          "postgres",
          "psql",
          "-q",
          "-U",
          "zenflix",
          "-d",
          dbName,
          "-v",
          "ON_ERROR_STOP=1",
        ],
        {
          input: readFileSync(filePath),
          stdio: ["pipe", "inherit", "inherit"],
          cwd: join(process.cwd(), ".."),
        },
      );
      return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    }
  }

  const container = `${dbName}-postgres`;

  try {
    execFileSync("docker", ["inspect", container], { stdio: "ignore" });
  } catch {
    return false;
  }

  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      container,
      "psql",
      "-q",
      "-U",
      "postgres",
      "-d",
      dbName,
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input: readFileSync(filePath), stdio: ["pipe", "inherit", "inherit"] },
  );
  return true;
}

async function runSqlFile(filePath: string) {
  if (!existsSync(filePath)) {
    throw new Error(`SQL file not found: ${filePath}`);
  }

  if (runWithPsql(filePath)) return;
  if (runWithDockerPsql(filePath)) return;

  console.log("psql not available, using postgres driver (may be slow for large files)...");
  await sql.unsafe(readFileSync(filePath, "utf8"));
}

async function ensureSeedUsers() {
  const passwordHash = await hash("admin123", 12);
  const id = crypto.randomUUID();

  await sql`
    INSERT INTO zenflix_user (id, email, name, "firstName", "lastName", "passwordHash", role)
    SELECT ${id}, 'admin@zenflix.com', 'Admin User', 'Admin', 'User', ${passwordHash}, 'admin'
    WHERE NOT EXISTS (SELECT 1 FROM zenflix_user WHERE email = 'admin@zenflix.com')
  `;

  await sql`
    INSERT INTO zenflix_user (id, email, name, role)
    VALUES ('1', 'seed@zenflix.local', 'Seed User', 'member')
    ON CONFLICT (id) DO NOTHING
  `;
}

async function clearSeedTables() {
  await sql`
    TRUNCATE TABLE
      zenflix_review,
      zenflix_watch_history,
      zenflix_video_category,
      zenflix_profile,
      zenflix_video,
      zenflix_category
    RESTART IDENTITY CASCADE
  `;
}

function referencedCategoryIds(): number[] {
  const filePath = resolveDataScript("zenflix_video_category");
  const text = readFileSync(filePath, "utf8");
  const ids = new Set<number>();
  for (const match of text.matchAll(/::uuid,(\d+)\)/g)) {
    ids.add(Number(match[1]));
  }
  return [...ids].sort((a, b) => a - b);
}

async function ensureMissingCategories() {
  const referencedIds = referencedCategoryIds();
  const existing = await sql<{ id: number }[]>`SELECT id FROM zenflix_category`;
  const existingIds = new Set(existing.map((row) => row.id));

  const missing = referencedIds.filter((id) => !existingIds.has(id));
  if (missing.length === 0) return;

  console.log(`Inserting ${missing.length} placeholder categories for missing IDs...`);
  for (const id of missing) {
    await sql`
      INSERT INTO zenflix_category (id, name, "createdAt")
      VALUES (${id}, ${`Category ${id}`}, NOW())
    `;
  }

  await sql`
    SELECT setval(
      pg_get_serial_sequence('zenflix_category', 'id'),
      (SELECT MAX(id) FROM zenflix_category)
    )
  `;
}

async function runDataScripts() {
  for (const tablePrefix of DATA_SCRIPT_ORDER) {
    const filePath = resolveDataScript(tablePrefix);
    console.log(`Running ${filePath}...`);
    await runSqlFile(filePath);

    if (tablePrefix === "zenflix_category") {
      await ensureMissingCategories();
    }

    console.log(`Done ${tablePrefix}`);
  }
}

async function seed() {
  console.log("Seeding database...");

  await ensureSeedUsers();
  await clearSeedTables();
  await runDataScripts();

  console.log("Seed complete!");
  if (process.env.NODE_ENV !== "production") {
    console.log("Admin: admin@zenflix.com / admin123");
  }
  await sql.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
