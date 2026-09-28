import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui'
import { TabBarContainer, TabButton } from '@/components/tab-bar'
import { ChatIcon, HomeIcon, MarketIcon, ProfileIcon, RequestsIcon } from '@/components/icons'

export default function BuyerLayout() {
	return (
		<Tabs>
			<TabSlot />

			<TabBarContainer>
				<TabTrigger name="home" asChild>
					<TabButton icon={HomeIcon} label="Главная" />
				</TabTrigger>
				<TabTrigger name="requests" asChild>
					<TabButton icon={RequestsIcon} label="Запросы" />
				</TabTrigger>
				<TabTrigger name="market" asChild>
					<TabButton icon={MarketIcon} label="Рынок" />
				</TabTrigger>
				<TabTrigger name="chats" asChild>
					<TabButton icon={ChatIcon} label="Чаты" badge={2} />
				</TabTrigger>
				<TabTrigger name="profile" asChild>
					<TabButton icon={ProfileIcon} label="Профиль" />
				</TabTrigger>
			</TabBarContainer>

			<TabList style={{ display: 'none' }}>
				<TabTrigger name="home" href="/buyer" />
				<TabTrigger name="requests" href="/buyer/requests" />
				<TabTrigger name="market" href="/buyer/market" />
				<TabTrigger name="chats" href="/buyer/chats" />
				<TabTrigger name="profile" href="/buyer/profile" />
			</TabList>
		</Tabs>
	)
}
