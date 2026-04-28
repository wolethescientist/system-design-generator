"use client";

import { useState } from "react";
import { Upload, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/api";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface DocumentUploaderProps {
  onUploadSuccess: () => void;
}

export function DocumentUploader({ onUploadSuccess }: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Simulate progress since fetch doesn't natively support upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetchWithAuth("/documents/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();
      toast.success("Document uploaded successfully");
      onUploadSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document");
      setProgress(0);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-md p-6 bg-slate-50 relative hover:bg-slate-100 transition-colors">
        <input
          type="file"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileChange}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
        />
        {isUploading ? (
          <div className="flex flex-col items-center text-slate-600 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Embedding Document...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-600 gap-2">
            <FileUp className="h-8 w-8 text-blue-600" />
            <span className="text-sm font-medium text-center">Click or drag file to upload context</span>
            <span className="text-xs text-slate-400">PDF, DOCX, TXT, MD</span>
          </div>
        )}
      </div>
      {isUploading && <Progress value={progress} className="h-2 w-full" />}
    </div>
  );
}
