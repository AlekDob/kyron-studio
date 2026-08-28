import { NextRequest } from "next/server";
import { proxyProducts } from "../../_proxy";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  return proxyProducts(`/${slug}/media`, {
    method: "POST",
    body: await req.formData(),
    isForm: true,
  });
}
