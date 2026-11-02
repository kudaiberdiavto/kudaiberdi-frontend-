import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native'
import { router } from 'expo-router'
import { onNearEnd } from '@/lib/scroll'
import { PaperPlaneIcon } from '@/components/buyer-v23'
import { ModalSheet } from '@/components/master-v23'
import { ComplaintSheet, type ComplaintTarget } from '@/components/complaint-sheet'
import { Skeleton, SkeletonRepeat, MoreButton } from '@/components/ui'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { formatAgo } from '@/lib/format'
import { flattenPages } from '@/api/pagination'
import { useAddPartComment, useDeletePartComment, usePartComments, useSignedIn } from '@/api/catalog'
import type { PartComment } from '@/api/types'
import { t } from '@/i18n'

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
		Alert.alert(t('Комментарий'), comment.text, [
			...(comment.canDelete
				? [{ text: t('Удалить'), style: 'destructive' as const, onPress: () => remove.mutate(comment.id) }]
				: []),
			...(!comment.mine && signedIn ? [{ text: t('Пожаловаться'), onPress: () => setComplaint({ type: 'PART_COMMENT', targetId: comment.id }) }] : []),
			{ text: t('Отмена'), style: 'cancel' as const },
		])

	return (
		<ModalSheet onClose={onClose}>
			<Text numberOfLines={1} style={{ fontSize: fs.xxl, fontFamily: fontFamily(800), color: c.ink }}>
				{t('Комментарии')}{total ? ` · ${total}` : ''}
			</Text>

			<ScrollView
				style={{ maxHeight: height * 0.45 }}
				contentContainerStyle={{ gap: 14, paddingVertical: 4 }}
				keyboardShouldPersistTaps="handled"
				scrollEventThrottle={200}
				onScroll={onNearEnd(() => comments.hasNextPage && !comments.isFetchingNextPage && comments.fetchNextPage(), 200)}
			>
				{comments.isLoading ? (
					<SkeletonRepeat count={4} gap={14}>
						<View style={{ gap: 7 }}>
							<Skeleton width={130} height={15} />
							<Skeleton width="85%" height={15} />
						</View>
					</SkeletonRepeat>
				) : null}
				{items.map((comment) => (
					<Pressable key={comment.id} onLongPress={() => actions(comment)} delayLongPress={400} style={{ gap: 3 }}>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
							<Text style={{ fontSize: fs.md, fontFamily: fontFamily(700), color: c.ink }}>{comment.mine ? t('Вы') : (comment.authorName ?? t('Покупатель'))}</Text>
							{comment.fromSeller ? (
								<View style={{ height: 20, paddingHorizontal: 6, borderRadius: 6, backgroundColor: c.brandTint, justifyContent: 'center' }}>
									<Text style={{ fontSize: fs.xs, fontFamily: fontFamily(700), color: c.brandStrong }}>{t('Продавец')}</Text>
								</View>
							) : null}
							<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(400), color: c.muted }}>{formatAgo(comment.createdAt, { short: true })}</Text>
							{comment.canDelete || (!comment.mine && signedIn) ? (
								<>
									<View style={{ flex: 1 }} />
									<MoreButton onPress={() => actions(comment)} />
								</>
							) : null}
						</View>
						<Text style={{ fontSize: fs.base, lineHeight: 22, fontFamily: fontFamily(400), color: c.ink }}>{comment.text}</Text>
					</Pressable>
				))}
				{comments.isFetchingNextPage ? <Skeleton width="70%" height={15} /> : null}
			</ScrollView>

			{add.error ? <Text style={{ fontSize: fs.md, fontFamily: fontFamily(500), color: c.danger }}>{add.error.message}</Text> : null}
			<View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
				<TextInput
					value={text}
					onChangeText={setText}
					placeholder={signedIn ? t('Написать комментарий') : t('Войдите, чтобы написать')}
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
						fontSize: fs.lg,
						fontFamily: fontFamily(400),
						color: c.ink,
					}}
				/>
				<Pressable accessibilityRole="button" accessibilityLabel={t('Отправить')}
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
					<PaperPlaneIcon size={24} color={fixed.white} />
				</Pressable>
			</View>
			<ComplaintSheet target={complaint} onClose={() => setComplaint(null)} />
		</ModalSheet>
	)
}
