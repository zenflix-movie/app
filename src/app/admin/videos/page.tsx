import { api, HydrateClient } from "~/trpc/server";
import { AdminVideosClient } from "./AdminVideosClient";

export default async function AdminVideosPage() {
  const categories = await api.categories.list();

  return (
    <HydrateClient>
      <AdminVideosClient categories={categories} />
    </HydrateClient>
  );
}
