"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Camera, UserCircle2 } from "lucide-react";
import { updateAccountDetails } from "@/app/actions";
import { useRouter } from "next/navigation";

export function AccountSettingsForm({
  user,
}: {
  user: { name: string; username: string; image: string };
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user.name || "",
    username: user.username || "",
  });
  
  const [imagePreview, setImagePreview] = useState(user.image || "");
  
  // When user prop changes (e.g. after refresh), update state
  useEffect(() => {
    setFormData({
      name: user.name || "",
      username: user.username || "",
    });
    setImagePreview(user.image || "");
  }, [user]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = 
    formData.name !== (user.name || "") ||
    formData.username !== (user.username || "") ||
    imagePreview !== (user.image || "");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      setImagePreview(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isDirty) return;
    
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await updateAccountDetails({
        ...formData,
        image: imagePreview,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      
      // Always refresh to grab new data. If username changed, update UI accordingly
      router.refresh();
      
      // If we changed username, we might need a full navigation if current URL has old username, 
      // but in settings we don't have username in the URL (it's /settings). So refresh is enough!
    } catch (err: any) {
      setError(err.message || "Couldn't save — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 max-w-xl">
      <div className="mb-8 flex items-center gap-6">
        <div className="relative group">
          <div className="size-20 overflow-hidden rounded-full border-2 border-border bg-muted flex items-center justify-center">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" className="size-full object-cover" />
            ) : (
              <UserCircle2 className="size-10 text-muted-foreground" />
            )}
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin text-white" />
            ) : (
              <Camera className="size-5 text-white" />
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Profile Picture</p>
          <p>Click the image to upload a new one. <br /> JPEG, PNG, WEBP, up to 10MB.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Display Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-medium">Username</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">/</span>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="username"
              className="flex h-10 w-full rounded-md border border-input bg-background pl-6 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">This changes your site URL.</p>
        </div>
      </div>
      
      <div className="mt-6 flex flex-wrap items-center gap-4 min-h-10">
        {isDirty && (
          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-6 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 animate-in fade-in zoom-in-95 duration-200"
          >
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save changes
          </button>
        )}
        {success && <span className="text-sm font-medium text-green-600 dark:text-green-500 animate-in fade-in slide-in-from-left-2">Saved successfully!</span>}
        {error && <span className="text-sm font-medium text-destructive animate-in fade-in slide-in-from-left-2">{error}</span>}
      </div>
    </form>
  );
}
