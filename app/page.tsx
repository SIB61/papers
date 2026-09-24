import Link from "next/link";
import {
  ArrowRight,
  Feather,
  Palette,
  PenLine,
  ShieldCheck,
  Split,
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { Hero } from "@/components/hero";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: Feather,
    title: "Markdown is the only format",
    body: "Write in plain markdown. Every file becomes its own page — no CMS, no dashboards, just a path.",
  },
  {
    icon: Palette,
    title: "White-label by default",
    body: "The header is yours, the content is yours. The only paper is the quiet little “powered by papers.io” in the footer.",
  },
  {
    icon: Split,
    title: "Your own default theme",
    body: "Pick the look visitors see first. They can switch, you set the tone.",
  },
  {
    icon: PenLine,
    title: "Everything is typed",
    body: "Drafts and notes live in one desk. Publish a page and it lands at a clean, shareable URL.",
  },
  {
    icon: ShieldCheck,
    title: "Private until you publish",
    body: "Drafts are yours alone. Only pages you mark Published are visible to the public.",
  },
];

const USES = [
  { path: "/you/cv", title: "Career pages", body: "Your CV, always one markdown file." },
  { path: "/you/ideas", title: "Notes & ideas", body: "Work through thoughts in the open." },
  { path: "/you/projects", title: "Project journals", body: "Log progress without a dashboard." },
  { path: "/you/reads", title: "Reading lists", body: "A living bibliography of things you read." },
];

export default function HomePage() {
  return (
    <>
      <LandingHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5">
        <section className="animate-page-in py-20 sm:py-28">
          <Hero />
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            A markdown blog platform that puts your name front and center. Write in
            plain text, publish at your own path, and ship a site that looks like
            you — not like the tool underneath.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-85 active:translate-y-px"
            >
              Start your blog
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Why papers?
            </a>
          </div>
        </section>

        <section id="features" className="animate-page-in border-t border-border py-20">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Features
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border p-6 transition-colors hover:bg-muted/40"
              >
                <f.icon className="size-5" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-20">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            People write
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {USES.map((u) => (
              <a
                key={u.title}
                href={`/${u.path}`}
                className="group flex items-start justify-between gap-4 rounded-xl border border-border p-6 transition-colors hover:bg-muted/40"
              >
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{u.path}</p>
                  <h3 className="mt-1.5 font-semibold">{u.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{u.body}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-20 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            you write <span className="text-foreground">/username/anything</span>
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Your site, your name, your markdown.
          </h2>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-85 active:translate-y-px"
          >
            <Feather className="size-4" />
            Sign in with Google
          </Link>
        </section>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-xs text-muted-foreground">
          <span>papers · a markdown blog</span>
          <span className="flex items-center gap-4">
            <span>
              You get the header. We get the favicon-free footer.
            </span>
            <span>{new Date().getFullYear()}</span>
          </span>
        </div>
      </footer>
    </>
  );
}