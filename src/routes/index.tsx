import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createFileRoute } from "@tanstack/react-router";
import { studyContent } from "@/data/studyContent";
import { ChevronRight, ChevronDown, Menu, BookOpen } from "lucide-react";
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

function StudyHub() {
  const [selected, setSelected] = useState<{ topicId: string; docId: string } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(studyContent.map((t) => [t.id, true])),
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeDoc = useMemo(() => {
    if (!selected) return null;
    const topic = studyContent.find((t) => t.id === selected.topicId);
    const doc = topic?.documents.find((d) => d.id === selected.docId);
    return doc && topic ? { topic, doc } : null;
  }, [selected]);

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed top-3 left-3 z-50 md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-card shadow-sm"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-40 h-screen w-[280px] shrink-0 border-r border-border bg-sidebar text-sidebar-foreground overflow-y-auto transition-transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-sidebar-primary">
            <BookOpen className="h-5 w-5" />
            <h1 className="text-sm font-semibold leading-tight">
              E-Gov Master's
              <br />
              Exam Study Hub
            </h1>
          </div>
        </div>
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
      </aside>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
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

            {/* Summary card */}
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
              <div className="prose-study">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeDoc.doc.summary}
                </ReactMarkdown>
              </div>
            </section>

            {/* Divider */}
            <div className="my-10 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Full material
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Full content */}
            <div className="prose-study">
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
