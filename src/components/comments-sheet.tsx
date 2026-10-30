import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native'
import { router } from 'expo-router'
import { PaperPlaneIcon } from '@/components/buyer-v23'
import { ModalSheet } from '@/components/master-v23'
import { ComplaintSheet, type ComplaintTarget } from '@/components/complaint-sheet'
import { fontFamily, useColors } from '@/theme'
import { formatAgo } from '@/lib/format'
import { flattenPages } from '@/api/pagination'
import { useAddPartComment, useDeletePartComment, usePartComments, useSignedIn } from '@/api/catalog'
import type { PartComment } from '@/api/types'

/**
 * Comments under a video part (the reels-like feed): newest first, «Продавец» on the box's own answers, a field to
 * write. Long press — delete (own, or any under your part) or complain.
 */
export function CommentsSheet({ partId, onClose }: { partId: number; onClose: () => void }) {
	const c = useColors()
	const { height } = useWindowDimensions()
	const signedIn = useSignedIn()
	const comments = usePartComments(partId)
	const add = useAddPartComment(partId)
	const remove = useDeletePartComment(partId)
	const [text, setText] = useState('')
	const [complaint, setComplaint] = useState<ComplaintTarget | null>(null)
	const items = flattenPages(comments.data)
	const total = comments.data?.pages[0]?.total ?? 0
	const value = text.trim()

	const send = () => {
		if (!signedIn) {
			onClose()
			router.push('/')
			return
		}
		if (!value || add.isPending) return
		add.mutate(value, { onSuccess: () => setText('') })
	}

	const actions = (comment: PartComment) =>
		Alert.alert('Комментарий', comment.text, [
			...(comment.canDelete
				? [{ text: 'Удалить', style: 'destructive' as const, onPress: () => remove.mutate(comment.id) }]
				: []),
			...(!comment.mine && signedIn ? [{ text: 'Пожаловаться', onPress: () => setComplaint({ type: 'PART_COMMENT', targetId: comment.id }) }] : []),
			{ text: 'Отмена', style: 'cancel' as const },
		])

	return (
		<ModalSheet onClose={onClose}>
			<Text numberOfLines={1} style={{ fontSize: 20, fontFamily: fontFamily(800), color: c.ink }}>
				Комментарии{total ? ` · ${total}` : ''}
			</Text>

			<ScrollView style={{ maxHeight: height * 0.45 }} contentContainerStyle={{ gap: 14, paddingVertical: 4 }} keyboardShouldPersistTaps="handled">
				{comments.isPending ? <ActivityIndicator color={c.muted} /> : null}
				{items.map((comment) => (
					<Pressable key={comment.id} onLongPress={() => actions(comment)} delayLongPress={400} style={{ gap: 3 }}>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
							<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.ink }}>{comment.mine ? 'Вы' : (comment.authorName ?? 'Покупатель')}</Text>
							{comment.fromSeller ? (
								<View style={{ height: 20, paddingHorizontal: 6, borderRadius: 6, backgroundColor: c.brandTint, justifyContent: 'center' }}>
									<Text style={{ fontSize: 12.5, fontFamily: fontFamily(700), color: c.brandStrong }}>Продавец</Text>
								</View>
							) : null}
							<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>{formatAgo(comment.createdAt, { short: true })}</Text>
						</View>
						<Text style={{ fontSize: 16.5, lineHeight: 22, fontFamily: fontFamily(400), color: c.ink }}>{comment.text}</Text>
					</Pressable>
				))}
				{comments.hasNextPage ? (
					<Text onPress={() => comments.fetchNextPage()} style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong, textAlign: 'center' }}>
						Показать ещё
					</Text>
				) : null}
			</ScrollView>

			{add.error ? <Text style={{ fontSize: 15, fontFamily: fontFamily(500), color: c.danger }}>{add.error.message}</Text> : null}
			<View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
				<TextInput
					value={text}
					onChangeText={setText}
					placeholder={signedIn ? 'Написать комментарий' : 'Войдите, чтобы написать'}
					placeholderTextColor={c.muted}
					maxLength={500}
					editable={signedIn}
					onSubmitEditing={send}
					returnKeyType="send"
					style={{
						flex: 1,
						minHeight: 56,
						maxHeight: 120,
						borderRadius: 18,
						backgroundColor: c.surface,
						paddingHorizontal: 18,
						paddingTop: 16,
						paddingBottom: 16,
						fontSize: 17.5,
						fontFamily: fontFamily(400),
						color: c.ink,
					}}
				/>
				<Pressable
					onPress={send}
					disabled={signedIn && (!value || add.isPending)}
					hitSlop={6}
					style={{
						width: 56,
						height: 56,
						borderRadius: 28,
						backgroundColor: c.success,
						alignItems: 'center',
						justifyContent: 'center',
						opacity: !signedIn || value ? 1 : 0.5,
					}}
				>
					<PaperPlaneIcon size={24} color="#FFFFFF" />
				</Pressable>
			</View>
			<ComplaintSheet target={complaint} onClose={() => setComplaint(null)} />
		</ModalSheet>
	)
}
