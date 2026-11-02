import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useConfirmLeave } from '@/lib/use-confirm-leave'
import { Image } from '@/components/ui/image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Button, QueryErrorBanner, ScreenHeader, Segmented, Skeleton, toast, Toggle } from '@/components/ui'
import { MediaViewer } from '@/components/media-viewer'
import { PlayIcon } from '@/components/voice'
import { BrandLogo } from '@/components/ui/brand'
import { CameraIcon, CloseIcon, PlusIcon } from '@/components/icons'
import { fixed, fontFamily, fs, raw, useColors } from '@/theme'
import { ApiError, resolveUrl } from '@/lib/api'
import { formatNumber } from '@/lib/format'
import { useCategories } from '@/api/directory'
import { useMyPart, usePublishPart, useSavePart } from '@/api/parts'
import type { MediaItem, PartCondition } from '@/api/types'
import { MAX_PART_PHOTOS, type PartDraft, partBody, usePartDraft } from '@/store/usePartDraft'
import { t } from '@/i18n'

const CONDITIONS: { value: PartCondition; label: string }[] = [
	{ value: 'NEW', label: t('Новое') },
	{ value: 'USED', label: t('Б/У') },
	{ value: 'ON_ORDER', label: t('Под заказ') },
]

/** `missing[]` of PART_INCOMPLETE → words for the hint. */
const MISSING: Record<string, string> = {
	title: t('название'),
	categoryId: t('категорию'),
	condition: t('состояние'),
	price: t('цену'),
	mediaIds: t('фото'),
	fitments: t('машины'),
}

/** What the seller typed or picked — to tell an untouched form from one with unsaved input. */
const fingerprint = (d: Pick<PartDraft, 'title' | 'categoryId' | 'condition' | 'price' | 'quantity' | 'oemNumber' | 'fitments' | 'photos'>) =>
	JSON.stringify([
		d.title.trim(),
		d.categoryId,
		d.condition,
		d.price,
		d.quantity,
		d.oemNumber,
		d.fitments.map((f) => [f.brandId, f.modelId, f.yearFrom, f.yearTo]),
		d.photos.map((p) => p.key),
	])
const EMPTY = fingerprint({ title: '', categoryId: undefined, condition: 'NEW', price: '', quantity: 1, oemNumber: undefined, fitments: [], photos: [] })

/** 26 «Новая запчасть» — create (after 24 / 25) or edit (`id`). Draft → publish. */
export default function NewPartScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const id = Number(useLocalSearchParams<{ id?: string }>().id) || undefined
	const draft = usePartDraft()
	const existing = useMyPart(id)
	const categories = useCategories()
	const save = useSavePart()
	const publish = usePublishPart()
	const [pickCategory, setPickCategory] = useState(false)

	// Editing: fill the draft from the server once.
	useEffect(() => {
		if (existing.data && usePartDraft.getState().id !== existing.data.id) usePartDraft.getState().load(existing.data)
	}, [existing.data])

	// A PART_INCOMPLETE hint is stale once photos or cars are added.
	const { reset: resetSave } = save
	const { reset: resetPublish } = publish
	useEffect(() => {
		resetSave()
		resetPublish()
	}, [draft.photos.length, draft.fitments.length, draft.title, draft.categoryId, draft.price, resetSave, resetPublish])

	const published = existing.data?.status === 'ACTIVE'
	// Editing: until the saved part is in the draft the form would show (and could save) an empty one.
	const loading = Boolean(id) && draft.id !== id && !existing.error
	const uploading = draft.photos.some((p) => p.status === 'uploading')
	const category = categories.data?.find((cat) => cat.id === draft.categoryId)
	const error = save.error ?? publish.error
	const missing = error instanceof ApiError && Array.isArray(error.extra.missing) ? (error.extra.missing as string[]) : null
	const errorText = missing
		? t('Заполните: {0}', missing.map((m) => MISSING[m] ?? m).join(', '))
		: error?.message

	// Unsaved input: a new part — anything entered (camera photos too); an edited one — any change since it loaded.
	const [baseline, setBaseline] = useState<string | null>(id ? null : EMPTY)
	// The edited part just landed in the draft — that's the «unchanged» state (set during render, not in an effect).
	if (!loading && baseline === null) setBaseline(fingerprint(draft))
	const dirty = baseline !== null && fingerprint(draft) !== baseline

	const saveDraft = async () => {
		const state = usePartDraft.getState()
		const part = await save.mutateAsync({ id: state.id, body: partBody(state) })
		// A retry after a failed publish must PATCH this draft, not create another one.
		usePartDraft.setState({ id: part.id })
		return part
	}

	const leave = useConfirmLeave(dirty, published ? undefined : () => saveDraft().then(() => toast(t('Черновик сохранён'))))

	const onDraft = async () => {
		try {
			await saveDraft()
			toast(t('Черновик сохранён'))
			leave(() => router.back())
		} catch {}
	}

	const onPublish = async () => {
		try {
			const part = await saveDraft()
			if (part.status !== 'ACTIVE') await publish.mutateAsync(part.id)
			toast(part.status === 'ACTIVE' ? t('Изменения сохранены') : t('Опубликовано'))
			leave(() => router.back())
		} catch {}
	}

	const [main, second, third] = draft.photos
	// a part filmed for the feed: its video plays here, not only its poster
	const video = existing.data?.video ?? null
	const [watch, setWatch] = useState<MediaItem[] | null>(null)
	const photoTile = (photo: typeof main | undefined, isMain: boolean) =>
		photo ? (
			<Pressable
				key={photo.key}
				onPress={() => (photo.status === 'error' ? draft.retryPhoto(photo.key) : isMain ? undefined : draft.makeMain(photo.key))}
				onLongPress={() => draft.removePhoto(photo.key)}
				style={{
					width: 80,
					height: 80,
					borderRadius: 12,
					overflow: 'hidden',
					borderWidth: photo.status === 'error' ? 2 : 0,
					borderColor: c.danger,
				}}
			>
				<Image source={{ uri: photo.uri }} style={{ flex: 1, opacity: photo.status === 'done' ? 1 : 0.5 }} />
				{photo.status === 'uploading' ? (
					<View
						style={{
							position: 'absolute',
							left: 0,
							bottom: 0,
							height: 3,
							width: `${Math.round(photo.progress * 100)}%`,
							backgroundColor: c.brand,
						}}
					/>
				) : null}
				<Pressable
					onPress={() => draft.removePhoto(photo.key)}
					hitSlop={8}
					accessibilityRole="button"
					accessibilityLabel={t('Удалить фото')}
					style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(32,31,29,0.72)', alignItems: 'center', justifyContent: 'center' }}
				>
					<CloseIcon size={12} color={fixed.white} strokeWidth={2.6} />
				</Pressable>
				{isMain ? (
					<View
						style={{
							position: 'absolute',
							left: 6,
							bottom: 6,
							height: 20,
							paddingHorizontal: 6,
							borderRadius: 6,
							backgroundColor: 'rgba(32,31,29,0.72)',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Text style={{ fontSize: fs.xxs, fontFamily: fontFamily(700), color: fixed.white }}>{t('Главное')}</Text>
					</View>
				) : null}
			</Pressable>
		) : null

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			<ScreenHeader inset title={id ? t('Запчасть') : t('Новая запчасть')} />

			<MediaViewer items={watch} onClose={() => setWatch(null)} />
			{loading ? (
				<PartFormSkeleton />
			) : (
			<ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 14, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
				<QueryErrorBanner error={existing.error ?? categories.error} onRetry={() => existing.refetch()} />

				<View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
					{video ? (
						<Pressable
							onPress={() => setWatch([{ id: video.id, kind: 'VIDEO', url: video.url, thumbUrl: video.posterUrl, width: null, height: null, durationSec: video.durationSec }])}
							style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', backgroundColor: fixed.media }}
						>
							{video.posterUrl ? <Image source={{ uri: resolveUrl(video.posterUrl) }} style={{ width: '100%', height: '100%' }} /> : null}
							<View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }}>
								<View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', paddingLeft: 3 }}>
									<PlayIcon size={14} />
								</View>
							</View>
						</Pressable>
					) : null}
					{photoTile(main, true)}
					{photoTile(second, false)}
					{photoTile(third, false)}
					{draft.photos.length < MAX_PART_PHOTOS ? (
						<Pressable
							onPress={() => router.push({ pathname: '/camera', params: { from: 'form' } })}
							style={{
								width: 84,
								height: 84,
								borderRadius: 12,
								backgroundColor: c.card,
								borderWidth: 2,
								borderStyle: 'dashed',
								borderColor: raw.mapRowBorder,
								alignItems: 'center',
								justifyContent: 'center',
								gap: 4,
							}}
						>
							<CameraIcon size={24} color={c.brandStrong} />
							<Text style={{ fontSize: fs.xs, fontFamily: fontFamily(700), color: c.brandStrong }}>
								{draft.photos.length ? t('Ещё фото') : t('Фото')}
							</Text>
						</Pressable>
					) : null}
				</View>
				{draft.photos.length > 3 ? (
					<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(500), color: c.muted }}>
						{t('Ещё {0} фото · всего {1} из {2}', draft.photos.length - 3, draft.photos.length, MAX_PART_PHOTOS)}
					</Text>
				) : null}

				<View style={{ gap: 6 }}>
					<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(600), color: c.muted }}>{t('Название')}</Text>
					<View
						style={{
							height: 52,
							borderRadius: 12,
							borderWidth: 2,
							borderColor: c.border,
							backgroundColor: c.card,
							paddingHorizontal: 14,
							justifyContent: 'center',
						}}
					>
						<TextInput
							value={draft.title}
							onChangeText={(title) => draft.set({ title })}
							maxLength={120}
							placeholder={t('Например: Стойка передняя KYB, левая')}
							placeholderTextColor={c.fillInk}
							style={{ fontSize: fs.lg, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
						/>
					</View>
					{draft.oemNumber ? (
						<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(500), color: c.muted }}>{t('Номер детали: {0}', draft.oemNumber)}</Text>
					) : null}
				</View>

				<View style={{ gap: 8 }}>
					<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(600), color: c.muted }}>{t('Подходит к машинам')}</Text>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{draft.fitments.map((fitment, index) => (
							<View
								key={`${fitment.label}-${index}`}
								style={{
									height: 44,
									borderRadius: 20,
									backgroundColor: c.brandTint,
									borderWidth: 2,
									borderColor: c.brand,
									paddingLeft: fitment.brand ? 6 : 14,
									paddingRight: 8,
									flexDirection: 'row',
									alignItems: 'center',
									gap: 8,
								}}
							>
								{fitment.brand ? <BrandLogo brand={fitment.brand} size={28} /> : null}
								<Text style={{ fontSize: fs.md, fontFamily: fontFamily(700), color: c.brandStrong }}>{fitment.label}</Text>
								<Pressable accessibilityRole="button" accessibilityLabel={t('Убрать машину')}
									onPress={() => draft.removeFitment(index)}
									style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}
								>
									<CloseIcon size={14} color={c.brandStrong} strokeWidth={2.4} />
								</Pressable>
							</View>
						))}
						<Pressable
							onPress={() => router.push('/fitment-add')}
							style={{
								height: 44,
								borderRadius: 20,
								borderWidth: 2,
								borderStyle: 'dashed',
								borderColor: raw.mapRowBorder,
								paddingHorizontal: 14,
								flexDirection: 'row',
								alignItems: 'center',
								gap: 6,
							}}
						>
							<PlusIcon size={16} color={c.brandStrong} />
							<Text style={{ fontSize: fs.md, fontFamily: fontFamily(700), color: c.brandStrong }}>{t('Машина')}</Text>
						</Pressable>
					</View>
				</View>

				<View style={{ gap: 6 }}>
					<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(600), color: c.muted }}>{t('Категория')}</Text>
					<Pressable
						onPress={() => setPickCategory((v) => !v)}
						style={{
							height: 52,
							borderRadius: 12,
							borderWidth: 2,
							borderColor: pickCategory ? c.brand : c.border,
							backgroundColor: c.card,
							paddingHorizontal: 14,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						<Text style={{ fontSize: fs.lg, fontFamily: fontFamily(400), color: category ? c.ink : c.fillInk }}>
							{category?.name ?? t('Выберите категорию')}
						</Text>
						<Text style={{ fontSize: fs.lg, color: c.muted }}>{pickCategory ? '⌃' : '›'}</Text>
					</Pressable>
					{pickCategory ? (
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
							{(categories.data ?? []).map((cat) => {
								const active = cat.id === draft.categoryId
								return (
									<Pressable
										key={cat.id}
										onPress={() => {
											draft.set({ categoryId: cat.id })
											setPickCategory(false)
										}}
										style={{
											height: 40,
											paddingHorizontal: 14,
											borderRadius: 20,
											borderWidth: 2,
											borderColor: active ? c.brand : c.border,
											backgroundColor: active ? c.brandTint : c.card,
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Text style={{ fontSize: fs.md, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.inkSecondary }}>
											{cat.name}
										</Text>
									</Pressable>
								)
							})}
						</View>
					) : null}
				</View>

				<View style={{ gap: 6 }}>
					<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(600), color: c.muted }}>{t('Состояние')}</Text>
					<Segmented
						items={CONDITIONS.map((item) => item.label)}
						value={CONDITIONS.findIndex((item) => item.value === draft.condition)}
						onChange={(i) => draft.set({ condition: CONDITIONS[i].value })}
						height={44}
						itemHeight={34}
						borderColor={c.border}
					/>
				</View>

				<View style={{ flexDirection: 'row', gap: 16 }}>
					<View style={{ flex: 1, gap: 6 }}>
						<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(600), color: c.muted }}>{t('Цена')}</Text>
						<View
							style={{
								height: 52,
								borderRadius: 12,
								borderWidth: 2,
								borderColor: c.border,
								backgroundColor: c.card,
								paddingHorizontal: 14,
								flexDirection: 'row',
								alignItems: 'center',
								gap: 8,
							}}
						>
							<TextInput
								value={draft.price ? formatNumber(Number(draft.price.replace(/\D/g, ''))) : ''}
								onChangeText={(text) => draft.set({ price: text.replace(/\D/g, '').slice(0, 9) })}
								keyboardType="numeric"
								placeholder="0"
								placeholderTextColor={c.fillInk}
								style={{ flex: 1, minWidth: 0, fontSize: fs.lg, fontFamily: fontFamily(700), color: c.ink, padding: 0 }}
							/>
							<Text style={{ fontSize: fs.lg, fontFamily: fontFamily(400), color: c.muted }}>{t('сом')}</Text>
						</View>
					</View>
				</View>

				{/* No count of pieces — just whether it's there; out of stock = quantity 0. */}
				<View
					style={{
						height: 56,
						borderRadius: 12,
						backgroundColor: c.card,
						paddingHorizontal: 14,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<Text style={{ fontSize: fs.lg, fontFamily: fontFamily(600), color: c.ink }}>{t('Есть в наличии')}</Text>
					<Toggle value={draft.quantity > 0} onChange={(on) => draft.set({ quantity: on ? 1 : 0 })} />
				</View>
			</ScrollView>
			)}

			<View
				style={{
					paddingHorizontal: 16,
					paddingTop: 12,
					paddingBottom: insets.bottom + 12,
					borderTopWidth: 1,
					borderTopColor: c.hairline,
					backgroundColor: c.card,
					gap: 10,
				}}
			>
				{errorText ? (
					<Text style={{ fontSize: fs.md, fontFamily: fontFamily(500), color: c.danger }}>{errorText}</Text>
				) : null}
				<View style={{ flexDirection: 'row', gap: 8 }}>
					{/* Both actions in one place, under the thumb — not «Черновик» as grey text in the top corner. */}
					{!published && !loading ? (
						<Button
							label={t('Черновик')}
							variant="outline"
							height={56}
							style={{ flex: 1 }}
							disabled={save.isPending || publish.isPending || uploading}
							onPress={onDraft}
						/>
					) : null}
					<Pressable
						disabled={loading || save.isPending || publish.isPending || uploading}
						onPress={onPublish}
						style={{
							flex: 1.6,
							height: 56,
							borderRadius: 14,
							backgroundColor: c.brand,
							alignItems: 'center',
							justifyContent: 'center',
							opacity: loading || save.isPending || publish.isPending || uploading ? 0.4 : 1,
						}}
					>
						<Text style={{ fontSize: fs.xl, fontFamily: fontFamily(700), color: fixed.white }}>
							{uploading ? t('Загружаем фото…') : published ? t('Сохранить') : t('Опубликовать')}
						</Text>
					</Pressable>
				</View>
			</View>
		</View>
	)
}

/** Форма поста, пока он грузится: фото, название, машины, категория, цена, наличие. */
function PartFormSkeleton() {
	const label = (width: number) => <Skeleton width={width} height={13} />
	return (
		<View style={{ flex: 1, padding: 16, paddingTop: 8, gap: 14 }}>
			<View style={{ flexDirection: 'row', gap: 8 }}>
				{[0, 1, 2].map((i) => (
					<Skeleton key={i} width={80} height={80} radius={12} />
				))}
			</View>
			<View style={{ gap: 6 }}>
				{label(80)}
				<Skeleton height={52} radius={12} />
			</View>
			<View style={{ gap: 8 }}>
				{label(150)}
				<View style={{ flexDirection: 'row', gap: 8 }}>
					<Skeleton width={130} height={44} radius={20} />
					<Skeleton width={100} height={44} radius={20} />
				</View>
			</View>
			<View style={{ gap: 6 }}>
				{label(90)}
				<Skeleton height={52} radius={12} />
			</View>
			<View style={{ gap: 6 }}>
				{label(50)}
				<Skeleton height={52} radius={12} />
			</View>
			<Skeleton height={56} radius={12} />
		</View>
	)
}
