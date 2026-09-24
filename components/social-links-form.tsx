"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { updateSocialLinks } from "@/app/actions";

export function SocialLinksForm({
  user,
}: {
  user: { twitter: string; github: string; linkedin: string; website: string };
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const data = {
      twitter: (formData.get("twitter") as string) || "",
      github: (formData.get("github") as string) || "",
      linkedin: (formData.get("linkedin") as string) || "",
      website: (formData.get("website") as string) || "",
    };

    try {
      await updateSocialLinks(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Couldn't save — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 max-w-md space-y-4">
      <div className="space-y-2">
        <label htmlFor="twitter" className="text-sm font-medium">Twitter (X)</label>
        <input
          id="twitter"
          name="twitter"
          type="text"
          defaultValue={user.twitter}
          placeholder="username"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="github" className="text-sm font-medium">GitHub</label>
        <input
          id="github"
          name="github"
          type="text"
          defaultValue={user.github}
          placeholder="username"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="linkedin" className="text-sm font-medium">LinkedIn</label>
        <input
          id="linkedin"
          name="linkedin"
          type="text"
          defaultValue={user.linkedin}
          placeholder="username or profile link"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="website" className="text-sm font-medium">Website</label>
        <input
          id="website"
          name="website"
          type="url"
          defaultValue={user.website}
          placeholder="https://example.com"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save Links
        </button>
        {success && <span className="text-sm text-green-600 dark:text-green-500">Saved successfully!</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  );
}
