import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui'
import { TabBarContainer, TabButton } from '@/components/tab-bar'
import { useUnread } from '@/api/chats'
import { useIncomingRequests } from '@/api/incoming'
import { flattenPages } from '@/api/pagination'
import { BoxIcon, ChatIcon, RequestsIcon } from '@/components/icons'

/** Seller tabs (v23): Запросы · Чаты · Мой бокс. */
export default function SellerLayout() {
	// Unread chats for this side — counted on the server, kept live by the UNREAD event.
	const unread = useUnread().data?.asShop ?? 0
	// New requests without an answer — the badge on «Запросы» [15].
	const fresh = flattenPages(useIncomingRequests('NEW').data).length

	return (
		<Tabs>
			<TabSlot />

			<TabBarContainer>
				<TabTrigger name="requests" asChild>
					<TabButton icon={RequestsIcon} label="Запросы" badge={fresh || undefined} />
				</TabTrigger>
				<TabTrigger name="chats" asChild>
					<TabButton icon={ChatIcon} label="Чаты" badge={unread || undefined} />
				</TabTrigger>
				<TabTrigger name="box" asChild>
					<TabButton icon={BoxIcon} label="Мой бокс" />
				</TabTrigger>
			</TabBarContainer>

			<TabList style={{ display: 'none' }}>
				<TabTrigger name="requests" href="/seller" />
				<TabTrigger name="chats" href="/seller/chats" />
				<TabTrigger name="box" href="/seller/box" />
			</TabList>
		</Tabs>
	)
}
