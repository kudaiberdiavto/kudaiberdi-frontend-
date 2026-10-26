import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui'
import { TabBarContainer, TabButton } from '@/components/tab-bar'
import { useUnread } from '@/api/chats'
import { useMasterFeed } from '@/api/services'
import { flattenPages } from '@/api/pagination'
import { ChatIcon, ProfileIcon, RequestsIcon, SearchIcon } from '@/components/icons'

/** Master tabs: Заявки · Запчасти · Чаты · Профиль (мастер тоже покупает запчасти — для машины клиента). */
export default function MasterLayout() {
	// Unread chats with clients and with sellers (parts for a client's car) — kept live by the UNREAD event.
	const unreadData = useUnread().data
	const unread = (unreadData?.asMaster ?? 0) + (unreadData?.asBuyer ?? 0)
	// New requests without an answer — the badge on «Заявки» [18, 20].
	const fresh = flattenPages(useMasterFeed('NEW').data).filter((item) => !item.myOffer).length

	return (
		<Tabs>
			<TabSlot />

			<TabBarContainer>
				<TabTrigger name="requests" asChild>
					<TabButton icon={RequestsIcon} label="Заявки" badge={fresh || undefined} />
				</TabTrigger>
				<TabTrigger name="parts" asChild>
					<TabButton icon={SearchIcon} label="Запчасти" />
				</TabTrigger>
				<TabTrigger name="chats" asChild>
					<TabButton icon={ChatIcon} label="Чаты" badge={unread || undefined} />
				</TabTrigger>
				<TabTrigger name="profile" asChild>
					<TabButton icon={ProfileIcon} label="Профиль" />
				</TabTrigger>
			</TabBarContainer>

			<TabList style={{ display: 'none' }}>
				<TabTrigger name="requests" href="/master" />
				<TabTrigger name="parts" href="/master/parts" />
				<TabTrigger name="chats" href="/master/chats" />
				<TabTrigger name="profile" href="/master/profile" />
			</TabList>
		</Tabs>
	)
}
