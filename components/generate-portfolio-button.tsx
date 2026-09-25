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
      const result = await generatePortfolio();
      if (!result.success) {
        alert(result.error);
        return;
      }
      router.push(`/${username}`);
    } catch (error) {
      console.error(error);
      alert((error as any).message || "Failed to generate portfolio.");
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
