"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Doc = {
  identifier: string;
  title: string;
  author?: string;
  year?: string;
  language?: string;
  licenseUrl?: string;
  downloads?: number;
  coverUrl?: string;
  sourcePage: string;
  formats?: { label: string; url: string; size?: number }[];
};

export default function HomePage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [searched, setSearched] = useState(false);

  async function search() {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&rows=12`);
    const data = await res.json();
    setDocs(data.docs || []);
    setLoading(false);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") search();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [q]);

  return (
    <main>
      <header className="header">
        <div className="container header__inner">
          <h1 className="logo">📚 Open Islamic Library</h1>
          <ThemeToggle />
        </div>
      </header>

      <section className="container search">
        <input
          className="input"
          placeholder="Search titles, authors, subjects…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn" onClick={search} disabled={loading || !q.trim()}>
          {loading ? "Searching…" : "Search"}
        </button>
      </section>

      <section className="container">
        {searched && !loading && docs.length === 0 && (
          <p className="muted">No results. Try another query (e.g., "Seerah", "Hadith").</p>
        )}
        <ul className="grid">
          {docs.map((d) => (
            <li key={d.identifier} className="card">
              {d.coverUrl && <img src={d.coverUrl} alt="" className="cover" />}
              <div className="card__body">
                <h3 className="title">{d.title}</h3>
                <p className="meta">
                  {d.author || "Unknown author"}
                  {d.year ? ` • ${d.year}` : ""}
                  {d.language ? ` • ${d.language}` : ""}
                </p>
                <div className="actions">
                  <Link href={`/book/${d.identifier}`} className="btn secondary">Details</Link>
                  <a href={d.sourcePage} className="btn outline" target="_blank" rel="noreferrer">Source</a>
                </div>
                {d.formats && d.formats.length > 0 && (
                  <div className="formats">
                    {d.formats.slice(0, 3).map((f, i) => (
                      <a key={i} className="chip" href={f.url} target="_blank" rel="noreferrer">{f.label}</a>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    const prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefers;
    document.documentElement.classList.toggle('dark', isDark);
    setDark(isDark);
  }, []);
  if (!mounted) return null;
  return (
    <button
      className="btn small"
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem("theme", next ? 'dark' : 'light');
      }}
    >
      {dark ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
