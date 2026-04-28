"use client";

import { Download, Code, ChevronDown, FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface ExportButtonsProps {
  code: string;
  onToggleCode: () => void;
  showCode: boolean;
}

function getSvgElement(): SVGSVGElement | null {
  const container = document.getElementById("mermaid-diagram-container");
  if (container) {
    const svg = container.querySelector("svg");
    if (svg) return svg as SVGSVGElement;
  }
  // Fallback: search the entire document
  return document.querySelector("svg") as SVGSVGElement | null;
}

async function svgToPngDataUrl(svg: SVGSVGElement): Promise<string> {
  const rect = svg.getBoundingClientRect();
  const width = rect.width || svg.viewBox.baseVal.width || 800;
  const height = rect.height || svg.viewBox.baseVal.height || 600;

  // Clone so we can set explicit attributes without mutating the live DOM
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));

  const svgStr = new XMLSerializer().serializeToString(clone);

  // Use a base64 data URL (not a blob: URL) to keep the canvas un-tainted —
  // blob: URLs of SVGs containing <foreignObject> or external refs trigger
  // "Tainted canvases may not be exported" on toDataURL().
  const utf8Bytes = new TextEncoder().encode(svgStr);
  let binary = "";
  for (let i = 0; i < utf8Bytes.length; i++) binary += String.fromCharCode(utf8Bytes[i]);
  const svgDataUrl = "data:image/svg+xml;charset=utf-8;base64," + btoa(binary);

  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load SVG for rasterization"));
    img.src = svgDataUrl;
  });

  const scale = 2; // Retina-quality
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/png");
}

export function ExportButtons({ code, onToggleCode, showCode }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleExportSvg = () => {
    if (!code) return;
    try {
      setIsExporting(true);
      const svg = getSvgElement();
      if (!svg) throw new Error("No rendered SVG found. Make sure the diagram is visible.");

      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `diagram-${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("SVG exported successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to export SVG");
    } finally {
      setIsExporting(false);
      setDropdownOpen(false);
    }
  };

  const handleExportPng = async () => {
    if (!code) return;
    try {
      setIsExporting(true);
      const svg = getSvgElement();
      if (!svg) throw new Error("No rendered SVG found. Make sure the diagram is visible.");

      const dataUrl = await svgToPngDataUrl(svg);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `diagram-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PNG exported successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to export PNG");
    } finally {
      setIsExporting(false);
      setDropdownOpen(false);
    }
  };

  const handleExportJpg = async () => {
    if (!code) return;
    try {
      setIsExporting(true);
      const svg = getSvgElement();
      if (!svg) throw new Error("No rendered SVG found. Make sure the diagram is visible.");

      const pngDataUrl = await svgToPngDataUrl(svg);

      // Convert PNG to JPG via a second canvas
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = pngDataUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const jpgDataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.href = jpgDataUrl;
      link.download = `diagram-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("JPG exported successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to export JPG");
    } finally {
      setIsExporting(false);
      setDropdownOpen(false);
    }
  };

  const handleExportPdf = async () => {
    if (!code) return;
    try {
      setIsExporting(true);
      const svg = getSvgElement();
      if (!svg) throw new Error("No rendered SVG found. Make sure the diagram is visible.");

      const pngDataUrl = await svgToPngDataUrl(svg);
      const { jsPDF } = await import("jspdf");

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = pngDataUrl;
      });

      const imgWidth = img.width / 2; // undo the retina scale
      const imgHeight = img.height / 2;

      // A4 in px at 96dpi: 794 x 1123 — use landscape if diagram is wide
      const isLandscape = imgWidth > imgHeight;
      const pdf = new jsPDF({ orientation: isLandscape ? "landscape" : "portrait", unit: "px" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Scale image to fit within page margins
      const margin = 24;
      const maxW = pageWidth - margin * 2;
      const maxH = pageHeight - margin * 2;
      const ratio = Math.min(maxW / imgWidth, maxH / imgHeight, 1);

      const finalW = imgWidth * ratio;
      const finalH = imgHeight * ratio;
      const x = (pageWidth - finalW) / 2;
      const y = (pageHeight - finalH) / 2;

      pdf.addImage(pngDataUrl, "PNG", x, y, finalW, finalH);
      pdf.save(`diagram-${Date.now()}.pdf`);
      toast.success("PDF exported successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to export PDF");
    } finally {
      setIsExporting(false);
      setDropdownOpen(false);
    }
  };

  if (!code) return null;

  const exportOptions = [
    { label: "Export SVG", icon: <FileImage className="h-4 w-4" />, action: handleExportSvg, ext: "SVG" },
    { label: "Export PNG", icon: <FileImage className="h-4 w-4" />, action: handleExportPng, ext: "PNG" },
    { label: "Export JPG", icon: <FileImage className="h-4 w-4" />, action: handleExportJpg, ext: "JPG" },
    { label: "Export PDF", icon: <FileText className="h-4 w-4" />, action: handleExportPdf, ext: "PDF" },
  ];

  return (
    <div className="flex gap-2 items-center">
      <Button
        variant="outline"
        className="flex items-center gap-2 border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
        onClick={onToggleCode}
      >
        <Code className="h-4 w-4" />
        {showCode ? "Hide Code" : "Show Code"}
      </Button>

      {/* Export dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Button
          className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800"
          onClick={() => setDropdownOpen((v) => !v)}
          disabled={isExporting}
        >
          <Download className="h-4 w-4" />
          {isExporting ? "Exporting..." : "Export"}
          <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </Button>

        {dropdownOpen && (
          <>
            {/* Backdrop to close on outside click */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
              {exportOptions.map((opt) => (
                <button
                  key={opt.ext}
                  onClick={opt.action}
                  disabled={isExporting}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
