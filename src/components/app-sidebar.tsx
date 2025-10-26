"use client";

import {
  ChevronUp,
  LayoutDashboard,
  ClipboardCheck,
  Wallet,
  SquareUserRound,
  Milk,
  ChevronRight,
  UsersRound,
  UserRound,
  HandCoins,
  CalendarRange,
  Globe,
  SquareMenu,
  Users,
  UserSquare,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { useSidebarStore } from "@/stores/sidebar.store";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

// Menu items.
export const sidebar_items = [
  {
    groupLabel: "Админ удирдлага",
    item: [
      {
        triggerLabel: "Хянах самбар",
        url: "/",
        // icon: GraphIcon,
        icon: LayoutDashboard,
      },

      {
        triggerLabel: "Захиалга",
        url: "",
        icon: ClipboardCheck,
        children: [
          {
            title: "Захиалгын удирдлага",
            url: "/orders",
            // icon: Milk,
          },
        ],
      },

      {
        triggerLabel: "Цагийн хуваарь",
        url: "",
        icon: CalendarRange,
        children: [
          {
            title: "Цагийн хуваарийн удирдлага",
            url: "/booking",
            // icon: Milk,
          },
          {
            title: "Ажилчдын цагийн хуваарь",
            url: "/booking/employee",
            // icon: Milk,
          },
        ],
      },

      {
        triggerLabel: "Цалин",
        url: "",
        icon: Wallet,
        children: [
          {
            title: "Цалингийн удирдлага",
            url: "/salaries",
            // icon: Milk,
          },
          {
            title: "Урьдчилгаа",
            url: "/salaries/pre",
          },
          {
            title: "Танилын будалт",
            url: "/salaries/friends",
          },
        ],
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/logout").then((d) => router.push("/login"));
  };
  const { value, setValue } = useSidebarStore();
  // const [openIndex, setOpenIndex] = useState(null)
  if (pathname == "/login") return;
  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="fixed top-0 backdrop-blur-3xl bg-primary"
    >
      {/* Header */}
      <SidebarHeader className="border-b border-slate-600">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              size={"logo"}
              className="pointer-events-none px-0 py-2 text-white"
            >
              <Image
                src={"/logo/zu-white.png"}
                alt="logo"
                width={60}
                height={60}
                className="rounded-lg object-cover"
              />
              <div className="w-[1px] h-2/3 bg-white/20" />
              <span className="font-bold uppercase">
                Zu Nailbar Artist panel
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <ScrollArea className="h-full pr-1">
          <>
            {sidebar_items.map((group, gi) => (
              <SidebarGroup key={gi}>
                {group.groupLabel && (
                  <SidebarGroupLabel className="opacity-60">
                    {group.groupLabel}
                  </SidebarGroupLabel>
                )}

                <SidebarMenu className="h-fit">
                  {group.item.map((item, mi) => {
                    const hasChildren = !!item.children?.length;
                    const isActive = item.url === pathname;

                    return (
                      <Collapsible key={mi} className="group/collapsible">
                        <SidebarMenuItem className="text-white">
                          {hasChildren ? (
                            <CollapsibleTrigger
                              asChild
                              className="group-data-[state=open]/collapsible:bg-white/20"
                            >
                              <SidebarMenuButton
                                asChild
                                size="lg"
                                isActive={isActive}
                                className="active:bg-white/20 pl-4 hover:bg-white/20"
                              >
                                <div>
                                  <item.icon />
                                  <span>{item.triggerLabel}</span>
                                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                </div>
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                          ) : (
                            <SidebarMenuButton
                              asChild
                              size="lg"
                              isActive={isActive}
                              className="hover:bg-white/20 pl-4"
                            >
                              <Link
                                href={item.url}
                                className={cn(isActive && "text-sky-600")}
                              >
                                <item.icon />
                                <span>{item.triggerLabel}</span>
                              </Link>
                            </SidebarMenuButton>
                          )}

                          {hasChildren && (
                            <CollapsibleContent>
                              {item.children!.map((child, ci) => {
                                const isChildActive = child.url === pathname;
                                return (
                                  <SidebarMenuSub key={ci} className="w-full">
                                    <SidebarMenuSubItem className="w-full">
                                      <SidebarMenuSubButton
                                        asChild
                                        isActive={isChildActive}
                                        className="active:bg-white/20 text-white"
                                      >
                                        <Link
                                          href={child.url}
                                          className={cn(
                                            isChildActive && "text-sky-600",
                                            "w-full justify-between px-0"
                                          )}
                                        >
                                          {child.title}
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  </SidebarMenuSub>
                                );
                              })}
                            </CollapsibleContent>
                          )}
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </>
        </ScrollArea>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-slate-600">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size={"lg"}
                  className="text-white hover:bg-white/20"
                >
                  Админ
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <span>Гарах</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
