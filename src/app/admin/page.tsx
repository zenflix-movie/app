import { api } from "~/trpc/server";

export default async function AdminDashboard() {
  const categories = await api.categories.list();

  const stats = [
    { label: "Videos", value: "—" },
    { label: "Categories", value: categories.length },
    { label: "Users", value: "—" },
    { label: "Reviews", value: "—" },
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
