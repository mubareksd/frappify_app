import Chart from "@/components/frappe/chart";
import NumberCard from "@/components/frappe/number_card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { env } from "@/lib/env";
import { getCurrentSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

type WorkspaceProps = {
  title: string;
  value: string;
};

type WorkspaceDoc = {
  name: string;
  title?: string;
  label?: string;
  module?: string;
  content?: string;
};

type WorkspaceBlock = {
  id: string;
  type: string;
  data?: {
    col?: number;
    text?: string;
    shortcut_name?: string;
    card_name?: string;
    chart_name?: string;
    number_card_name?: string;
    onboarding_name?: string;
  };
};

type WorkspaceChartItem = {
  chart_name: string;
  label?: string;
};

type WorkspaceShortcutItem = {
  label: string;
  type?: string;
  link_to?: string | null;
  url?: string | null;
  color?: string | null;
  format?: string | null;
  is_query_report?: number;
};

type WorkspaceLink = {
  label: string;
  type?: string;
  link_type?: string | null;
  link_to?: string | null;
  url?: string | null;
  is_query_report?: number;
  description?: string | null;
};

type WorkspaceCardSection = {
  label: string;
  links?: WorkspaceLink[];
};

type WorkspaceOnboardingStep = {
  label: string;
};

type WorkspaceOnboarding = {
  label: string;
  title?: string;
  subtitle?: string;
  success?: string;
  items?: WorkspaceOnboardingStep[];
};

type WorkspaceNumberCardItem = {
  number_card_name: string;
  label?: string;
};

type DesktopPagePayload = {
  charts?: { items?: WorkspaceChartItem[] };
  shortcuts?: { items?: WorkspaceShortcutItem[] };
  cards?: { items?: WorkspaceCardSection[] };
  onboardings?: { items?: WorkspaceOnboarding[] };
  number_cards?: { items?: WorkspaceNumberCardItem[] };
};

function decodeHtml(input: string) {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const COL_SPAN_CLASSES = [
  "md:col-span-1",
  "md:col-span-2",
  "md:col-span-3",
  "md:col-span-4",
  "md:col-span-5",
  "md:col-span-6",
  "md:col-span-7",
  "md:col-span-8",
  "md:col-span-9",
  "md:col-span-10",
  "md:col-span-11",
  "md:col-span-12",
] as const;

function getBlockClass(col: number | undefined) {
  const safeCol = Math.min(Math.max(col || 12, 1), 12);
  return `col-span-1 ${COL_SPAN_CLASSES[safeCol - 1]}`;
}

function buildAppHref(
  type: string | undefined,
  linkTo: string | null | undefined,
  isQueryReport?: number,
) {
  if (!linkTo) {
    return null;
  }

  if (type === "URL") {
    return linkTo;
  }

  if (type === "Dashboard") {
    return `/app/${encodeURIComponent(linkTo)}`;
  }

  if (type === "Report" || isQueryReport) {
    return `/app/query-report/${encodeURIComponent(linkTo)}`;
  }

  return `/app/${encodeURIComponent(linkTo)}/view/list`;
}

function WorkspaceShortcutCard({ item }: { item: WorkspaceShortcutItem }) {
  const href = buildAppHref(
    item.type,
    item.link_to || item.url,
    item.is_query_report,
  );

  return (
    <Card className="h-full transition-colors hover:bg-muted/20">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="break-words text-sm">{item.label}</CardTitle>
          {item.color ? <Badge variant="outline">{item.color}</Badge> : null}
        </div>
        <CardDescription>{item.type || "Shortcut"}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {item.format ? (
          <p className="text-xs text-muted-foreground">{item.format}</p>
        ) : null}
        {href ? (
          item.type === "URL" ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Open
            </a>
          ) : (
            <Link
              href={href}
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Open
            </Link>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

function WorkspaceLinksCard({ section }: { section: WorkspaceCardSection }) {
  return (
    <Card className="h-full">
      <CardHeader className="p-4">
        <CardTitle className="break-words">{section.label}</CardTitle>
        <CardDescription>{section.links?.length || 0} links</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="space-y-2">
          {(section.links || []).map((link) => {
            const href = buildAppHref(
              link.type || link.link_type || undefined,
              link.link_to || link.url,
              link.is_query_report,
            );

            return (
              <div
                key={`${section.label}-${link.label}`}
                className="rounded-md border bg-muted/10 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{link.label}</p>
                    {link.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {link.description}
                      </p>
                    ) : null}
                  </div>
                  {link.type || link.link_type ? (
                    <Badge variant="outline">
                      {link.type || link.link_type}
                    </Badge>
                  ) : null}
                </div>
                {href ? (
                  link.type === "URL" ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Open
                    </a>
                  ) : (
                    <Link
                      href={href}
                      className="mt-2 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Open
                    </Link>
                  )
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkspaceOnboardingCard({
  onboarding,
}: {
  onboarding: WorkspaceOnboarding;
}) {
  return (
    <Card className="h-full bg-linear-to-br from-card via-card to-muted/20">
      <CardHeader className="p-4">
        <CardTitle className="break-words">
          {onboarding.title || onboarding.label}
        </CardTitle>
        <CardDescription>{onboarding.subtitle || "Onboarding"}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="space-y-2">
          {(onboarding.items || []).map((step) => (
            <div
              key={`${onboarding.label}-${step.label}`}
              className="rounded-md border bg-muted/10 px-3 py-2 text-xs"
            >
              {step.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function Workspace({ title, value }: WorkspaceProps) {
  const session = await getCurrentSession();
  const user = session?.user;
  const accessToken = session?.accessToken;
  const siteId = session?.user?.siteId;

  if (
    !user ||
    !accessToken ||
    !siteId ||
    session.error === "AccessTokenExpired"
  ) {
    redirect(`${env.PUBLIC_APP_URL}/login`);
  }

  let workspace: WorkspaceDoc | null = null;
  let desktopPayload: DesktopPagePayload = {};

  try {
    const workspaceRes = await fetch(
      `${env.API_URL}/resource/Workspace/${encodeURIComponent(value)}`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Frappe-Site": siteId,
          "Accept-Encoding": "identity",
        },
      },
    );

    if (!workspaceRes.ok) {
      return <div className="text-red-500">Failed to load workspace.</div>;
    }

    const workspaceJson = await workspaceRes.json();
    workspace = workspaceJson?.data as WorkspaceDoc;

    const body = new URLSearchParams({
      page: JSON.stringify(workspace),
    });

    const desktopRes = await fetch(
      `${env.API_URL}/method/frappe.desk.desktop.get_desktop_page`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Frappe-Site": siteId,
          "Accept-Encoding": "identity",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: body.toString(),
      },
    );

    if (desktopRes.ok) {
      const desktopJson = await desktopRes.json();
      desktopPayload = (desktopJson?.message || {}) as DesktopPagePayload;
    }
  } catch {
    return <div className="text-red-500">Unable to load workspace page.</div>;
  }

  if (!workspace) {
    return <div className="text-muted-foreground">Workspace not found.</div>;
  }

  const blocks = (() => {
    try {
      return JSON.parse(workspace.content || "[]") as WorkspaceBlock[];
    } catch {
      return [] as WorkspaceBlock[];
    }
  })();

  const chartsByName = new Map(
    (desktopPayload.charts?.items || []).map((item) => [item.chart_name, item]),
  );
  const shortcutsByName = new Map(
    (desktopPayload.shortcuts?.items || []).map((item) => [item.label, item]),
  );
  const cardsByName = new Map(
    (desktopPayload.cards?.items || []).map((item) => [item.label, item]),
  );
  const onboardingsByName = new Map(
    (desktopPayload.onboardings?.items || []).map((item) => [item.label, item]),
  );
  const numberCardsByName = new Map(
    (desktopPayload.number_cards?.items || []).map((item) => [
      item.number_card_name,
      item,
    ]),
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-linear-to-r from-card via-card to-muted/20 p-4 sm:p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="break-words text-xl font-semibold tracking-tight sm:text-2xl">
              {workspace.title || workspace.label || workspace.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {workspace.module || "Workspace"}
            </p>
          </div>
          <Badge variant="outline">Workspace</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-12">
        {blocks.map((block) => {
          const col = block.data?.col || 12;

          if (block.type === "spacer") {
            return (
              <div
                key={block.id}
                className={getBlockClass(col)}
                aria-hidden="true"
              />
            );
          }

          if (block.type === "header") {
            return (
              <div key={block.id} className={getBlockClass(col)}>
                <h2 className="break-words text-base font-semibold tracking-tight sm:text-lg">
                  {decodeHtml(block.data?.text || "Section")}
                </h2>
              </div>
            );
          }

          if (block.type === "number_card") {
            const item = block.data?.number_card_name
              ? numberCardsByName.get(block.data.number_card_name)
              : undefined;

            return (
              <div key={block.id} className={getBlockClass(col)}>
                <NumberCard
                  name={
                    item?.number_card_name ||
                    block.data?.number_card_name ||
                    "Number Card"
                  }
                  label={item?.label}
                  accessToken={accessToken}
                  siteId={siteId}
                />
              </div>
            );
          }

          if (block.type === "chart") {
            const item = block.data?.chart_name
              ? chartsByName.get(block.data.chart_name)
              : undefined;

            return (
              <div key={block.id} className={getBlockClass(col)}>
                <Chart
                  name={item?.chart_name || block.data?.chart_name || "Chart"}
                  label={item?.label}
                  accessToken={accessToken}
                  siteId={siteId}
                />
              </div>
            );
          }

          if (block.type === "shortcut") {
            const item = block.data?.shortcut_name
              ? shortcutsByName.get(block.data.shortcut_name)
              : undefined;

            return item ? (
              <div key={block.id} className={getBlockClass(col)}>
                <WorkspaceShortcutCard item={item} />
              </div>
            ) : null;
          }

          if (block.type === "card") {
            const item = block.data?.card_name
              ? cardsByName.get(block.data.card_name)
              : undefined;

            return item ? (
              <div key={block.id} className={getBlockClass(col)}>
                <WorkspaceLinksCard section={item} />
              </div>
            ) : null;
          }

          if (block.type === "onboarding") {
            const item = block.data?.onboarding_name
              ? onboardingsByName.get(block.data.onboarding_name)
              : undefined;

            return item ? (
              <div key={block.id} className={getBlockClass(col)}>
                <WorkspaceOnboardingCard onboarding={item} />
              </div>
            ) : null;
          }

          return (
            <div key={block.id} className={getBlockClass(col)}>
              <Card>
                <CardHeader>
                  <CardTitle>{block.type}</CardTitle>
                  <CardDescription>
                    Block type is not implemented yet
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
