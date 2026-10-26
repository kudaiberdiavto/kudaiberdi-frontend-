import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui'
import { usePathname } from 'expo-router'
import { TabBarContainer, TabButton } from '@/components/tab-bar'
import { useUnread } from '@/api/chats'
import { ChatIcon, HomeIcon, ProfileIcon } from '@/components/icons'
import { ReelsIcon } from '@/components/video-v23'
import { useMarketTab } from '@/store/useMarketTab'

/** Buyer tabs: Главная · Рынок · Чаты · Профиль. «Рынок» — the video feed (dark tab bar) or the market map. */
export default function BuyerLayout() {
	// Unread chats for this side — counted on the server, kept live by the UNREAD event.
	const unread = useUnread().data?.asBuyer ?? 0
	const pathname = usePathname()
	const video = useMarketTab((s) => s.mode === 'video')
	const dark = video && pathname === '/buyer/market'

	return (
		<Tabs>
			<TabSlot />

			<TabBarContainer dark={dark}>
				<TabTrigger name="home" asChild>
					<TabButton icon={HomeIcon} label="Главная" dark={dark} />
				</TabTrigger>
				<TabTrigger name="market" asChild>
					<TabButton icon={ReelsIcon} label="Рынок" dark={dark} />
				</TabTrigger>
				<TabTrigger name="chats" asChild>
					<TabButton icon={ChatIcon} label="Чаты" badge={unread || undefined} dark={dark} />
				</TabTrigger>
				<TabTrigger name="profile" asChild>
					<TabButton icon={ProfileIcon} label="Профиль" dark={dark} />
				</TabTrigger>
			</TabBarContainer>

			<TabList style={{ display: 'none' }}>
				<TabTrigger name="home" href="/buyer" />
				<TabTrigger name="market" href="/buyer/market" />
				<TabTrigger name="chats" href="/buyer/chats" />
				<TabTrigger name="profile" href="/buyer/profile" />
			</TabList>
		</Tabs>
	)
}
