import { NextRequest } from "next/server";
import { proxyProducts } from "../_proxy";

export async function POST(req: NextRequest) {
  return proxyProducts("/import/upload", { method: "POST", body: await req.formData(), isForm: true });
}
