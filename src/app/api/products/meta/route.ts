import { proxyProducts } from "../_proxy";

export async function GET() {
  return proxyProducts("/meta", { method: "GET" });
}
