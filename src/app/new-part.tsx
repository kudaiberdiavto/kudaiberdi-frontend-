import { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { QueryErrorBanner, Segmented, Stepper } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { CameraIcon, ChevronLeftIcon, CloseIcon, PlusIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { ApiError } from '@/lib/api'
import { formatNumber } from '@/lib/format'
import { useCategories } from '@/api/directory'
import { useMyPart, usePublishPart, useSavePart } from '@/api/parts'
import type { PartCondition } from '@/api/types'
import { MAX_PART_PHOTOS, partBody, usePartDraft } from '@/store/usePartDraft'

const CONDITIONS: { value: PartCondition; label: string }[] = [
	{ value: 'NEW', label: 'Новое' },
	{ value: 'USED', label: 'Б/У' },
	{ value: 'ON_ORDER', label: 'Под заказ' },
]

/** `missing[]` of PART_INCOMPLETE → words for the hint. */
const MISSING: Record<string, string> = {
	title: 'название',
	categoryId: 'категорию',
	condition: 'состояние',
	price: 'цену',
	mediaIds: 'фото',
	fitments: 'машины',
}

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
	const uploading = draft.photos.some((p) => p.status === 'uploading')
	const category = categories.data?.find((cat) => cat.id === draft.categoryId)
	const error = save.error ?? publish.error
	const missing = error instanceof ApiError && Array.isArray(error.extra.missing) ? (error.extra.missing as string[]) : null
	const errorText = missing
		? `Заполните: ${missing.map((m) => MISSING[m] ?? m).join(', ')}`
		: error?.message

	const saveDraft = async () => {
		const state = usePartDraft.getState()
		const part = await save.mutateAsync({ id: state.id, body: partBody(state) })
		// A retry after a failed publish must PATCH this draft, not create another one.
		usePartDraft.setState({ id: part.id })
		return part
	}

	const onDraft = async () => {
		try {
			await saveDraft()
			router.back()
		} catch {}
	}

	const onPublish = async () => {
		try {
			const part = await saveDraft()
			if (part.status !== 'ACTIVE') await publish.mutateAsync(part.id)
			router.back()
		} catch {}
	}

	const [main, second, third] = draft.photos
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
						<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Главное</Text>
					</View>
				) : null}
			</Pressable>
		) : null

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			<View
				style={{
					paddingTop: insets.top + 12,
					paddingHorizontal: 16,
					paddingBottom: 8,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 10,
				}}
			>
				<Pressable onPress={() => router.back()}>
					<ChevronLeftIcon size={24} color={c.ink} />
				</Pressable>
				<Text style={{ flex: 1, fontSize: 20, fontFamily: fontFamily(700), letterSpacing: -0.2, color: c.ink }}>
					{id ? 'Запчасть' : 'Новая запчасть'}
				</Text>
				{!published ? (
					<Pressable disabled={save.isPending || uploading} onPress={onDraft}>
						<Text style={{ fontSize: 16.5, fontFamily: fontFamily(600), color: c.muted }}>Черновик</Text>
					</Pressable>
				) : null}
			</View>

			<ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 14, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
				<QueryErrorBanner error={existing.error ?? categories.error} onRetry={() => existing.refetch()} />

				<View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
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
							<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.brandStrong }}>
								{draft.photos.length ? 'Ещё фото' : 'Фото'}
							</Text>
						</Pressable>
					) : null}
				</View>
				{draft.photos.length > 3 ? (
					<Text style={{ fontSize: 14.5, fontFamily: fontFamily(500), color: c.muted }}>
						Ещё {draft.photos.length - 3} фото · всего {draft.photos.length} из {MAX_PART_PHOTOS}
					</Text>
				) : null}

				<View style={{ gap: 6 }}>
					<Text style={{ fontSize: 14.5, fontFamily: fontFamily(600), color: c.muted }}>Название</Text>
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
							placeholder="Например: Стойка передняя KYB, левая"
							placeholderTextColor={raw.fillInk}
							style={{ fontSize: 17.5, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
						/>
					</View>
					{draft.oemNumber ? (
						<Text style={{ fontSize: 14.5, fontFamily: fontFamily(500), color: c.muted }}>Номер детали: {draft.oemNumber}</Text>
					) : null}
				</View>

				<View style={{ gap: 8 }}>
					<Text style={{ fontSize: 14.5, fontFamily: fontFamily(600), color: c.muted }}>Подходит к машинам</Text>
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
								<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong }}>{fitment.label}</Text>
								<Pressable
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
							<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong }}>Машина</Text>
						</Pressable>
					</View>
				</View>

				<View style={{ gap: 6 }}>
					<Text style={{ fontSize: 14.5, fontFamily: fontFamily(600), color: c.muted }}>Категория</Text>
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
						<Text style={{ fontSize: 17.5, fontFamily: fontFamily(400), color: category ? c.ink : raw.fillInk }}>
							{category?.name ?? 'Выберите категорию'}
						</Text>
						<Text style={{ fontSize: 17.5, color: c.muted }}>{pickCategory ? '⌃' : '›'}</Text>
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
										<Text style={{ fontSize: 15.5, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.inkSecondary }}>
											{cat.name}
										</Text>
									</Pressable>
								)
							})}
						</View>
					) : null}
				</View>

				<View style={{ gap: 6 }}>
					<Text style={{ fontSize: 14.5, fontFamily: fontFamily(600), color: c.muted }}>Состояние</Text>
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
					<View style={{ flex: 1.4, gap: 6 }}>
						<Text style={{ fontSize: 14.5, fontFamily: fontFamily(600), color: c.muted }}>Цена</Text>
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
								placeholderTextColor={raw.fillInk}
								style={{ flex: 1, minWidth: 0, fontSize: 17.5, fontFamily: fontFamily(700), color: c.ink, padding: 0 }}
							/>
							<Text style={{ fontSize: 17.5, fontFamily: fontFamily(400), color: c.muted }}>сом</Text>
						</View>
					</View>
					<View style={{ flex: 1, gap: 6 }}>
						<Text style={{ fontSize: 14.5, fontFamily: fontFamily(600), color: c.muted }}>Сколько штук</Text>
						<View
							style={{
								height: 52,
								borderRadius: 12,
								borderWidth: 2,
								borderColor: c.border,
								backgroundColor: c.card,
								paddingHorizontal: 6,
								justifyContent: 'center',
							}}
						>
							<Stepper value={draft.quantity} onChange={(quantity) => draft.set({ quantity })} min={0} max={999} />
						</View>
					</View>
				</View>
			</ScrollView>

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
					<Text style={{ fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>{errorText}</Text>
				) : null}
				<Pressable
					disabled={save.isPending || publish.isPending || uploading}
					onPress={onPublish}
					style={{
						height: 56,
						borderRadius: 14,
						backgroundColor: c.brand,
						alignItems: 'center',
						justifyContent: 'center',
						opacity: save.isPending || publish.isPending || uploading ? 0.4 : 1,
					}}
				>
					<Text style={{ fontSize: 18.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>
						{uploading ? 'Загружаем фото…' : published ? 'Сохранить' : 'Опубликовать'}
					</Text>
				</Pressable>
			</View>
		</View>
	)
}
