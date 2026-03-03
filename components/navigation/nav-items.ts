import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  CalendarCheck,
  ClipboardList,
  FolderOpen,
  Gift,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Today", icon: CalendarCheck },
  { href: "/shelf", label: "Shelf", icon: BookOpen },
  { href: "/documents", label: "Docs", icon: FolderOpen },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/attendance", label: "Attendance", icon: ClipboardList },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/students", label: "Students", icon: Users },
];
