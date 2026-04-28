"use client";

import { useEffect, useState } from "react";
import { FileText, Trash2, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export interface Document {
  id: string;
  filename: string;
  created_at: string;
}

interface DocumentListProps {
  refreshTrigger: number;
}

export function DocumentList({ refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth("/documents");
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    try {
      await fetchWithAuth(`/documents/${id}`, {
        method: "DELETE",
      });
      toast.success("Document deleted");
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete document");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-4 text-sm text-slate-500 bg-white rounded-lg border">
        No documents uploaded yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-3 bg-white border rounded-md hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <FileText className="h-5 w-5 text-blue-500 shrink-0" />
            <span className="text-sm font-medium text-slate-700 truncate">
              {doc.filename}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(doc.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
            title="Delete context"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
