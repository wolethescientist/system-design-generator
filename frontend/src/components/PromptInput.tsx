"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-2 relative">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe the system or diagram you want to generate..."
        className="min-h-[120px] resize-none pr-12 pb-4 pt-4 text-base focus-visible:ring-blue-500 shadow-sm"
        disabled={isLoading}
      />
      <div className="absolute bottom-3 right-3">
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!prompt.trim() || isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 w-10 shadow-md"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
