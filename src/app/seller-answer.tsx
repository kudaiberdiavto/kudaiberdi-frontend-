import { useEffect, useState } from 'react'
import { Image, Pressable, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Button, QueryErrorBanner, Segmented } from '@/components/ui'
import { CameraIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { useIncomingRequest, useMarkSeen, useReplyToRequest } from '@/api/incoming'
import { usePhotoUploads } from '@/api/media'
import type { PartCondition } from '@/api/types'

const CONDITIONS: { value: PartCondition; label: string }[] = [
	{ value: 'NEW', label: 'Новое' },
	{ value: 'USED', label: 'Б/У' },
	{ value: 'ON_ORDER', label: 'Под заказ' },
]

export default function SellerAnswerScreen() {
	const c = useColors()
	const id = Number(useLocalSearchParams<{ id: string }>().id)
	const request = useIncomingRequest(id)
	const markSeen = useMarkSeen()
	const reply = useReplyToRequest(id)
	const uploads = usePhotoUploads('REPLY', 3)
	const [condition, setCondition] = useState(0)
	const [message, setMessage] = useState('')
	const [price, setPrice] = useState('')

	useEffect(() => {
		markSeen.mutate(id)
		// eslint-disable-next-line react-hooks/exhaustive-deps -- once per opened request
	}, [id])

	const data = request.data
	const subtitle = data ? [data.car.modelLabel, data.car.year, data.buyerName ?? 'Покупатель'].join(' · ') : ''

	const send = () =>
		reply.mutate(
			{
				answer: 'HAVE',
				condition: CONDITIONS[condition].value,
				message: message.trim() || undefined,
				price: price ? Number(price) : undefined,
				mediaIds: uploads.mediaIds,
			},
			// «Есть» opens the chat with the buyer [13].
			{ onSuccess: (r) => router.replace({ pathname: '/seller-chat', params: { chatId: String(r.chatId) } }) }
		)

	return (
		<View style={{ flex: 1, backgroundColor: raw.sheetBackdrop, justifyContent: 'flex-end' }}>
			<Pressable style={{ flex: 1 }} onPress={() => router.back()} />
			<View
				style={{
					backgroundColor: c.card,
					borderTopLeftRadius: 24,
					borderTopRightRadius: 24,
					paddingTop: 12,
					paddingHorizontal: 16,
					paddingBottom: 24,
					gap: 16,
				}}
			>
				<View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: raw.dashed, alignSelf: 'center' }} />

				<QueryErrorBanner error={request.error} onRetry={() => request.refetch()} />

				<View style={{ gap: 4 }}>
					<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink }}>{data?.text ?? ' '}</Text>
					<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>{subtitle || ' '}</Text>
				</View>

				<Segmented
					items={CONDITIONS.map((item) => item.label)}
					value={condition}
					onChange={setCondition}
					background={c.surface}
					borderColor={c.border}
				/>

				<View style={{ gap: 6 }}>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>Сообщение покупателю</Text>
					<TextInput
						value={message}
						onChangeText={setMessage}
						multiline
						maxLength={300}
						placeholder="Например: есть оригинал, подходите посмотреть"
						placeholderTextColor={raw.fillInk}
						style={{
							minHeight: 72,
							borderRadius: 12,
							borderWidth: 2,
							borderColor: c.brand,
							backgroundColor: c.surface,
							paddingVertical: 12,
							paddingHorizontal: 14,
							fontSize: 16,
							lineHeight: 22.4,
							fontFamily: fontFamily(400),
							color: c.ink,
						}}
					/>
				</View>

				<View style={{ flexDirection: 'row', gap: 10 }}>
					<View style={{ flex: 1, gap: 6 }}>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>Цена · по желанию</Text>
						<TextInput
							value={price}
							onChangeText={(text) => setPrice(text.replace(/\D/g, '').slice(0, 9))}
							keyboardType="number-pad"
							placeholder="сом"
							placeholderTextColor={raw.fillInk}
							style={{
								height: 56,
								borderRadius: 12,
								borderWidth: 2,
								borderColor: c.border,
								backgroundColor: c.surface,
								paddingHorizontal: 14,
								fontSize: 16,
								fontFamily: fontFamily(400),
								color: c.ink,
							}}
						/>
					</View>
					{uploads.photos.map((photo) => (
						<View key={photo.key} style={{ width: 52, gap: 6 }}>
							<Text style={{ fontSize: 13 }} />
							<Pressable
								onPress={() => (photo.status === 'error' ? uploads.retry(photo.key) : uploads.remove(photo.key))}
								style={{
									height: 56,
									borderRadius: 12,
									overflow: 'hidden',
									borderWidth: 2,
									borderColor: photo.status === 'error' ? c.danger : c.border,
								}}
							>
								<Image source={{ uri: photo.uri }} style={{ flex: 1, opacity: photo.status === 'done' ? 1 : 0.5 }} />
								{photo.status === 'uploading' ? (
									<View
										style={{
											position: 'absolute',
											left: 0,
											bottom: 0,
											height: 4,
											width: `${Math.round(photo.progress * 100)}%`,
											backgroundColor: c.brand,
										}}
									/>
								) : null}
								{photo.status === 'error' ? (
									<Text
										style={{
											position: 'absolute',
											alignSelf: 'center',
											top: 16,
											fontSize: 18,
											fontFamily: fontFamily(700),
											color: c.danger,
										}}
									>
										↻
									</Text>
								) : null}
							</Pressable>
						</View>
					))}
					{uploads.canAdd ? (
						<View style={{ width: 52, gap: 6 }}>
							<Text style={{ fontSize: 13 }} />
							<Pressable
								onPress={() => uploads.pick('camera')}
								onLongPress={() => uploads.pick('library')}
								style={{
									height: 56,
									borderRadius: 12,
									borderWidth: 2,
									borderStyle: 'dashed',
									borderColor: raw.dashed,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<CameraIcon size={22} color={c.inkSecondary} />
							</Pressable>
						</View>
					) : null}
				</View>

				{reply.error ? (
					<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{reply.error.message}</Text>
				) : null}

				<Button
					label="Отправить «Есть»"
					height={60}
					fontSize={18}
					disabled={!data || uploads.uploading}
					loading={reply.isPending}
					onPress={send}
				/>
			</View>
		</View>
	)
}
