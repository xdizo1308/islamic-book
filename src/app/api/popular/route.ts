// src/app/api/popular/route.ts
import { NextResponse } from "next/server";

const IA_SEARCH = "https://archive.org/advancedsearch.php";
const IA_META   = (id: string) => `https://archive.org/metadata/${encodeURIComponent(id)}`;
const IA_THUMB  = (id: string) => `https://archive.org/services/img/${encodeURIComponent(id)}`;

export async function GET() {
  // Top downloaded Islamic texts; adjust query later if you like.
  const q = [
    '(mediatype:"texts")',
    '(licenseurl:* OR rights:* OR collection:(opensource) OR collection:(community_texts))',
    '(subject:(Islam OR Quran OR Qur\'an OR Hadith OR Seerah) OR title:(Quran OR Hadith OR Seerah))',
  ].join(" AND ");

  const url = new URL(IA_SEARCH);
  url.searchParams.set("q", q);
  ["identifier","title","creator","date","language","licenseurl","rights","downloads"]
    .forEach(f => url.searchParams.append("fl[]", f));
  url.searchParams.append("sort[]","downloads desc");
  url.searchParams.set("rows","16");
  url.searchParams.set("output","json");

  const sres = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!sres.ok) return NextResponse.json({ error:"Search failed" }, { status:502 });
  const sdata = await sres.json();
  const baseDocs: any[] = sdata?.response?.docs || [];

  const docs = await Promise.all(
    baseDocs.map(async (d) => {
      const id: string = d.identifier;
      let formats: { label: string; url: string; size?: number }[] = [];
      try {
        const mres = await fetch(IA_META(id), { next: { revalidate: 86400 } });
        if (mres.ok) {
          const meta = await mres.json();
          const files: any[] = meta?.files || [];
          formats = files
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
            .slice(0, 5);
        }
      } catch {}

      return {
        identifier: id,
        title: d.title,
        author: d.creator,
        year: d.date,
        language: d.language,
        licenseUrl: d.licenseurl,
        rights: d.rights,
        downloads: d.downloads,
        coverUrl: IA_THUMB(id),
        sourcePage: `https://archive.org/details/${id}`,
        formats,
      };
    })
  );

  return NextResponse.json({ docs });
}
