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

  const [popular, setPopular] = useState<Doc[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  // Load Popular on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/popular");
        const data = await res.json();
        setPopular(data.docs || []);
      } finally {
        setLoadingPopular(false);
      }
    })();
  }, []);

  async function search() {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&rows=12`);
    const data = await res.json();
    setDocs(data.docs || []);
    setLoading(false);
  }

  // Enter key triggers search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Enter") search(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [q]);

  return (
    <main>
      <header className="header">
        <div className="container header__inner">
          <h1 className="logo">📚 Open Islamic Library</h1>
        </div>
      </header>

      {/* Search bar */}
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

      {/* Popular */}
      <section className="container">
        <div className="sectionHeader">
          <h2>Popular</h2>
        </div>

        {loadingPopular ? (
          <p className="muted">Loading popular books…</p>
        ) : (
          <ul className="grid grid-4">
            {popular.map((d) => (
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
                    <a href={d.sourcePage} className="btn secondary" target="_blank" rel="noreferrer">Source</a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Search results (if any) */}
      <section className="container">
        {searched && !loading && docs.length === 0 && (
          <p className="muted">No results. Try another query (e.g., "Seerah", "Hadith").</p>
        )}
        {docs.length > 0 && (
          <>
            <div className="sectionHeader">
              <h2>Results</h2>
            </div>
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
                      <a href={d.sourcePage} className="btn secondary" target="_blank" rel="noreferrer">Source</a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Floating theme toggle */}
      <FloatingThemeToggle />
    </main>
  );
}

function FloatingThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    const prefers = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefers;
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
  }, []);
  if (!mounted) return null;
  return (
    <button
      aria-label="Toggle theme"
      className="fab"
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("theme", next ? "dark" : "light");
      }}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
