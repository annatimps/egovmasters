import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

// Keep the PDF.js worker bundled from the installed pdfjs-dist package so its
// version exactly matches the renderer used by react-pdf.
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type Props = { url: string; title: string };

type PdfCheckState =
  | { status: "checking" }
  | { status: "ready" }
  | { status: "error"; message: string; statusCode?: number; contentType?: string };

function isPdfContentType(contentType: string | null) {
  return (contentType ?? "").toLowerCase().includes("application/pdf");
}

async function checkPdfResponse(url: string, signal: AbortSignal): Promise<PdfCheckState> {
  const response = await fetch(url, { method: "HEAD", signal, cache: "no-store" });
  const contentType = response.headers.get("content-type") ?? "";

  if (response.status !== 200) {
    return {
      status: "error",
      message: `Expected a 200 response for the PDF, but received ${response.status}.`,
      statusCode: response.status,
      contentType,
    };
  }

  if (!isPdfContentType(contentType)) {
    const likelyHtmlFallback = contentType.toLowerCase().includes("text/html");
    return {
      status: "error",
      message: likelyHtmlFallback
        ? "This URL returned HTML instead of a PDF, which usually means the app fallback page is being served for a missing file."
        : "This URL did not return a PDF response.",
      statusCode: response.status,
      contentType,
    };
  }

  return { status: "ready" };
}

export function PdfViewer({ url, title }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.1);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const [retryKey, setRetryKey] = useState(0);
  const [pdfCheck, setPdfCheck] = useState<PdfCheckState>({ status: "checking" });
  const [renderError, setRenderError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => setWidth(Math.max(280, el.clientWidth - 16));
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    updateWidth();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setPdfCheck({ status: "checking" });
    setRenderError(null);
    setNumPages(0);

    checkPdfResponse(url, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setPdfCheck(result);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : String(error);
        setPdfCheck({ status: "error", message: `Could not verify the PDF response: ${message}` });
      });

    return () => controller.abort();
  }, [url, retryKey]);

  const handleRetry = () => {
    setRetryKey((k) => k + 1);
    setNumPages(0);
    setRenderError(null);
  };

  const handleLoadError = (error: Error) => {
    console.error("PDF render failed", { url, error });
    setRenderError(error.message || "The PDF renderer failed without an error message.");
  };

  const errorPanel = (message: string, details?: { statusCode?: number; contentType?: string }) => (
    <div className="p-6 text-sm text-muted-foreground flex flex-col items-start gap-3">
      <div className="space-y-2">
        <p className="font-medium text-foreground">Couldn't load this PDF inline.</p>
        <p>{message}</p>
        <p className="break-all rounded-md border border-border bg-background/70 p-2 text-xs">
          Attempted URL: {url}
        </p>
        {(details?.statusCode || details?.contentType) && (
          <p className="text-xs">
            Response: {details.statusCode ?? "unknown status"}
            {details.contentType ? ` · ${details.contentType}` : ""}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
        <a
          className="px-3 py-1.5 rounded-md text-xs border border-border hover:bg-accent"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in new tab ↗
        </a>
      </div>
    </div>
  );

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-background/60 flex-wrap">
        <span className="text-xs text-muted-foreground tabular-nums">
          {numPages ? `${numPages} pages` : "Loading…"}
        </span>
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
        className="max-h-[85vh] overflow-auto bg-neutral-900/50 p-2"
      >
        {pdfCheck.status === "checking" ? (
          <p className="text-sm text-muted-foreground p-6">Checking PDF response…</p>
        ) : pdfCheck.status === "error" ? (
          errorPanel(pdfCheck.message, pdfCheck)
        ) : renderError ? (
          errorPanel(`PDF renderer error: ${renderError}`)
        ) : (
          <Document
            key={retryKey}
            file={url}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={handleLoadError}
            loading={<p className="text-sm text-muted-foreground p-6">Loading PDF…</p>}
            noData={errorPanel("No PDF URL was provided.")}
            error={errorPanel("React PDF could not parse or render this file.")}
          >
            {numPages === 0 ? (
              <p className="text-sm text-muted-foreground p-6">Preparing PDF pages…</p>
            ) : (
              Array.from({ length: numPages }, (_, i) => (
                <div key={i} className="flex justify-center mb-3 last:mb-0">
                  <Page
                    pageNumber={i + 1}
                    width={width ? width * scale : undefined}
                    renderAnnotationLayer
                    renderTextLayer
                  />
                </div>
              ))
            )}
          </Document>
        )}
      </div>
      <span className="sr-only">{title}</span>
    </div>
  );
}
