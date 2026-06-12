"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ProfileCard } from "~/components/profile/ProfileCard";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { api } from "~/trpc/react";

export default function ProfilesPage() {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);

  const { data: profiles, refetch } = api.profiles.list.useQuery();
  const [selecting, setSelecting] = useState(false);

  async function selectProfile(profileId: string) {
    setSelecting(true);
    const res = await fetch("/api/profile/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
    });
    if (res.ok) {
      router.push("/browse");
    } else {
      setSelecting(false);
    }
  }

  const createProfile = api.profiles.create.useMutation({
    onSuccess: () => {
      void refetch();
      setNewName("");
      setOpen(false);
    },
  });

  return (
    <main className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center gap-8 px-4">
      <h1 className="text-3xl font-semibold">Who&apos;s watching?</h1>

      <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
        {profiles?.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onClick={() => !selecting && void selectProfile(profile.id)}
          />
        ))}

        {(profiles?.length ?? 0) < 5 && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="flex flex-col items-center gap-3 p-4 rounded-xl hover:scale-105 transition-transform">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Add Profile</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Profile</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newName.trim()) createProfile.mutate({ name: newName.trim() });
                }}
                className="space-y-4"
              >
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Profile name"
                  required
                />
                <Button type="submit" className="w-full" disabled={createProfile.isPending}>
                  Create
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </main>
  );
}
