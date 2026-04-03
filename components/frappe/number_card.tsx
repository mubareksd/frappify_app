import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { env } from "@/lib/env";

type NumberCardDoc = {
  name: string;
  label?: string;
  document_type?: string;
  function?: string;
  show_percentage_stats?: number;
  filters_json?: string;
  dynamic_filters_json?: string;
};

type NumberCardProps = {
  name: string;
  label?: string;
  accessToken: string;
  siteId: string;
};

function formatNumberCardValue(input: unknown) {
  if (typeof input !== "number") {
    return String(input ?? "0");
  }

  return new Intl.NumberFormat("en-US", {
    notation: Math.abs(input) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(input);
}

function parseJsonSafely<T>(input: string | undefined, fallback: T): T {
  if (!input) {
    return fallback;
  }

  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

async function getUserDefault(
  key: string,
  accessToken: string,
  siteId: string,
) {
  try {
    const response = await fetch(
      `${env.API_URL}/method/frappe.defaults.get_user_default?key=${encodeURIComponent(key)}`,
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

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    return json?.message ?? null;
  } catch {
    return null;
  }
}

async function resolveDynamicValue(
  input: unknown,
  accessToken: string,
  siteId: string,
) {
  if (typeof input !== "string") {
    return input;
  }

  const userDefaultMatch = input.match(
    /^frappe\.defaults\.get_user_default\((?:"|')([^"']+)(?:"|')\)$/,
  );

  if (userDefaultMatch) {
    return getUserDefault(userDefaultMatch[1], accessToken, siteId);
  }

  return input;
}

async function resolveNumberCardFilters(
  doc: NumberCardDoc,
  accessToken: string,
  siteId: string,
) {
  const baseFilters = parseJsonSafely<unknown[][]>(doc.filters_json, []);
  const dynamicFilters = parseJsonSafely<unknown[][]>(
    doc.dynamic_filters_json,
    [],
  );

  const resolvedDynamicFilters = await Promise.all(
    dynamicFilters.map(async (filter) => {
      if (!Array.isArray(filter) || filter.length < 4) {
        return filter;
      }

      const resolvedValue = await resolveDynamicValue(
        filter[3],
        accessToken,
        siteId,
      );
      return filter.map((item, index) => (index === 3 ? resolvedValue : item));
    }),
  );

  return [...baseFilters, ...resolvedDynamicFilters];
}

export default async function NumberCard({
  name,
  label,
  accessToken,
  siteId,
}: NumberCardProps) {
  let doc: NumberCardDoc | null = null;
  let result: unknown = 0;

  try {
    const docRes = await fetch(
      `${env.API_URL}/method/frappe.desk.form.load.getdoc?doctype=${encodeURIComponent("Number Card")}&name=${encodeURIComponent(name)}`,
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

    if (!docRes.ok) {
      return (
        <Card className="h-full border-destructive/30">
          <CardHeader>
            <CardTitle>{label || name}</CardTitle>
            <CardDescription>Failed to load number card</CardDescription>
          </CardHeader>
        </Card>
      );
    }

    const docJson = await docRes.json();
    doc = Array.isArray(docJson?.docs)
      ? (docJson.docs[0] as NumberCardDoc)
      : null;

    if (doc) {
      const resolvedFilters = await resolveNumberCardFilters(
        doc,
        accessToken,
        siteId,
      );

      const body = new URLSearchParams({
        doc: JSON.stringify(doc),
        filters: JSON.stringify(resolvedFilters),
      });

      const resultRes = await fetch(
        `${env.API_URL}/method/frappe.desk.doctype.number_card.number_card.get_result`,
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

      if (resultRes.ok) {
        const resultJson = await resultRes.json();
        result = resultJson?.message ?? 0;
      }
    }
  } catch {
    return (
      <Card className="h-full border-destructive/30">
        <CardHeader>
          <CardTitle>{label || name}</CardTitle>
          <CardDescription>Unable to fetch card data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-linear-to-br from-card via-card to-muted/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{doc?.label || label || name}</CardTitle>
            <CardDescription>
              {doc?.document_type || "Document"}
            </CardDescription>
          </div>
          {doc?.function ? (
            <Badge variant="outline">{doc.function}</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight text-foreground">
          {formatNumberCardValue(result)}
        </div>
      </CardContent>
    </Card>
  );
}
