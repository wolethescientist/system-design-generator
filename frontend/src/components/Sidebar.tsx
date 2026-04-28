"use client";

import { useAuth } from "@/contexts/AuthContext";
import { DocumentUploader } from "./DocumentUploader";
import { DocumentList } from "./DocumentList";
import { useState } from "react";
import { LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="w-80 border-r bg-white h-screen flex flex-col fixed left-0 top-0 bottom-0 overflow-hidden shadow-sm z-10">
      <div className="p-6 border-b flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">DiagramAI</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-6">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Context Documents
          </h2>
          <DocumentUploader onUploadSuccess={handleUploadSuccess} />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Uploaded Files
          </h2>
          <DocumentList refreshTrigger={refreshTrigger} />
        </div>
      </div>

      <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
        <div className="flex flex-col truncate pr-2">
          <span className="text-sm font-medium text-slate-900 truncate">
            {user?.email || "User"}
          </span>
          <span className="text-xs text-slate-500">Pro Plan</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="text-slate-500 hover:text-red-600 hover:bg-red-50 shrink-0"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
