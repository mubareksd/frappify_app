"use client";

import type { SidebarItem } from "@/app/(protected)/app/layout";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";

export default function AppSidebar({ sidebarItems }: { sidebarItems: SidebarItem[] }) {
  const pathname = usePathname();

  const visibleItems = sidebarItems.filter((item) => {
    if (!item.name?.trim()) return false;

    const isHidden = item.is_hidden === 1 || item.is_hidden === true;
    return !isHidden;
  });

  const nameSet = new Set(visibleItems.map((item) => item.name));

  const hrefFor = (name: string) => `/app/${encodeURIComponent(name)}`;

  const childrenByParent = visibleItems.reduce<Record<string, SidebarItem[]>>(
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

  const topLevelItems = visibleItems.filter((item) => {
    const parent = item.parent_page?.trim();
    return !parent || !nameSet.has(parent);
  });

  const isPathActive = (name: string) => pathname === hrefFor(name);

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/app" || pathname === "/"}>
              <Link href="/app">
                <span>Frappify</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarMenu>
          {topLevelItems.map((item) => {
            const children = childrenByParent[item.name] ?? [];
            const itemActive = isPathActive(item.name);
            const hasActiveChild = children.some((child) => isPathActive(child.name));

            if (children.length === 0) {
              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={itemActive}>
                    <Link href={hrefFor(item.name)}>
                      <span>{item.label || item.title || item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            return (
              <Collapsible key={item.name} defaultOpen={itemActive || hasActiveChild}>
                <SidebarMenuItem>
                  <div className="flex items-center gap-1">
                    <SidebarMenuButton asChild className="flex-1" isActive={itemActive}>
                      <Link href={hrefFor(item.name)}>
                        <span>{item.label || item.title || item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
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
                          <SidebarMenuSubButton asChild isActive={isPathActive(child.name)}>
                            <Link href={hrefFor(child.name)}>
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

          {topLevelItems.length === 0 ? (
            <SidebarMenuItem>
              <div className="px-2 py-3 text-xs text-sidebar-foreground/70">No sidebar items available.</div>
            </SidebarMenuItem>
          ) : null}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/"}>
              <Link href="/">Apps</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
