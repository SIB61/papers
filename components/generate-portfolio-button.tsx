"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generatePortfolio } from "@/app/ai-actions";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export function GeneratePortfolioButton({ username }: { username: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await generatePortfolio();
      router.push(`/${username}`);
    } catch (error) {
      console.error(error);
      alert("Failed to generate portfolio. Make sure GEMINI_API_KEY is set in your environment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="secondary" 
      size="sm" 
      className="gap-2 h-9 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20"
      onClick={handleGenerate}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      {loading ? "Generating..." : "AI Portfolio"}
    </Button>
  );
}
