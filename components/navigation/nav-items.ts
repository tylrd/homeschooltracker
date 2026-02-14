import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  CalendarCheck,
  ClipboardList,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Today", icon: CalendarCheck },
  { href: "/shelf", label: "Shelf", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/attendance", label: "Attendance", icon: ClipboardList },
  { href: "/students", label: "Students", icon: Users },
];
