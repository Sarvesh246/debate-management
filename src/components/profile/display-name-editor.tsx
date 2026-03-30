"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_LEN = 80;

interface DisplayNameEditorProps {
  initialName: string;
  authenticated: boolean;
}

export function DisplayNameEditor({ initialName, authenticated }: DisplayNameEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialName);

  if (!authenticated) {
    return (
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Display name</div>
        <div className="text-lg font-medium">{initialName}</div>
        <p className="text-xs text-muted-foreground">
          Connect Supabase Auth to choose a custom display name.
        </p>
      </div>
    );
  }

  function cancel() {
    setValue(initialName);
    setEditing(false);
  }

  function save() {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      toast.error("Display name cannot be empty.");
      return;
    }
    if (trimmed.length > MAX_LEN) {
      toast.error(`Display name must be ${MAX_LEN} characters or fewer.`);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast.error("Could not update display name in this environment.");
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setEditing(false);
      toast.success("Display name updated.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="display-name" className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Display name
          </Label>
          {editing ? (
            <Input
              id="display-name"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={MAX_LEN}
              disabled={isPending}
              autoComplete="name"
              className="max-w-md"
            />
          ) : (
            <div className="text-lg font-medium leading-7">{initialName}</div>
          )}
        </div>
        {editing ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={cancel} disabled={isPending}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)} className="shrink-0">
            <Pencil className="size-3.5" />
            Rename
          </Button>
        )}
      </div>
      {editing ? (
        <p className="text-xs text-muted-foreground">
          Shown in the header and profile. {value.trim().length}/{MAX_LEN} characters.
        </p>
      ) : null}
    </div>
  );
}
