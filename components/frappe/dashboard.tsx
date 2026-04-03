import { Badge } from "@/components/ui/badge";
import Chart from "@/components/frappe/chart";
import NumberCard from "@/components/frappe/number_card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { env } from "@/lib/env";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";

type DashboardCardLink = {
  card: string;
};

type DashboardChartLink = {
  chart: string;
  width?: string;
};

function chartWidthClass(width: string | undefined) {
  if (width === "Half") {
    return "col-span-1 md:col-span-6";
  }

  return "col-span-1 md:col-span-12";
}

export default async function Dashboard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
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

  let cards: DashboardCardLink[] = [];
  let charts: DashboardChartLink[] = [];

  try {
    const [cardsRes, chartsRes] = await Promise.all([
      fetch(
        `${env.API_URL}/method/frappe.desk.doctype.dashboard.dashboard.get_permitted_cards`,
        {
          method: "POST",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Frappe-Site": siteId,
            "Accept-Encoding": "identity",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          body: new URLSearchParams({ dashboard_name: value }).toString(),
        },
      ),
      fetch(
        `${env.API_URL}/method/frappe.desk.doctype.dashboard.dashboard.get_permitted_charts`,
        {
          method: "POST",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Frappe-Site": siteId,
            "Accept-Encoding": "identity",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          body: new URLSearchParams({ dashboard_name: value }).toString(),
        },
      ),
    ]);

    if (cardsRes.ok) {
      const cardsJson = await cardsRes.json();
      cards = Array.isArray(cardsJson?.message)
        ? (cardsJson.message as DashboardCardLink[])
        : [];
    }

    if (chartsRes.ok) {
      const chartsJson = await chartsRes.json();
      charts = Array.isArray(chartsJson?.message)
        ? (chartsJson.message as DashboardChartLink[])
        : [];
    }
  } catch {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>{value}</CardTitle>
          <CardDescription>Unable to load dashboard data.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-linear-to-r from-card via-card to-muted/20 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            <h1 className="mt-2 break-words text-xl font-semibold tracking-tight sm:text-2xl">
              {value}
            </h1>
          </div>
          <Badge variant="outline">Dashboard</Badge>
        </div>
      </div>

      {cards.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold sm:text-lg">Overview</h2>
            <p className="text-sm text-muted-foreground">
              Key metrics for {value}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((card) => (
              <NumberCard
                key={card.card}
                name={card.card}
                accessToken={accessToken}
                siteId={siteId}
              />
            ))}
          </div>
        </section>
      ) : null}

      {charts.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold sm:text-lg">Charts</h2>
            <p className="text-sm text-muted-foreground">
              Visual summaries for {value}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-12">
            {charts.map((chart) => (
              <div key={chart.chart} className={chartWidthClass(chart.width)}>
                <Chart
                  name={chart.chart}
                  accessToken={accessToken}
                  siteId={siteId}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {cards.length === 0 && charts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{value}</CardTitle>
            <CardDescription>
              No dashboard widgets were returned.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The route resolves correctly, but the dashboard has no permitted
              cards or charts for this user.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
