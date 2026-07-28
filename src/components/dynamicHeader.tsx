"use client";

import { usePathname } from "next/navigation";
import { sidebar_items } from "./app-sidebar";
import ContainerHeader from "./containerHeader";

interface DynamicHeaderProps {
  count?: number;
  titleOverride?: string;
}

export default function DynamicHeader({ count, titleOverride }: DynamicHeaderProps) {
  const pathname = usePathname();

  const findTriggerAndTitle = () => {
    for (const group of sidebar_items) {
      for (const item of group.item) {
        // Top-level item тохирвол (child байхгүй)
        if (item.url && item.url === pathname) {
          return { trigger: item.triggerLabel, title: "" };
        }

        // Children дотор хайх
        if (item.children) {
          for (const child of item.children) {
            if (child.url === pathname) {
              return { trigger: item.triggerLabel, title: child.title };
            }
          }
        }
      }
    }
    return { trigger: "", title: "" };
  };

  const { trigger, title } = findTriggerAndTitle();
  const titlePath = titleOverride ?? title;

  return <ContainerHeader trigger={trigger} title={titlePath} count={count} />;
}
