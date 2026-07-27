import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { VatReliefWorkspace } from "@/components/vat-relief/VatReliefWorkspace";

interface Props {
  // ?case=326 — deep link dal drawer del modulo Ordini.
  searchParams: Promise<{ case?: string }>;
}

export default async function VatReliefPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(loginUrl());
  }

  const { case: orderNumber } = await searchParams;

  return <VatReliefWorkspace initialOrderNumber={orderNumber} />;
}
