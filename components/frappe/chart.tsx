import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { env } from "@/lib/env";

type ChartProps = {
  name: string;
  label?: string;
  accessToken?: string;
  siteId?: string;
};

type DashboardChartDoc = {
  chart_name?: string;
  report_name?: string | null;
  chart_type?: string | null;
  type?: string | null;
  document_type?: string | null;
};

export default async function Chart({
  name,
  label,
  accessToken,
  siteId,
}: ChartProps) {
  let doc: DashboardChartDoc | null = null;

  if (accessToken && siteId) {
    try {
      const response = await fetch(
        `${env.API_URL}/method/frappe.client.get?doctype=${encodeURIComponent("Dashboard Chart")}&name=${encodeURIComponent(name)}`,
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

      if (response.ok) {
        const json = await response.json();
        doc = (json?.message || null) as DashboardChartDoc | null;
      }
    } catch {
      doc = null;
    }
  }

  return (
    <Card className="h-full bg-linear-to-br from-card via-card to-muted/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{label || doc?.chart_name || name}</CardTitle>
            <CardDescription>
              {doc?.report_name || doc?.document_type || "Chart"}
            </CardDescription>
          </div>
          {doc?.type ? <Badge variant="outline">{doc.type}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-48 rounded-md border bg-muted/30 p-4">
            <div className="flex h-full items-end gap-3">
              <div className="h-20 w-full rounded-sm bg-primary/20" />
              <div className="h-32 w-full rounded-sm bg-primary/30" />
              <div className="h-24 w-full rounded-sm bg-primary/20" />
              <div className="h-40 w-full rounded-sm bg-primary/35" />
              <div className="h-28 w-full rounded-sm bg-primary/20" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {doc?.chart_type || "Dashboard chart"} preview placeholder
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
