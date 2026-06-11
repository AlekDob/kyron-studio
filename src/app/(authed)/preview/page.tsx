import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { PreviewWorkspace } from "@/components/preview/PreviewWorkspace";
import { PREVIEW_BASE_URL } from "@/lib/preview-config";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ url?: string }>;
}

export default async function PreviewPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl("/preview"));

  const { url } = await searchParams;
  const initialUrl = url || `${PREVIEW_BASE_URL}/`;

  return <PreviewWorkspace initialUrl={initialUrl} userEmail={user.email} />;
}
