import { ChatList } from '@/components/chat-list'

/** Master's chats: with clients (opened by «Могу помочь») and with sellers he asked for parts for a client's car. */
export default function MasterChatsScreen() {
	return (
		<ChatList
			as="MASTER"
			sides={[
				{ as: 'MASTER', label: 'Клиенты' },
				{ as: 'BUYER', label: 'Продавцы' },
			]}
		/>
	)
}
