import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui'
import { TabBarContainer, TabButton } from '@/components/tab-bar'
import { useUnread } from '@/api/chats'
import { ChatIcon, HomeIcon, ProfileIcon, SearchIcon } from '@/components/icons'
import { t } from '@/i18n'

/** Buyer tabs: Главная · Запчасти · Чаты · Профиль (карта рынка пока убрана). «Мои запросы» — на главной [03]. */
export default function BuyerLayout() {
	// Unread chats for this side — counted on the server, kept live by the UNREAD event.
	const unread = useUnread().data?.asBuyer ?? 0

	return (
		<Tabs>
			<TabSlot />

			<TabBarContainer>
				<TabTrigger name="home" asChild>
					<TabButton icon={HomeIcon} label={t('Главная')} />
				</TabTrigger>
				<TabTrigger name="parts" asChild>
					<TabButton icon={SearchIcon} label={t('Запчасти')} />
				</TabTrigger>
				<TabTrigger name="chats" asChild>
					<TabButton icon={ChatIcon} label={t('Чаты')} badge={unread || undefined} />
				</TabTrigger>
				<TabTrigger name="profile" asChild>
					<TabButton icon={ProfileIcon} label={t('Профиль')} />
				</TabTrigger>
			</TabBarContainer>

			<TabList style={{ display: 'none' }}>
				<TabTrigger name="home" href="/buyer" />
				<TabTrigger name="parts" href="/buyer/parts" />
				<TabTrigger name="chats" href="/buyer/chats" />
				<TabTrigger name="profile" href="/buyer/profile" />
			</TabList>
		</Tabs>
	)
}
