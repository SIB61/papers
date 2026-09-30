"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, BookOpen, Globe, X, ChevronDown, Plus } from "lucide-react";
import { updateSocialLinks } from "@/app/actions";
import { Whatsapp, Twitter, Github, Linkedin } from "@/components/icons";
import type { User } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type Platform = "contactEmail" | "whatsapp" | "twitter" | "github" | "linkedin" | "medium" | "website";

const PLATFORMS: { id: Platform, label: string, icon: React.FC<any>, placeholder: string, type: string }[] = [
  { id: "contactEmail", label: "Email", icon: Mail, placeholder: "hello@example.com", type: "email" },
  { id: "whatsapp", label: "WhatsApp", icon: Whatsapp, placeholder: "+1234567890", type: "text" },
  { id: "twitter", label: "Twitter (X)", icon: Twitter, placeholder: "username", type: "text" },
  { id: "github", label: "GitHub", icon: Github, placeholder: "username", type: "text" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "username or profile link", type: "text" },
  { id: "medium", label: "Medium", icon: BookOpen, placeholder: "username", type: "text" },
  { id: "website", label: "Website", icon: Globe, placeholder: "https://example.com", type: "url" },
];

export function SocialLinksForm({ user }: { user: User }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    contactEmail: user.contactEmail || "",
    whatsapp: user.whatsapp || "",
    twitter: user.twitter || "",
    github: user.github || "",
    linkedin: user.linkedin || "",
    medium: user.medium || "",
    website: user.website || "",
  });

  const [activePlatforms, setActivePlatforms] = useState<Platform[]>(() => {
    return PLATFORMS.filter(p => user[p.id]).map(p => p.id);
  });

  useEffect(() => {
    setFormData({
      contactEmail: user.contactEmail || "",
      whatsapp: user.whatsapp || "",
      twitter: user.twitter || "",
      github: user.github || "",
      linkedin: user.linkedin || "",
      medium: user.medium || "",
      website: user.website || "",
    });
    setActivePlatforms(PLATFORMS.filter(p => user[p.id]).map(p => p.id));
    setIsAdding(false);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDirty = 
    PLATFORMS.some(p => (formData[p.id] || "").trim() !== (user[p.id] || "")) ||
    activePlatforms.some(id => !user[id]);

  function handleChange(id: Platform, value: string) {
    setFormData((prev) => ({ ...prev, [id]: value }));
  }

  function handleRemove(id: Platform) {
    setActivePlatforms(prev => prev.filter(p => p !== id));
    setFormData(prev => ({ ...prev, [id]: "" }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isDirty) return;
    
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateSocialLinks(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      router.refresh();
    } catch {
      setError("Couldn't save — try again.");
    } finally {
      setSaving(false);
    }
  }

  const availablePlatforms = PLATFORMS.filter(p => !activePlatforms.includes(p.id));
  const canAddNew = availablePlatforms.length > 0;

  return (
    <form onSubmit={handleSubmit} className="mt-4 max-w-xl">
      <div className="flex flex-col gap-4">
        {activePlatforms.map(id => {
          const platform = PLATFORMS.find(p => p.id === id)!;
          const Icon = platform.icon;
          return (
            <div key={id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 animate-in fade-in slide-in-from-top-1">
              <div className="flex h-10 items-center justify-between sm:w-40 shrink-0 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Icon className="size-4" />
                  <span>{platform.label}</span>
                </div>
              </div>
              <div className="relative flex-1 flex items-center gap-2">
                <input
                  type={platform.type}
                  value={formData[id]}
                  onChange={(e) => handleChange(id, e.target.value)}
                  placeholder={platform.placeholder}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(id)}
                  className="shrink-0 p-2 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-muted"
                  title="Remove"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          );
        })}

        {isAdding && canAddNew && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 animate-in fade-in slide-in-from-top-1">
            <div className="relative sm:w-40 shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span>Select platform...</span>
                <ChevronDown className={cn("size-4 transition-transform", dropdownOpen && "rotate-180")} />
              </button>
              
              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-md border border-border bg-popover p-1 shadow-md animate-in fade-in zoom-in-95">
                  {availablePlatforms.map(p => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setActivePlatforms([...activePlatforms, p.id]);
                          setDropdownOpen(false);
                          setIsAdding(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-popover-foreground hover:bg-muted hover:text-accent-foreground transition-colors"
                      >
                        <Icon className="size-4" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="relative flex-1 flex items-center gap-2">
              <input
                type="text"
                disabled
                placeholder="Select a platform first"
                className="flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all cursor-not-allowed opacity-70"
              />
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="shrink-0 p-2 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-muted"
                title="Cancel"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex flex-wrap items-center gap-4 min-h-10">
        {isDirty && (
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-6 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 animate-in fade-in zoom-in-95 duration-200"
          >
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save changes
          </button>
        )}
        
        {canAddNew && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-in fade-in zoom-in-95 duration-200"
          >
            <Plus className="mr-2 size-4" />
            Add link
          </button>
        )}
        
        {success && <span className="text-sm font-medium text-green-600 dark:text-green-500 animate-in fade-in slide-in-from-left-2">Saved successfully!</span>}
        {error && <span className="text-sm font-medium text-destructive animate-in fade-in slide-in-from-left-2">{error}</span>}
      </div>
    </form>
  );
}
