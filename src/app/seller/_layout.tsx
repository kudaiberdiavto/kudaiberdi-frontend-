import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui'
import { TabBarContainer, TabButton } from '@/components/tab-bar'
import { BoxIcon, ChatIcon, RequestsIcon, StatsIcon, TagIcon } from '@/components/icons'

export default function SellerLayout() {
	return (
		<Tabs>
			<TabSlot />

			<TabBarContainer>
				<TabTrigger name="requests" asChild>
					<TabButton icon={RequestsIcon} label="Запросы" />
				</TabTrigger>
				<TabTrigger name="products" asChild>
					<TabButton icon={TagIcon} label="Товары" />
				</TabTrigger>
				<TabTrigger name="chats" asChild>
					<TabButton icon={ChatIcon} label="Чаты" badge={2} />
				</TabTrigger>
				<TabTrigger name="stats" asChild>
					<TabButton icon={StatsIcon} label="Статистика" />
				</TabTrigger>
				<TabTrigger name="box" asChild>
					<TabButton icon={BoxIcon} label="Мой бокс" />
				</TabTrigger>
			</TabBarContainer>

			<TabList style={{ display: 'none' }}>
				<TabTrigger name="requests" href="/seller" />
				<TabTrigger name="products" href="/seller/products" />
				<TabTrigger name="chats" href="/seller/chats" />
				<TabTrigger name="stats" href="/seller/stats" />
				<TabTrigger name="box" href="/seller/box" />
			</TabList>
		</Tabs>
	)
}
