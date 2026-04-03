import { ResolvedFrappeRoute } from "@/lib/frappe-route";
import DoctypeList from "./doctype_list";
import DoctypeForm from "./doctype_form";
import Workspace from "./workspace";

type RoutePlaceholderProps = {
  route: Exclude<ResolvedFrappeRoute, { type: "unknown" }>;
  currentPage: number;
  pageSize: number;
};

function Label({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}

export function RoutePlaceholder({
  route,
  currentPage,
  pageSize,
}: RoutePlaceholderProps) {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        {route.type === "workspace" && (
          <Workspace title="Page" value={route.workspace} />
        )}

        {route.type === "page" && <Label title="Page" value={route.page} />}

        {route.type === "doctype-list" && (
          <DoctypeList
            title="Doctype"
            value={route.doctype}
            currentPage={currentPage}
            pageSize={pageSize}
            listPath={`/app/${route.slug.join("/")}`}
          />
        )}

        {route.type === "form" && (
          <DoctypeForm title="Form" value={route.doctype} name={route.name} />
        )}
      </div>
    </div>
  );
}
