import { ResolvedFrappeRoute } from "@/lib/frappe-route";
import DoctypeList from "./doctype_list";
import DoctypeForm from "./doctype_form";
import Workspace from "./workspace";

type RoutePlaceholderProps = {
  route: Exclude<ResolvedFrappeRoute, { type: "unknown" }>;
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

export function RoutePlaceholder({ route }: RoutePlaceholderProps) {
  if (route.type === "form") {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-xl border bg-card p-4 sm:p-6">
          <DoctypeForm title="Form" value={route.doctype} name={route.name} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-xl border bg-card p-6">
        <h1 className="text-xl font-semibold text-foreground">
          Frappe Route Resolver
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Minimal route rendering is enabled. Replace this with real UI.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Label title="Type" value={route.type} />
          <Label title="Slug" value={`/${route.slug.join("/")}`} />

                  {route.type === "workspace" && (
                      <Workspace title="Workspace" value={route.workspace} />
          )}

          {route.type === "page" && (
            <Label title="Page" value={route.page} />
          )}

                  {route.type === "doctype-list" && (
                    <DoctypeList title="Doctype" value={route.doctype} />
          )}
        </div>
      </div>
    </div>
  );
}