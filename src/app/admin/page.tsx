import { count } from "drizzle-orm";
import { db } from "~/server/db";
import { categories, reviews, users, videos } from "~/server/db/schema";

export default async function AdminDashboard() {
  const [videoStats, categoryStats, userStats, reviewStats] = await Promise.all([
    db.select({ value: count() }).from(videos),
    db.select({ value: count() }).from(categories),
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(reviews),
  ]);

  const stats = [
    { label: "Videos", value: videoStats[0]?.value ?? 0 },
    { label: "Categories", value: categoryStats[0]?.value ?? 0 },
    { label: "Users", value: userStats[0]?.value ?? 0 },
    { label: "Reviews", value: reviewStats[0]?.value ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
