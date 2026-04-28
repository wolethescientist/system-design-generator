"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { PromptInput } from "@/components/PromptInput";
import { TypeSelector } from "@/components/TypeSelector";
import { DiagramRenderer } from "@/components/DiagramRenderer";
import { CodeBlock } from "@/components/CodeBlock";
import { ExportButtons } from "@/components/ExportButtons";
import { fetchWithAuth } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [diagramType, setDiagramType] = useState("flowchart");
  const [useContext, setUseContext] = useState(false);
  const [diagramCode, setDiagramCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleGenerate = async (prompt: string) => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setDiagramCode("");

    try {
      const response = await fetchWithAuth("/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          diagram_type: diagramType,
          use_context: useContext,
        }),
      });

      const data = await response.json();
      if (data.diagram_code) {
        setDiagramCode(data.diagram_code);
        toast.success("Diagram generated successfully");
      } else {
        throw new Error("No diagram code returned");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate diagram");
    } finally {
      setIsGenerating(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar />

      <main className="flex-1 ml-80 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b px-8 py-6 shadow-sm">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              Create Diagram
            </h1>
            <p className="text-sm text-slate-500">
              Describe your architecture or flow, and let AI generate a Mermaid diagram.
            </p>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-12">
            {/* Input Section */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <TypeSelector
                diagramType={diagramType}
                setDiagramType={setDiagramType}
                useContext={useContext}
                setUseContext={setUseContext}
                isLoading={isGenerating}
              />
              <div className="mt-6">
                <PromptInput onSubmit={handleGenerate} isLoading={isGenerating} />
              </div>
            </div>

            {/* Results Section */}
            {(isGenerating || diagramCode) && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-800">Result</h2>
                  <ExportButtons 
                    code={diagramCode} 
                    showCode={showCode} 
                    onToggleCode={() => setShowCode(!showCode)} 
                  />
                </div>

                <div className="bg-white p-2 rounded-xl border shadow-sm min-h-[400px]">
                  {showCode ? (
                    <CodeBlock code={diagramCode} />
                  ) : (
                    <DiagramRenderer code={diagramCode} isLoading={isGenerating} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
