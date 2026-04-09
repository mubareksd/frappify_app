import { env } from "@/lib/env";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getCurrentSession();
  const accessToken = session?.accessToken;
  const siteId = session?.user.siteId;

  if (!accessToken || !siteId) {
    redirect(`${env.PUBLIC_APP_URL}/login`);
  }

  const res = await fetch(
    `${env.API_URL}/method/frappe.desk.desktop.get_workspace_sidebar_items`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Frappe-Site": siteId,
	"Accept-Encoding": "identity",
      },
    }
  );

  const data = await res.json();

  const sidebarItems =
    data?.message ||
    data?.message?.pages ||
    data?.message?.page ||
    [];

  const firstItem = sidebarItems?.[0];

  if (!firstItem) return null;

  const target =
    firstItem.route ||
    firstItem.name ||
    firstItem.page ||
    firstItem.title;

  if (target) {
    redirect(`/app/${target}`);
  }

  return null;
}
