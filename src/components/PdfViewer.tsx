import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

// Use the worker bundled with pdfjs-dist (works offline)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type Props = { url: string; title: string };

export function PdfViewer({ url, title }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPage(1);
  }, [url]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth - 8));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-background/60 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-accent disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground tabular-nums">
            Page {page} / {numPages || "…"}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(numPages || p, p + 1))}
            disabled={page >= numPages}
            className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-accent disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)))}
            className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-accent"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground tabular-nums w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2.5, +(s + 0.1).toFixed(2)))}
            className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-accent"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-xs px-2 py-1 rounded-md border border-border hover:bg-accent"
          >
            Open ↗
          </a>
        </div>
      </div>
      <div
        ref={containerRef}
        className="max-h-[85vh] overflow-auto bg-neutral-900/50 p-2 flex justify-center"
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<p className="text-sm text-muted-foreground p-6">Loading PDF…</p>}
          error={
            <div className="p-6 text-sm text-muted-foreground">
              Couldn't load this PDF inline.{" "}
              <a className="underline" href={url} target="_blank" rel="noopener noreferrer">
                Open in a new tab
              </a>
              .
            </div>
          }
        >
          <Page
            pageNumber={page}
            scale={scale}
            width={width ? width * scale : undefined}
            renderAnnotationLayer
            renderTextLayer
          />
        </Document>
      </div>
      <span className="sr-only">{title}</span>
    </div>
  );
}
