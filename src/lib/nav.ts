import {
	LayoutDashboard,
	Users,
	Wrench,
	ClipboardList,
	Package,
	MessageSquare,
	Star,
	Radio,
	BookOpen,
	BellRing
} from '@lucide/svelte';
import type { Component } from 'svelte';

export interface NavItem {
	href: string;
	label: string;
	icon: Component;
}

// Sections map to the platform domain: users by role, the Job→Proposal→Order funnel,
// chats, reviews, the dispatcher brain, and reference data.
export const navItems: NavItem[] = [
	{ href: '/', label: 'Дашборд', icon: LayoutDashboard },
	{ href: '/clients', label: 'Клієнти', icon: Users },
	{ href: '/masters', label: 'Майстри', icon: Wrench },
	{ href: '/jobs', label: 'Заявки', icon: ClipboardList },
	{ href: '/orders', label: 'Замовлення', icon: Package },
	{ href: '/chats', label: 'Чати', icon: MessageSquare },
	{ href: '/reviews', label: 'Відгуки', icon: Star },
	{ href: '/dispatch', label: 'Диспетчер', icon: Radio },
	{ href: '/catalog', label: 'Довідники', icon: BookOpen },
	{ href: '/notifications', label: 'Сповіщення', icon: BellRing }
];
