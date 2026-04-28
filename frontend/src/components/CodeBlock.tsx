"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
}

export function CodeBlock({ code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  if (!code) {
    return null;
  }

  return (
    <div className="relative group rounded-md bg-slate-950 p-4 overflow-hidden border border-slate-800">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
        title="Copy code"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="overflow-auto text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
        {code}
      </pre>
    </div>
  );
}
