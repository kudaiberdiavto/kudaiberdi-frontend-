import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui'
import { TabBarContainer, TabButton } from '@/components/tab-bar'
import { useUnread } from '@/api/chats'
import { useMasterFeed } from '@/api/services'
import { flattenPages } from '@/api/pagination'
import { ChatIcon, ProfileIcon, RequestsIcon } from '@/components/icons'

/** Master tabs (v23): Заявки · Чаты · Профиль. */
export default function MasterLayout() {
	// Unread chats with clients — kept live by the UNREAD event.
	const unread = useUnread().data?.asMaster ?? 0
	// New requests without an answer — the badge on «Заявки» [18, 20].
	const fresh = flattenPages(useMasterFeed('NEW').data).filter((item) => !item.myOffer).length

	return (
		<Tabs>
			<TabSlot />

			<TabBarContainer>
				<TabTrigger name="requests" asChild>
					<TabButton icon={RequestsIcon} label="Заявки" badge={fresh || undefined} />
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
				<TabTrigger name="chats" href="/master/chats" />
				<TabTrigger name="profile" href="/master/profile" />
			</TabList>
		</Tabs>
	)
}
