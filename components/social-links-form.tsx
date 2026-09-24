"use client";

import { useState } from "react";
import { Loader2, Globe, Mail } from "lucide-react";
import { updateSocialLinks } from "@/app/actions";
import { Twitter, Github, Linkedin, Whatsapp } from "@/components/icons";

export function SocialLinksForm({
  user,
}: {
  user: { twitter: string; github: string; linkedin: string; website: string; contactEmail: string; whatsapp: string };
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
      contactEmail: (formData.get("contactEmail") as string) || "",
      whatsapp: (formData.get("whatsapp") as string) || "",
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
    <form onSubmit={handleSubmit} className="mt-4 max-w-xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="contactEmail" className="text-sm font-medium">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={user.contactEmail}
              placeholder="hello@example.com"
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp</label>
          <div className="relative">
            <Whatsapp className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="whatsapp"
              name="whatsapp"
              type="text"
              defaultValue={user.whatsapp}
              placeholder="+1234567890"
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="twitter" className="text-sm font-medium">Twitter (X)</label>
          <div className="relative">
            <Twitter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="twitter"
              name="twitter"
              type="text"
              defaultValue={user.twitter}
              placeholder="username"
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="github" className="text-sm font-medium">GitHub</label>
          <div className="relative">
            <Github className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="github"
              name="github"
              type="text"
              defaultValue={user.github}
              placeholder="username"
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="linkedin" className="text-sm font-medium">LinkedIn</label>
          <div className="relative">
            <Linkedin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="linkedin"
              name="linkedin"
              type="text"
              defaultValue={user.linkedin}
              placeholder="username or profile link"
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="website" className="text-sm font-medium">Website</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="website"
              name="website"
              type="url"
              defaultValue={user.website}
              placeholder="https://example.com"
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-6 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save changes
        </button>
        {success && <span className="text-sm font-medium text-green-600 dark:text-green-500 animate-in fade-in slide-in-from-left-2">Saved successfully!</span>}
        {error && <span className="text-sm font-medium text-destructive animate-in fade-in slide-in-from-left-2">{error}</span>}
      </div>
    </form>
  );
}
