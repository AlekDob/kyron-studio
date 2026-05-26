// Source: cms/app/api/review/send/route.ts (adapted to use studio auth)
// Invia il bundle di annotazioni via email a KYRON_REVIEW_INBOX.
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getCurrentUser } from "@/lib/auth";
import { bundleToMarkdown } from "@/lib/review/exportMarkdown";
import type { Annotation, AnnotationBundle } from "@/lib/review/types";

const KYRON_DOMAIN = "kyronedu.it";
const FALLBACK_FROM = `Studio Kyron <revisione@${KYRON_DOMAIN}>`;
const DEFAULT_INBOX = "alekdobrohotov@gmail.com";

function isKyronEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${KYRON_DOMAIN}`);
}

function summary(annotations: Annotation[]): { html: string; text: string } {
  if (annotations.length === 0) {
    const msg = "Nessuna annotazione nel bundle.";
    return { html: `<p>${msg}</p>`, text: msg };
  }
  const byKind = annotations.reduce<Record<string, number>>((acc, a) => {
    acc[a.kind] = (acc[a.kind] ?? 0) + 1;
    return acc;
  }, {});
  const counts = Object.entries(byKind)
    .map(([k, n]) => `${k}: ${n}`)
    .join(", ");
  const previews = annotations.slice(0, 3).map((a) => ({
    kind: a.kind,
    page: a.page,
    txt: (a.proposal.note || a.proposal.text || a.original.text || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200),
  }));

  const text =
    `Totale: ${annotations.length} (${counts})\n\n` +
    previews
      .map((p, i) => `${i + 1}. [${p.kind}] ${p.page}\n   ${p.txt}`)
      .join("\n\n") +
    (annotations.length > previews.length
      ? `\n\n+ altre ${annotations.length - previews.length} nel file allegato.`
      : "");
  const html =
    `<p><strong>Totale:</strong> ${annotations.length} (${counts})</p>` +
    `<ol style="font-family:sans-serif">` +
    previews
      .map(
        (p) =>
          `<li><code>${p.kind}</code> <span style="color:#5C8682">${p.page}</span><br>${p.txt}</li>`,
      )
      .join("") +
    `</ol>` +
    (annotations.length > previews.length
      ? `<p style="color:#5C8682">+ altre ${annotations.length - previews.length} nel file <code>annotazioni.md</code> allegato.</p>`
      : "");
  return { html, text };
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "non autorizzato" },
        { status: 401 },
      );
    }

    const body = (await req.json()) as { bundle?: AnnotationBundle };
    const bundle = body?.bundle;
    if (
      !bundle ||
      typeof bundle !== "object" ||
      bundle.schemaVersion !== 1 ||
      !Array.isArray(bundle.annotations)
    ) {
      return NextResponse.json(
        { success: false, error: "bundle non valido" },
        { status: 400 },
      );
    }

    const md = bundleToMarkdown(bundle);
    const { html, text } = summary(bundle.annotations);
    const sender = user.email;
    const from = isKyronEmail(sender) ? sender : FALLBACK_FROM;
    const replyTo = sender;
    const to = process.env.KYRON_REVIEW_INBOX || DEFAULT_INBOX;
    const subject = `Studio Kyron — annotazioni da ${sender}`;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "RESEND_API_KEY mancante" },
        { status: 500 },
      );
    }
    const resend = new Resend(apiKey);
    const r = await resend.emails.send({
      from,
      to: [to],
      replyTo,
      subject,
      text: `Da: ${sender}\nSito: ${bundle.site}\n\n${text}\n\nBundle completo in allegato.`,
      html: `<p style="font-family:sans-serif">Da: <strong>${sender}</strong><br>Sito: <code>${bundle.site}</code></p>${html}<p style="color:#5C8682;font-family:sans-serif">Bundle completo in allegato.</p>`,
      attachments: [
        {
          filename: `kyron-review-${ts}.md`,
          content: Buffer.from(md, "utf8").toString("base64"),
        },
      ],
    });
    if (r.error) {
      console.error("[review/send] Resend error:", r.error);
      return NextResponse.json(
        { success: false, error: "invio email fallito" },
        { status: 502 },
      );
    }
    return NextResponse.json({ success: true, id: r.data?.id });
  } catch (err) {
    console.error("[review/send] threw:", (err as Error).message);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
