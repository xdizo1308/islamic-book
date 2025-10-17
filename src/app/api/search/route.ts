// ...existing code...
import { NextResponse } from "next/server";

const IA_META = (id: string) => `https://archive.org/metadata/${encodeURIComponent(id)}`;
const IA_THUMB = (id: string) =>
  `https://archive.org/services/get-item-image.php?identifier=${encodeURIComponent(id)}&size=medium`;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = String(url.searchParams.get("q") || "").trim();
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 10)));

    if (!q) return NextResponse.json({ total: 0, docs: [] });

    const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
      q
    )}&fl=identifier,title,creator,date,language,licenseurl,rights,downloads&output=json&rows=${limit}&page=${page}`;

    const sres = await fetch(searchUrl, { next: { revalidate: 60 } });
    const sdata = sres.ok ? await sres.json() : null;
    const limited = sdata?.response?.docs || [];

    const docs = await Promise.all(
      limited.map(async (d: any) => {
        const id: string = String(d.identifier || "");
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
                  label,
                  url: `https://archive.org/download/${encodeURIComponent(id)}/${encodeURIComponent(f.name)}`,
                  size: f.size ? Number(f.size) : undefined,
                };
              })
              .filter((f) => /^(PDF|EPUB|Plain Text|HTML|DJVU)$/.test(f.label))
              .slice(0, 5);
          }
        } catch (err) {
          // ignore metadata errors per original behavior
        }

        return {
          identifier: id,
          title: d.title || "",
          author: d.creator || "",
          year: d.date || "",
          language: d.language || "",
          licenseUrl: d.licenseurl || null,
          rights: d.rights || null,
          downloads: d.downloads ?? null,
          coverUrl: IA_THUMB(id),
          sourcePage: `https://archive.org/details/${encodeURIComponent(id)}`,
          formats,
        };
      })
    );

    const total = sdata?.response?.numFound ?? docs.length;
    return NextResponse.json({ total, docs });
  } catch (err) {
    return NextResponse.json({ total: 0, docs: [], error: "internal_error" }, { status: 500 });
  }
}
// ...existing code...