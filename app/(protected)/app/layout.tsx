import ProtectedAppShell from "@/components/layout/protected-app-shell";
import { env } from "@/lib/env";
import { getCurrentSession } from "@/lib/session";

interface ProtectedLayoutProps {
  children?: React.ReactNode;
}

export type SidebarItem = {
  name: string;
  title?: string;
  for_user?: string;
  parent_page?: string;
  content?: string;
  public?: number | boolean;
  module?: string;
  icon?: string;
  indicator_color?: string;
  is_hidden?: number | boolean;
  label?: string;
};

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const session = await getCurrentSession();
  const accessToken = session?.accessToken;
  const siteId = session?.user.siteId;

  const sidebarItems: SidebarItem[] = await (async () => {
    if (!accessToken || !siteId) return [];

    try {
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
        },
      );

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Failed to fetch sidebar items: ${res.status} ${res.statusText}${body ? ` - ${body}` : ""}`,
        );
      }

      const data = (await res.json()) as {
        message?:
          | SidebarItem[]
          | { pages?: SidebarItem[]; page?: SidebarItem[] };
      };

      if (Array.isArray(data?.message)) return data.message;
      if (Array.isArray(data?.message?.pages)) return data.message.pages;
      if (Array.isArray(data?.message?.page)) return data.message.page;
      return [];
    } catch (error) {
      console.error(
        "Error fetching sidebar items:",
        error instanceof Error ? error.message : String(error),
      );
      return [];
    }
  })();

  return (
    <ProtectedAppShell
      sidebarItems={sidebarItems}
      user={{
        name: session?.user?.name,
        email: session?.user?.email,
        username: session?.user?.username,
        siteId: session?.user?.siteId,
        image: session?.user?.image,
      }}
    >
      {children}
    </ProtectedAppShell>
  );
}
