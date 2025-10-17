// src/app/api/book/[id]/route.ts
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const metaUrl = `https://archive.org/metadata/${encodeURIComponent(id)}`;

  const res = await fetch(metaUrl, { next: { revalidate: 86400 } });
  if (!res.ok) return NextResponse.json({ error: "Metadata fetch failed" }, { status: 502 });
  const data = await res.json();

  const files: any[] = data?.files || [];
  const preferred = ["pdf", "epub", "txt", "html", "djvu"];
  const formats = files
    .filter((f) => f?.name && f?.format)
    .map((f) => {
      const ext = String(f.name).split(".").pop()?.toLowerCase() || "";
      const label =
        ext === "pdf" ? "PDF" :
        ext === "epub" ? "EPUB" :
        ext === "txt" ? "Plain Text" :
        ext === "html" ? "HTML" :
        ext === "djvu" ? "DJVU" : f.format;
      return {
        label,
        url: `https://archive.org/download/${id}/${encodeURIComponent(f.name)}`,
        size: f.size ? Number(f.size) : undefined,
      };
    })
    .filter((f) => /^(PDF|EPUB|Plain Text|HTML|DJVU)$/.test(f.label))
    .sort((a, b) => preferred.indexOf(a.label.toLowerCase()) - preferred.indexOf(b.label.toLowerCase()));

  const coverUrl = `https://archive.org/services/img/${id}`;

  return NextResponse.json({
    id,
    title: data?.metadata?.title,
    author: data?.metadata?.creator || data?.metadata?.author,
    year: data?.metadata?.date,
    language: data?.metadata?.language,
    licenseUrl: data?.metadata?.licenseurl,
    rights: data?.metadata?.rights,
    sourcePage: `https://archive.org/details/${id}`,
    coverUrl,
    formats,
  });
}
