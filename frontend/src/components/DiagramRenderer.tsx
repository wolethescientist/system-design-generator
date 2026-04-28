"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Loader2, ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiagramRendererProps {
  code: string;
  isLoading?: boolean;
}

export function DiagramRenderer({ code, isLoading }: DiagramRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panZoomRef = useRef<ReturnType<typeof import("svg-pan-zoom")> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "inherit",
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code || !containerRef.current) return;

      try {
        setError(null);

        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
          resizeObserverRef.current = null;
        }
        if (panZoomRef.current) {
          panZoomRef.current.destroy();
          panZoomRef.current = null;
        }
        containerRef.current.innerHTML = "";

        const { svg } = await mermaid.render(`mermaid-${Date.now()}`, code);
        containerRef.current.innerHTML = svg;

        const svgEl = containerRef.current.querySelector("svg") as SVGSVGElement | null;
        if (svgEl) {
          // svg-pan-zoom needs an explicit size, not the auto-fit one mermaid emits
          svgEl.removeAttribute("style");
          svgEl.setAttribute("width", "100%");
          svgEl.setAttribute("height", "100%");
          svgEl.style.maxWidth = "none";
          svgEl.style.maxHeight = "none";

          const { default: svgPanZoom } = await import("svg-pan-zoom");
          const pz = svgPanZoom(svgEl, {
            zoomEnabled: true,
            controlIconsEnabled: false,
            fit: true,
            center: true,
            minZoom: 0.2,
            maxZoom: 10,
            zoomScaleSensitivity: 0.4,
            dblClickZoomEnabled: true,
            mouseWheelZoomEnabled: true,
            preventMouseEventsDefault: true,
          });
          panZoomRef.current = pz;

          // The first fit/center runs before flex layout settles, leaving the
          // diagram pinned to the top with empty space below. Re-fit after a
          // frame and on subsequent container resizes.
          const refit = () => {
            pz.resize();
            pz.fit();
            pz.center();
          };
          requestAnimationFrame(refit);

          if (containerRef.current) {
            const ro = new ResizeObserver(refit);
            ro.observe(containerRef.current);
            resizeObserverRef.current = ro;
          }
        }
      } catch (err: unknown) {
        console.error("Mermaid syntax error:", err);
        setError("Invalid syntax or unsupported diagram format.");
      }
    };

    if (!isLoading && code) {
      renderDiagram();
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (panZoomRef.current) {
        panZoomRef.current.destroy();
        panZoomRef.current = null;
      }
    };
  }, [code, isLoading]);

  const handleZoomIn = () => panZoomRef.current?.zoomIn();
  const handleZoomOut = () => panZoomRef.current?.zoomOut();
  const handleReset = () => {
    panZoomRef.current?.resetZoom();
    panZoomRef.current?.resetPan();
  };
  const handleFit = () => {
    panZoomRef.current?.fit();
    panZoomRef.current?.center();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 min-h-[400px] border rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-500 font-medium">Generating diagram...</p>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-50 min-h-[400px] border rounded-lg text-slate-400">
        No diagram generated yet.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] bg-white border rounded-lg overflow-hidden">
      {error ? (
        <div className="flex items-center justify-center h-full text-red-500 text-sm">{error}</div>
      ) : (
        <>
          <div
            ref={containerRef}
            id="mermaid-diagram-container"
            data-diagram-container="true"
            className="w-full h-full min-h-[400px] cursor-grab active:cursor-grabbing"
          />
          <div className="absolute bottom-3 right-3 flex flex-col gap-1 bg-white/90 backdrop-blur border border-slate-200 rounded-lg shadow-sm p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleZoomIn}
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleZoomOut}
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleFit}
              title="Fit to screen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleReset}
              title="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
