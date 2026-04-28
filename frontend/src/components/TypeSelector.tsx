"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TypeSelectorProps {
  diagramType: string;
  setDiagramType: (val: string) => void;
  useContext: boolean;
  setUseContext: (val: boolean) => void;
  isLoading: boolean;
}

const DIAGRAM_TYPES = [
  { id: "flowchart", label: "Flowchart" },
  { id: "sequence", label: "Sequence Diagram" },
  { id: "class", label: "Class Diagram" },
  { id: "state", label: "State Diagram" },
  { id: "er", label: "ER Diagram" },
  { id: "user-journey", label: "User Journey" },
  { id: "gantt", label: "Gantt Chart" },
  { id: "pie", label: "Pie Chart" },
];

export function TypeSelector({
  diagramType,
  setDiagramType,
  useContext,
  setUseContext,
  isLoading,
}: TypeSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
      <div className="flex items-center gap-3">
        <Label htmlFor="diagram-type" className="text-sm font-medium text-slate-700">
          Diagram Type
        </Label>
        <Select
          value={diagramType}
          onValueChange={(val) => setDiagramType(val || "")}
          disabled={isLoading}
        >
          <SelectTrigger id="diagram-type" className="w-[180px] bg-white border-slate-200">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {DIAGRAM_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-md border border-blue-100">
        <Checkbox
          id="use-context"
          checked={useContext}
          onCheckedChange={(checked) => setUseContext(checked as boolean)}
          disabled={isLoading}
          className="data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
        />
        <Label
          htmlFor="use-context"
          className="text-sm font-medium text-blue-900 cursor-pointer"
        >
          Use uploaded documents as context
        </Label>
      </div>
    </div>
  );
}
