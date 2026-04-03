import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Dashboard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-linear-to-r from-card via-card to-muted/20 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {value}
            </h1>
          </div>
          <Badge variant="outline">Dashboard</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{value}</CardTitle>
          <CardDescription>
            Dashboard route resolved successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This route now correctly recognizes URLs shaped like{" "}
            /app/dashboard-view/{value}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
