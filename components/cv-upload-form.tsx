"use client";

import { useState, useRef } from "react";
import { Loader2, FileText, Upload, Trash2, Check } from "lucide-react";
import { updateCV } from "@/app/actions";
import { useRouter } from "next/navigation";

export function CVUploadForm({ cvUrl }: { cvUrl: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(cvUrl);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      const url = data.url;
      setCurrentUrl(url);
      await updateCV(url);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete() {
    setUploading(true);
    setError(null);
    try {
      await updateCV("");
      setCurrentUrl("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-6">
        <div className="relative group">
          <div className="size-20 overflow-hidden rounded-xl border-2 border-border bg-muted flex items-center justify-center">
            {currentUrl ? (
              <FileText className="size-8 text-foreground" />
            ) : (
              <Upload className="size-8 text-muted-foreground" />
            )}
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin text-white" />
            ) : (
              <Upload className="size-5 text-white" />
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="hidden"
          />
        </div>
        <div className="text-sm text-muted-foreground flex-1">
          <p className="font-medium text-foreground">
            {currentUrl ? "CV uploaded" : "No CV uploaded"}
          </p>
          <p>Click the icon to upload a PDF. <br /> Maximum size: 10MB.</p>
        </div>
        {currentUrl && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading}
            className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            title="Remove CV"
          >
            <Trash2 className="size-5" />
          </button>
        )}
      </div>

      {error && <p className="text-sm text-destructive mt-4">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-600 mt-4 flex items-center gap-1">
          <Check className="size-4" /> CV saved successfully
        </p>
      )}
    </div>
  );
}
