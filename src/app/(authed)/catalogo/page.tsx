import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { listProducts, type Product } from "@/lib/products";
import { CatalogoWorkspace } from "@/components/catalogo/CatalogoWorkspace";

export default async function CatalogoPage() {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl());

  // Se Saleor o studio-server non rispondono la pagina resta in piedi con la
  // lista vuota (il client riprova via /api/products), come /portals.
  let products: Product[] = [];
  try {
    products = await listProducts();
  } catch {
    products = [];
  }

  return <CatalogoWorkspace initialProducts={products} />;
}
