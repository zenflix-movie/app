"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

export function CategoryTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category") ?? "all";

  const { data: categories } = api.categories.list.useQuery();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    router.push(`/browse?${params.toString()}`);
  }

  return (
    <Tabs value={categoryId} onValueChange={handleChange}>
      <div className="overflow-x-auto">
      <TabsList className="h-auto gap-1 flex-nowrap sm:flex-wrap w-max sm:w-auto">
        <TabsTrigger value="all">All</TabsTrigger>
        {categories?.map((cat) => (
          <TabsTrigger key={cat.id} value={String(cat.id)}>
            {cat.name}
          </TabsTrigger>
        ))}
      </TabsList>
      </div>
    </Tabs>
  );
}
