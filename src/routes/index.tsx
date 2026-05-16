import { useState, useMemo, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createFileRoute } from "@tanstack/react-router";
import { studyContent } from "@/data/studyContent";
import { ChevronRight, ChevronDown, Menu, BookOpen, Search, X, ChevronUp, NotebookPen, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: StudyHub,
  head: () => ({
    meta: [
      { title: "E-Gov Master's Exam Study Hub" },
      { name: "description", content: "Personal study hub for the E-Governance master's exam." },
    ],
  }),
});

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type SearchHit = {
  topicId: string;
  topicTitle: string;
  docId: string;
  docTitle: string;
  count: number;
  snippet: { before: string; match: string; after: string };
};

function computeResults(query: string): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const re = new RegExp(escapeRegExp(q), "gi");
  const hits: SearchHit[] = [];
  for (const topic of studyContent) {
    for (const doc of topic.documents) {
      const combined = doc.summary + "\n\n" + doc.content;
      const matches = combined.match(re);
      if (!matches || matches.length === 0) continue;
      re.lastIndex = 0;
      const first = re.exec(combined)!;
      const start = Math.max(0, first.index - 40);
      const end = Math.min(combined.length, first.index + first[0].length + 60);
      const before = (start > 0 ? "…" : "") + combined.slice(start, first.index).replace(/\s+/g, " ");
      const match = first[0];
      const after = combined.slice(first.index + first[0].length, end).replace(/\s+/g, " ") + (end < combined.length ? "…" : "");
      hits.push({
        topicId: topic.id,
        topicTitle: topic.title,
        docId: doc.id,
        docTitle: doc.title,
        count: matches.length,
        snippet: { before, match, after },
      });
    }
  }
  return hits;
}

function highlightInElement(root: HTMLElement, term: string): HTMLElement[] {
  if (!term) return [];
  const re = new RegExp(escapeRegExp(term), "gi");
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const targets: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const t = node as Text;
    if (!t.nodeValue) continue;
    // skip if already inside a mark (shouldn't happen on fresh render)
    if ((t.parentElement?.tagName ?? "") === "MARK") continue;
    re.lastIndex = 0;
    if (re.test(t.nodeValue)) targets.push(t);
  }
  const marks: HTMLElement[] = [];
  for (const textNode of targets) {
    const text = textNode.nodeValue!;
    re.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (m[0].length === 0) {
        re.lastIndex++;
        continue;
      }
      if (m.index > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
      const mark = document.createElement("mark");
      mark.className = "search-hit";
      mark.textContent = m[0];
      frag.appendChild(mark);
      marks.push(mark);
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    textNode.parentNode!.replaceChild(frag, textNode);
  }
  return marks;
}

function StudyHub() {
  const [selected, setSelected] = useState<{ topicId: string; docId: string } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(studyContent.map((t) => [t.id, true])),
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState(""); // term used for in-doc highlight
  const [matchIndex, setMatchIndex] = useState(0);
  const [matchCount, setMatchCount] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const marksRef = useRef<HTMLElement[]>([]);
  const scrollToFirstRef = useRef(false);

  const activeDoc = useMemo(() => {
    if (!selected) return null;
    const topic = studyContent.find((t) => t.id === selected.topicId);
    const doc = topic?.documents.find((d) => d.id === selected.docId);
    return doc && topic ? { topic, doc } : null;
  }, [selected]);

  const results = useMemo(() => computeResults(query), [query]);

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  // Keyboard shortcut Cmd/Ctrl+K, Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === "Escape") {
        if (document.activeElement === searchInputRef.current || query) {
          setQuery("");
          setActiveQuery("");
          searchInputRef.current?.blur();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [query]);

  // Apply highlights when activeQuery or active doc changes
  useLayoutEffect(() => {
    marksRef.current = [];
    if (!activeDoc) {
      setMatchCount(0);
      setMatchIndex(0);
      return;
    }
    const collected: HTMLElement[] = [];
    if (activeQuery) {
      if (summaryRef.current) collected.push(...highlightInElement(summaryRef.current, activeQuery));
      if (contentRef.current) collected.push(...highlightInElement(contentRef.current, activeQuery));
    }
    marksRef.current = collected;
    setMatchCount(collected.length);
    if (collected.length > 0) {
      const startIdx = 0;
      setMatchIndex(startIdx);
      collected[startIdx].classList.add("search-hit-current");
      // Scroll to first match if we just opened from search
      const target = scrollToFirstRef.current
        ? (contentRef.current?.querySelector(".search-hit") as HTMLElement | null) ?? collected[0]
        : collected[0];
      target.scrollIntoView({ block: "center", behavior: "auto" });
      scrollToFirstRef.current = false;
    } else {
      setMatchIndex(0);
    }
  }, [activeQuery, activeDoc]);

  const gotoMatch = useCallback((delta: number) => {
    const marks = marksRef.current;
    if (marks.length === 0) return;
    setMatchIndex((prev) => {
      const next = (prev + delta + marks.length) % marks.length;
      marks[prev]?.classList.remove("search-hit-current");
      marks[next].classList.add("search-hit-current");
      marks[next].scrollIntoView({ block: "center", behavior: "smooth" });
      return next;
    });
  }, []);

  const openResult = (hit: SearchHit) => {
    scrollToFirstRef.current = true;
    setActiveQuery(query);
    setSelected({ topicId: hit.topicId, docId: hit.docId });
    setSidebarOpen(false);
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!activeDoc || activeQuery !== query) {
        // commit query as active for highlighting in current doc, or open first result
        if (results.length > 0 && (!activeDoc || results[0].docId !== activeDoc.doc.id)) {
          openResult(results[0]);
        } else {
          setActiveQuery(query);
        }
        return;
      }
      gotoMatch(e.shiftKey ? -1 : 1);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setActiveQuery("");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed top-3 left-3 z-50 md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-card shadow-sm"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>

      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-40 h-screen w-[280px] shrink-0 border-r border-border bg-sidebar text-sidebar-foreground flex flex-col transition-transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="px-5 pt-5 pb-3 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2 text-sidebar-primary mb-3">
            <BookOpen className="h-5 w-5" />
            <h1 className="text-sm font-semibold leading-tight">
              E-Gov Master's
              <br />
              Exam Study Hub
            </h1>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Search…  (⌘K)"
              className="w-full h-8 pl-7 pr-7 text-sm rounded-md border border-sidebar-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {query && (
              <button
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded hover:bg-accent text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {query.trim() ? (
            <div className="p-2">
              <p className="px-2 py-1 text-xs text-muted-foreground">
                {results.length === 0
                  ? "No results"
                  : `${results.length} document${results.length === 1 ? "" : "s"}`}
              </p>
              {results.map((hit) => (
                <button
                  key={`${hit.topicId}-${hit.docId}`}
                  onClick={() => openResult(hit)}
                  className="w-full text-left px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors mb-0.5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                      {hit.topicTitle}
                    </span>
                    <span className="text-[10px] font-medium text-primary shrink-0">
                      {hit.count} match{hit.count === 1 ? "" : "es"}
                    </span>
                  </div>
                  <div className="text-sm font-medium mt-0.5 leading-snug">{hit.docTitle}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug">
                    {hit.snippet.before}
                    <strong className="text-foreground bg-yellow-200 rounded px-0.5">
                      {hit.snippet.match}
                    </strong>
                    {hit.snippet.after}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <nav className="p-2">
              {studyContent.map((topic, idx) => {
                const isOpen = expanded[topic.id];
                return (
                  <div key={topic.id} className="mb-0.5">
                    <button
                      onClick={() => toggle(topic.id)}
                      className="w-full flex items-start gap-2 px-2 py-2 rounded-md text-left text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="flex-1">
                        <span className="text-muted-foreground mr-1.5">{idx + 1}.</span>
                        {topic.title}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="ml-6 mt-0.5 mb-1 border-l border-sidebar-border">
                        {topic.documents.length === 0 ? (
                          <p className="px-3 py-1.5 text-xs italic text-muted-foreground">
                            No documents yet
                          </p>
                        ) : (
                          topic.documents.map((doc) => {
                            const active =
                              selected?.topicId === topic.id && selected?.docId === doc.id;
                            return (
                              <button
                                key={doc.id}
                                onClick={() => {
                                  setSelected({ topicId: topic.id, docId: doc.id });
                                  setSidebarOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left pl-3 pr-2 py-1.5 text-sm rounded-r-md transition-colors border-l-2 -ml-px",
                                  active
                                    ? "border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                    : "border-transparent text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                                )}
                              >
                                {doc.title}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0">
        {activeDoc ? (
          <article className="mx-auto max-w-3xl px-6 md:px-10 py-10 md:py-14">
            <header className="mb-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {activeDoc.topic.title}
              </p>
              <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">
                {activeDoc.doc.title}
              </h1>
            </header>

            {activeQuery && matchCount > 0 && (
              <div className="sticky top-2 z-20 mb-4 flex items-center gap-2 bg-card border border-border rounded-md shadow-sm px-3 py-1.5 w-fit ml-auto">
                <span className="text-xs text-muted-foreground">
                  Match <span className="font-medium text-foreground">{matchIndex + 1}</span> of{" "}
                  <span className="font-medium text-foreground">{matchCount}</span> for "
                  <span className="font-medium text-foreground">{activeQuery}</span>"
                </span>
                <button
                  onClick={() => gotoMatch(-1)}
                  aria-label="Previous match"
                  className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-accent"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => gotoMatch(1)}
                  aria-label="Next match"
                  className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-accent"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={clearSearch}
                  aria-label="Clear"
                  className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-accent"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <section
              aria-labelledby="summary-heading"
              className="rounded-xl border border-border bg-accent/60 p-5 md:p-6 shadow-sm"
            >
              <h2
                id="summary-heading"
                className="text-xs font-semibold uppercase tracking-wider text-primary mb-3"
              >
                Summary / Key Points
              </h2>
              <div ref={summaryRef} className="prose-study" key={`s-${activeDoc.doc.id}-${activeQuery}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeDoc.doc.summary}
                </ReactMarkdown>
              </div>
            </section>

            <div className="my-10 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Full material
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div ref={contentRef} className="prose-study" key={`c-${activeDoc.doc.id}-${activeQuery}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeDoc.doc.content}
              </ReactMarkdown>
            </div>
          </article>
        ) : (
          <div className="flex min-h-screen items-center justify-center px-6">
            <div className="text-center max-w-sm">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/60" />
              <p className="mt-4 text-sm text-muted-foreground">
                Select a topic and document from the sidebar
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
