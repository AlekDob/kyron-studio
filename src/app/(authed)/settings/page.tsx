import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { getCurrentUser, isAdmin } from "@/lib/auth";

export const metadata = { title: "Impostazioni — Studio" };

export default async function SettingsPage() {
  // Brain: feature-008 — il gating admin/editor parte dal ruolo del cookie.
  const user = await getCurrentUser();
  return (
    <SettingsLayout
      userEmail={user?.email ?? ""}
      isAdmin={isAdmin(user)}
    />
  );
}
