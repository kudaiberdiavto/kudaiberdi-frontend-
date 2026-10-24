import { router } from 'expo-router'
import { TabBarContainer, TabButton } from '@/components/tab-bar'
import { useUnread } from '@/api/chats'
import { ChatIcon, HomeIcon, MarketIcon, ProfileIcon } from '@/components/icons'

const TABS = [
	{ name: 'home', href: '/buyer', icon: HomeIcon, label: 'Главная' },
	{ name: 'market', href: '/buyer/market', icon: MarketIcon, label: 'Рынок' },
	{ name: 'chats', href: '/buyer/chats', icon: ChatIcon, label: 'Чаты' },
	{ name: 'profile', href: '/buyer/profile', icon: ProfileIcon, label: 'Профиль' },
] as const

/**
 * The buyer TabBar for stack screens that show it in the mockup —
 * same look as buyer/_layout, but a tap navigates back into the tabs.
 */
export function BuyerTabBar({ active }: { active: (typeof TABS)[number]['name'] }) {
	const unread = useUnread().data?.asBuyer ?? 0
	return (
		<TabBarContainer>
			{TABS.map((tab) => (
				<TabButton
					key={tab.name}
					icon={tab.icon}
					label={tab.label}
					isFocused={tab.name === active}
					badge={tab.name === 'chats' ? unread || undefined : undefined}
					onPress={() => router.navigate(tab.href)}
				/>
			))}
		</TabBarContainer>
	)
}
