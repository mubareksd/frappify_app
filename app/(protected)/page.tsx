import { env } from "@/lib/env";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";

type FrappeApp = {
  name: string;
  logo?: string;
  title: string;
  route: string;
};

export default async function HomePage() {
  const session = await getCurrentSession();
  const user = session?.user;
  const accessToken = session?.accessToken;
  const siteId = session?.user.siteId;

  if (!user || !accessToken || !siteId || session.error === "AccessTokenExpired") {
    redirect("/login");
  }

  const apps: FrappeApp[] = await (async () => {
    try {
      const res = await fetch(`${env.API_URL}/method/frappe.apps.get_apps`, {
        method: "GET",
        cache: "no-store",
        headers: {
          
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Frappe-Site": siteId,
          "Accept-Encoding": "identity",
        },
      });

      console.log("Fetch apps response status: %d", res.status);

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Failed to fetch apps: ${res.status} ${res.statusText}${body ? ` - ${body}` : ""}`,
        );
      }

      const data = (await res.json()) as { message?: FrappeApp[] };
      return Array.isArray(data?.message) ? data.message : [];
    } catch (error) {
      console.error(
        "Error fetching apps:",
        error instanceof Error ? error.message : String(error),
      );
      return [];
    }
  })();

  const backendOrigin = new URL(env.API_URL).origin;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Select an app to continue.
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No apps were returned by the server.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => {
            const logoUrl = app.logo
              ? `/api/asset?path=${encodeURIComponent(app.logo)}`
              : "";

            return (
              <a
                key={app.name}
                href={app.route}
                className="group block rounded-xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt={`${app.title} logo`}
                      className="h-10 w-10 rounded-md border bg-white object-contain p-1"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md border bg-muted" />
                  )}

                  <div>
                    <h2 className="font-medium text-foreground group-hover:text-primary">
                      {app.title}
                    </h2>
                    <p className="text-xs text-muted-foreground">{app.route}</p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}