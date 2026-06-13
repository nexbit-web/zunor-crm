import type { ComponentType } from "svelte";
import {
  Home,
  MessageSquare,
  Users,
  Briefcase,
  Calendar,
  Sparkles,
  LayoutGrid,
  UserPlus,
} from "lucide-svelte";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType;
  badge?: number;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/chat", label: "Chat", icon: MessageSquare, badge: 3 },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/deals", label: "Deals", icon: Briefcase, badge: 7 },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/ai", label: "AI", icon: Sparkles },
  { href: "/more", label: "More", icon: LayoutGrid },
];

export const bottomNavItems: NavItem[] = [
  { href: "/invite", label: "Invite", icon: UserPlus },
];
