import { SidebarItem } from "@/app/(protected)/app/layout";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";

export default function AppSidebar({ sidebarItems }: { sidebarItems: SidebarItem[] }) {
  const nameSet = new Set(sidebarItems.map((item) => item.name));

  const childrenByParent = sidebarItems.reduce<Record<string, SidebarItem[]>>(
    (acc, item) => {
      const parent = item.parent_page?.trim();
      if (parent && nameSet.has(parent)) {
        acc[parent] ??= [];
        acc[parent].push(item);
      }
      return acc;
    },
    {},
  );

  const topLevelItems = sidebarItems.filter((item) => {
    const parent = item.parent_page?.trim();
    return !parent || !nameSet.has(parent);
  });

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarMenu>
          {topLevelItems.map((item) => {
            const children = childrenByParent[item.name] ?? [];

            if (children.length === 0) {
              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <Link href={`/app/${encodeURIComponent(item.name)}`}>
                      <span>{item.label || item.title || item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            return (
              <Collapsible key={item.name}>
                <SidebarMenuItem>
                  <div className="flex items-center gap-1">
                    <SidebarMenuButton asChild className="flex-1">
                      <Link href={`/app/${encodeURIComponent(item.name)}`}>
                        <span>{item.label || item.title || item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        className="inline-flex size-7 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        aria-label={`Toggle ${item.label || item.title || item.name}`}
                      >
                        <span className="text-xs">▾</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {children.map((child) => (
                        <SidebarMenuSubItem key={child.name}>
                          <SidebarMenuSubButton asChild>
                            <Link href={`/app/${encodeURIComponent(child.name)}`}>
                              <span>{child.label || child.title || child.name}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
