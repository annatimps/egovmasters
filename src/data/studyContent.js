/**
 * STUDY CONTENT
 * =============
 * This file is the single source of truth for every topic and document shown
 * in the E-Gov Master's Exam Study Hub. Edit it directly — there is no
 * backend, no database, no upload UI. Save the file and the app updates.
 *
 * HOW TO ADD A NEW DOCUMENT
 * -------------------------
 * 1. Find the topic object you want to add the document under (by `id` or `title`).
 * 2. Push a new object into that topic's `documents` array with this shape:
 *
 *      {
 *        id: "unique-kebab-case-id",   // must be unique across the whole app
 *        title: "Readable Document Title",
 *        summary: `markdown string with the key points / TL;DR`,
 *        content: `markdown string with the full material`,
 *      }
 *
 * 3. Use template literals (backticks) for `summary` and `content` so you can
 *    write multi-line markdown freely. Markdown supports: # headings,
 *    **bold**, *italics*, bullet/numbered lists, tables (GFM), `code`, and
 *    code fences ```.
 *
 * HOW TO ADD A NEW TOPIC
 * ----------------------
 * Add a new object to the top-level array with `id`, `title`, and an empty
 * `documents: []`. Keep the order — the sidebar renders topics in array order.
 *
 * The 2 documents under topic 1 and the 1 document under topic 3 are
 * placeholder EXAMPLES to demonstrate the pattern. Replace them with your
 * real lecture notes.
 */

export const studyContent = [
  {
    id: "foundations",
    title: "Foundations of E-Governance & Information Society",
    documents: [
      {
        id: "foundations-intro",
        title: "Example: Introduction to E-Governance",
        summary: `**Key points (placeholder):**
- E-governance ≠ e-government: governance is broader (citizens, processes, outcomes).
- Three layers: **G2C**, **G2B**, **G2G**.
- Information Society shift: from paper-based bureaucracy to networked services.`,
        content: `# Introduction to E-Governance

> Replace this placeholder with your real lecture notes.

## Definitions

E-governance is the use of ICT to deliver public services, exchange information,
and integrate previously stand-alone systems for citizens, businesses, and
within government itself.

## Layers

| Layer | Meaning | Example |
|-------|---------|---------|
| G2C   | Government to Citizen | Tax filing portal |
| G2B   | Government to Business | e-Procurement |
| G2G   | Government to Government | Inter-agency data exchange |

## Why it matters

1. Efficiency
2. Transparency
3. Citizen participation

\`\`\`text
Paper era  ->  Digitisation  ->  Digital transformation  ->  Digital-by-default
\`\`\`
`,
      },
      {
        id: "foundations-info-society",
        title: "Example: The Information Society",
        summary: `**Key points (placeholder):**
- Castells: networked society as the dominant social structure.
- Digital divide: access, skills, usage gaps.
- Policy responses: connectivity, literacy, inclusion.`,
        content: `# The Information Society

Placeholder content — replace with your notes.

## Core concepts

- **Network society** (Castells)
- **Knowledge economy**
- **Digital divide** — first, second, and third level

## Reading checklist

- [ ] Castells, *The Rise of the Network Society*
- [ ] OECD digital economy outlook
`,
      },
    ],
  },
  {
    id: "regulatory-legal",
    title: "Regulatory & Legal Frameworks",
    documents: [],
  },
  {
    id: "interoperability",
    title: "Interoperability & Data Exchange",
    documents: [
      {
        id: "interop-eif",
        title: "Example: European Interoperability Framework (EIF)",
        summary: `**Key points (placeholder):**
- Four layers: **legal, organisational, semantic, technical**.
- Underpinned by **interoperability governance** and **integrated public service governance**.
- Estonia's **X-Road** is the canonical technical/semantic example.`,
        content: `# European Interoperability Framework (EIF)

Placeholder content.

## The four layers

| Layer | Concern |
|-------|---------|
| Legal | Aligned legislation |
| Organisational | Aligned business processes |
| Semantic | Shared meaning of data |
| Technical | Protocols, standards, infrastructure |

## Principles (selected)

1. Subsidiarity and proportionality
2. Openness
3. Transparency
4. Reusability
5. Technological neutrality and data portability
`,
      },
    ],
  },
  {
    id: "digital-identity",
    title: "Digital Identity & Trust Frameworks",
    documents: [],
  },
  {
    id: "service-design",
    title: "Service Design, Strategy & Change Management",
    documents: [],
  },
  {
    id: "ai-data-governance",
    title: "AI & Data Governance",
    documents: [],
  },
  {
    id: "global-trends",
    title: "Global Trends & Policy Tools",
    documents: [],
  },
  {
    id: "exam-skills",
    title: "Exam Skills & Case Analysis",
    documents: [],
  },
];
