import postgres from "postgres";
import { hash } from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const sql = postgres(url);

async function seed() {
  console.log("Seeding database...");

  const passwordHash = await hash("admin123", 12);
  const id = crypto.randomUUID();

  await sql`
    INSERT INTO zenflix_user (id, email, name, "firstName", "lastName", "passwordHash", role)
    SELECT ${id}, 'admin@zenflix.com', 'Admin User', 'Admin', 'User', ${passwordHash}, 'admin'
    WHERE NOT EXISTS (SELECT 1 FROM zenflix_user WHERE email = 'admin@zenflix.com')
  `;

  const categories = [
    ["Action", "High-octane action films"],
    ["Comedy", "Laugh-out-loud comedies"],
    ["Drama", "Compelling dramatic stories"],
    ["Sci-Fi", "Science fiction adventures"],
    ["Horror", "Spine-chilling horror films"],
    ["Documentary", "Real-world documentaries"],
    ["Animation", "Animated features for all ages"],
    ["Thriller", "Edge-of-your-seat thrillers"],
  ];

  for (const [name, description] of categories as [string, string][]) {
    await sql`
      INSERT INTO zenflix_category (name, description, "createdAt")
      VALUES (${name}, ${description}, NOW())
      ON CONFLICT (name) DO NOTHING
    `;
  }

  console.log("Seed complete!");
  if (process.env.NODE_ENV !== "production") {
    console.log("Admin: admin@zenflix.com / admin123");
  }
  await sql.end();
}

seed().catch((e) => { console.error(e); process.exit(1); });
