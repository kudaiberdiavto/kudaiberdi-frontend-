import { ChatList } from '@/components/chat-list'

/** Master's chats — one list: clients (opened by «Могу помочь») and sellers he asked for parts for a client's car. */
export default function MasterChatsScreen() {
	return <ChatList as="MASTER" also="BUYER" />
}
