import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui'
import { TabBarContainer, TabButton } from '@/components/tab-bar'
import { useUnread } from '@/api/chats'
import { ChatIcon, ProfileIcon, RequestsIcon, StatsIcon } from '@/components/icons'

/** Master tabs [39]: Заявки · Чаты · Статистика · Профиль. */
export default function MasterLayout() {
	// Unread chats with clients — kept live by the UNREAD event.
	const unread = useUnread().data?.asMaster ?? 0

	return (
		<Tabs>
			<TabSlot />

			<TabBarContainer>
				<TabTrigger name="requests" asChild>
					<TabButton icon={RequestsIcon} label="Заявки" />
				</TabTrigger>
				<TabTrigger name="chats" asChild>
					<TabButton icon={ChatIcon} label="Чаты" badge={unread || undefined} />
				</TabTrigger>
				<TabTrigger name="stats" asChild>
					<TabButton icon={StatsIcon} label="Статистика" />
				</TabTrigger>
				<TabTrigger name="profile" asChild>
					<TabButton icon={ProfileIcon} label="Профиль" />
				</TabTrigger>
			</TabBarContainer>

			<TabList style={{ display: 'none' }}>
				<TabTrigger name="requests" href="/master" />
				<TabTrigger name="chats" href="/master/chats" />
				<TabTrigger name="stats" href="/master/stats" />
				<TabTrigger name="profile" href="/master/profile" />
			</TabList>
		</Tabs>
	)
}
