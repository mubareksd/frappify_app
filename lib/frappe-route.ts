import { env } from "@/lib/env";

export type ResolvedFrappeRoute =
  | {
      type: "workspace";
      workspace: string;
      slug: string[];
    }
  | {
      type: "page";
      page: string;
      slug: string[];
    }
  | {
      type: "doctype-list";
      doctype: string;
      slug: string[];
    }
  | {
      type: "form";
      doctype: string;
      name: string;
      slug: string[];
    }
  | {
      type: "unknown";
      slug: string[];
    };

// ---------- fallback (fast local resolver) ----------

const KNOWN_DESK_PAGES = new Set([
  "backups",
  "background_jobs",
  "installed-applications",
  "user-profile",
  "query-report",
  "print",
  "calendar",
  "dashboard-view",
  "welcome-to-frappe",
]);

function isPageRoute(segment: string) {
  if (KNOWN_DESK_PAGES.has(segment)) return true;
  return segment.includes("_");
}

export function resolveFrappeRoute(slug: string[]): ResolvedFrappeRoute {
  if (slug.length === 0 || !slug[0]) {
    return { type: "unknown", slug };
  }

  if (slug.length === 1) {
    const segment = slug[0];

    if (isPageRoute(segment)) {
      return { type: "page", page: segment, slug };
    }

    return { type: "workspace", workspace: segment, slug };
  }

  if (slug.length >= 3 && slug[1] === "view" && slug[2] === "list") {
    return {
      type: "doctype-list",
      doctype: slug[0],
      slug,
    };
  }

  if (slug.length === 2) {
    return {
      type: "form",
      doctype: slug[0],
      name: slug[1],
      slug,
    };
  }

  return { type: "unknown", slug };
}

// ---------- API helpers ----------

async function frappeExists(
  url: string,
  accessToken: string,
  siteId: string
): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Frappe-Site": siteId,
        "Accept-Encoding": "identity",
      },
    });

    return res.ok;
  } catch {
    return false;
  }
}

// ---------- main resolver ----------

export async function resolveFrappeRouteWithApi(
  slug: string[],
  accessToken: string,
  siteId: string
): Promise<ResolvedFrappeRoute> {
  if (slug.length === 0 || !slug[0]) {
    return { type: "unknown", slug };
  }

  const base = `${env.API_URL}/resource`;

  const route = slug[0];
  const sub = slug[1];

  try {
    const [isWorkspace, isPage, isDoctype] = await Promise.all([
      frappeExists(`${base}/Workspace/${route}`, accessToken, siteId),
      frappeExists(`${base}/Page/${route}`, accessToken, siteId),
      frappeExists(`${base}/DocType/${route}`, accessToken, siteId),
    ]);

    if (isWorkspace) {
      return {
        type: "workspace",
        workspace: route,
        slug,
      };
    }

    if (isPage) {
      return {
        type: "page",
        page: route,
        slug,
      };
    }

    if (isDoctype) {
      if (slug.length === 2) {
        return {
          type: "form",
          doctype: route,
          name: sub,
          slug,
        };
      }

      return {
        type: "doctype-list",
        doctype: route,
        slug,
      };
    }

    // fallback to local logic
    return resolveFrappeRoute(slug);
  } catch {
    return resolveFrappeRoute(slug);
  }
}