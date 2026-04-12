"use client";

import {
  IconCirclePlusFilled,
  IconMail,
  IconChevronRight,
  type Icon,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { nextRoute } from "@/lib/route";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export type NavItem = {
  title: string;
  url: string;
  icon?: Icon;
  /** If provided, this item becomes a collapsible parent with nested items */
  items?: { title: string; url: string; icon?: Icon }[];
};

export function NavMain({ items }: { items: NavItem[] }) {
  const { changeRoute } = nextRoute();
  const pathname = usePathname();
  const t = useTranslations("nav");

  const isActive = (url: string) => pathname === url;

  /** An item is "active" if its URL matches OR any of its children match */
  const isParentActive = (item: NavItem) => {
    if (pathname === item.url) return true;
    if (item.items) {
      return item.items.some((child) => pathname === child.url || pathname.startsWith(child.url + "/"));
    }
    return false;
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip={t("quickCreate")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>{t("quickCreate")}</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">{t("inbox")}</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu>
          {items.map((item) => {
            // If this item has sub-items, render as a collapsible group
            if (item.items && item.items.length > 0) {
              const parentActive = isParentActive(item);
              return (
                <Collapsible
                  key={item.title}
                  defaultOpen={parentActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={
                          "min-w-8 duration-200 ease-linear cursor-pointer " +
                          (parentActive
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground data-[state=open]:bg-primary data-[state=open]:text-primary-foreground data-[state=open]:hover:bg-primary/90 data-[state=open]:hover:text-primary-foreground"
                            : "hover:bg-muted hover:text-foreground")
                        }
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <IconChevronRight className="ms-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((child) => (
                          <SidebarMenuSubItem key={child.title}>
                            <SidebarMenuSubButton
                              onClick={() => changeRoute(child.url)}
                              isActive={isActive(child.url)}
                              className="cursor-pointer"
                            >
                              {child.icon && <child.icon className="h-4 w-4" />}
                              <span>{child.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            // Plain top-level item
            return (
              <SidebarMenuItem
                onClick={() => changeRoute(item.url)}
                key={item.title}
              >
                <SidebarMenuButton
                  tooltip={item.title}
                  className={
                    "min-w-8 duration-200 ease-linear cursor-pointer " +
                    (isActive(item.url)
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/90"
                      : "hover:bg-muted hover:text-foreground")
                  }
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
