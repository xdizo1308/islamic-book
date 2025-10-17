// src/app/book/[id]/page.tsx
import Link from "next/link";

async function getBook(id: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const res = await fetch(`${base}/api/book/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load book");
  return res.json();
}

export default async function BookPage({ params }: { params: { id: string } }) {
  const data = await getBook(params.id);
  return (
    <main>
      <header className="header">
        <div className="container header__inner">
          <Link href="/" className="logo">← Back</Link>
          <div />
        </div>
      </header>

      <section className="container book">
        {data.coverUrl && <img src={data.coverUrl} alt="" className="detailCover" />}
        <div>
          <h1 className="detailTitle">{data.title}</h1>
          <p className="meta">
            {(data.author || "Unknown author")}
            {data.year ? ` • ${data.year}` : ""}
            {data.language ? ` • ${data.language}` : ""}
          </p>
          <p className="meta">
            {data.licenseUrl && <a className="link" href={data.licenseUrl} target="_blank">License</a>}{" "}
            <a className="link" href={data.sourcePage} target="_blank">Source</a>
          </p>

          <h2 className="sectionTitle">Download</h2>
          {data.formats && data.formats.length > 0 ? (
            <ul className="dlList">
              {data.formats.map((f: any, i: number) => (
                <li key={i} className="dlItem">
                  <span>{f.label}</span>
                  <a className="btn" href={f.url} target="_blank" rel="noreferrer">Direct link</a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No downloadable formats found on the source item.</p>
          )}
        </div>
      </section>
    </main>
  );
}
