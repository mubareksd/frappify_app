import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ChartProps = {
  name: string;
  label?: string;
};

export default function Chart({ name, label }: ChartProps) {
  return (
    <Card className="h-full bg-linear-to-br from-card via-card to-muted/20">
      <CardHeader>
        <CardTitle>{label || name}</CardTitle>
        <CardDescription>
          Chart rendering is not implemented yet
        </CardDescription>
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
        </div>
      </CardContent>
    </Card>
  );
}
