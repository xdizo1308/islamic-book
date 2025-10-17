// ...existing code...
"use client";
import React, { useState } from "react";
import Link from "next/link";

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

function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch {
      return false;
    }
  });

  const toggle = () => {
    try {
      const next = !isDark;
      setIsDark(next);
      localStorage.setItem("theme", next ? "dark" : "light");
      document.documentElement.style.colorScheme = next ? "dark" : "light";
    } catch {}
  };

  return (
    <button onClick={toggle} aria-label="Toggle theme" className="btn">
      {isDark ? "🌙" : "☀️"}
    </button>
  );
}

export default function HomePage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [searched, setSearched] = useState(false);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      // server route is at /search (app route). Use `limit` to match route.ts expectations.
      const res = await fetch(`/search?q=${encodeURIComponent(q)}&limit=12`);
      const data = await res.json();
      setDocs(data.docs || []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <header className="header">
        <div className="container header__inner">
          <h1 className="logo">📚 Open Islamic Library</h1>
          <ThemeToggle />
        </div>
      </header>

      <section className="container search">
        <form onSubmit={search} className="search__form">
          <input
            className="input"
            placeholder="Search archive.org for books, authors, topics..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search query"
          />
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {searched && !loading && docs.length === 0 && (
          <p className="muted">No results found.</p>
        )}

        <ul className="results">
          {docs.map((d) => (
            <li key={d.identifier} className="result">
              <a href={d.sourcePage} target="_blank" rel="noreferrer" className="result__cover">
                <img src={d.coverUrl} alt={d.title} width={120} height={160} />
              </a>
              <div className="result__meta">
                <h3 className="result__title">
                  <Link href={d.sourcePage}>{d.title || d.identifier}</Link>
                </h3>
                {d.author && <p className="muted">{d.author}</p>}
                <p className="muted">{[d.year, d.language].filter(Boolean).join(" • ")}</p>
                {d.formats && d.formats.length > 0 && (
                  <p className="formats">
                    {d.formats.map((f) => (
                      <a key={f.url} href={f.url} target="_blank" rel="noreferrer" className="format">
                        {f.label}
                      </a>
                    ))}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
// ...existing code...