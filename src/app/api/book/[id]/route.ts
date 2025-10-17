// ...existing code...
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const metaUrl = `https://archive.org/metadata/${encodeURIComponent(id)}`;
  const res = await fetch(metaUrl, { next: { revalidate: 86400 } });
  if (!res.ok) return NextResponse.json({ error: "Metadata fetch failed" }, { status: 502 });
  const data = await res.json();

  const files: any[] = data?.files || [];
  const preferred = ["pdf", "epub", "txt", "html", "djvu"];
  const preferredSet = new Set(preferred);

  const formats = files
    .filter((f) => f?.name)
    .map((f) => {
      const name = String(f.name);
      const ext = name.split(".").pop()?.toLowerCase() || "";
      const formatLower = String(f.format || "").toLowerCase();
      const key = ext || formatLower;
      const label =
        ext === "pdf"
          ? "PDF"
          : ext === "epub"
          ? "EPUB"
          : ext === "txt"
          ? "Plain Text"
          : ext === "html"
          ? "HTML"
          : ext === "djvu"
          ? "DJVU"
          : f.format || ext.toUpperCase();

      return {
        key,
        label,
        url: `https://archive.org/download/${encodeURIComponent(id)}/${encodeURIComponent(name)}`,
        size: f.size ? Number(f.size) : undefined,
      };
    })
    .filter((f) => preferredSet.has(f.key))
    .sort((a, b) => {
      const ia = preferred.indexOf(a.key);
      const ib = preferred.indexOf(b.key);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })
    .map(({ key, ...rest }) => rest); // drop internal key before returning

  const coverUrl = `https://archive.org/services/img/${encodeURIComponent(id)}`;

  return NextResponse.json({
    id,
    title: data?.metadata?.title,
    author: data?.metadata?.creator || data?.metadata?.author,
    year: data?.metadata?.date,
    language: data?.metadata?.language,
    licenseUrl: data?.metadata?.licenseurl,
    rights: data?.metadata?.rights,
    sourcePage: `https://archive.org/details/${encodeURIComponent(id)}`,
    coverUrl,
    formats,
  });
}
// ...existing code...