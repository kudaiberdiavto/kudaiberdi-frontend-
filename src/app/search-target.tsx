import { useState } from 'react'
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Button, ContainerGrid, QueryErrorBanner, Segmented } from '@/components/ui'
import { MarketSchemeView } from '@/components/market-scheme-view'
import { ChevronLeftIcon, CloseIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { formatSide, plural } from '@/lib/format'
import { useCars } from '@/api/garage'
import { useRowContainers, useRows } from '@/api/market'
import type { Brand, RequestTarget } from '@/api/types'
import { useRequestDraft } from '@/store/useRequestDraft'

const TARGETS: { value: RequestTarget; label: string }[] = [
	{ value: 'MARKET', label: 'Всему рынку' },
	{ value: 'ROWS', label: 'Рядам' },
	{ value: 'CONTAINERS', label: 'Контейнерам' },
]

/** 31 «Кому отправить» — rows or boxes picked on the market scheme; «Готово» returns to 06б. */
export default function SearchTargetScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const { width } = useWindowDimensions()
	const carId = Number(useLocalSearchParams<{ carId: string }>().carId)
	const brand = useCars().data?.find((car) => car.id === carId)?.brand
	const draft = useRequestDraft()
	const rows = useRows()
	// Rows opened on the scheme in «Контейнерам» mode — plus those that already have picked boxes.
	const [opened, setOpened] = useState<number[]>([])

	const rowById = new Map((rows.data ?? []).map((row) => [row.id, row]))
	const containerRows = [...new Set([...draft.containers.map((box) => box.rowId), ...opened])]
	const selectedOnScheme = draft.target === 'ROWS' ? draft.rows.map((r) => r.id) : draft.target === 'CONTAINERS' ? containerRows : []

	const pressRow = (rowId: number) => {
		const row = rowById.get(rowId)
		if (!row) return
		if (draft.target === 'ROWS') draft.toggleRow({ id: row.id, code: row.code, label: row.label })
		else if (draft.target === 'CONTAINERS') setOpened((list) => (list.includes(rowId) ? list : [rowId, ...list]))
	}

	const boxes = draft.containers.length
	const boxRows = new Set(draft.containers.map((box) => box.rowId)).size
	const summary =
		draft.target === 'ROWS' ? (
			<>
				Выбрано{' '}
				<Text style={{ fontFamily: fontFamily(700), color: c.ink }}>
					{draft.rows.length} {plural(draft.rows.length, ['ряд', 'ряда', 'рядов'])}
				</Text>
			</>
		) : draft.target === 'CONTAINERS' ? (
			<>
				Выбрано{' '}
				<Text style={{ fontFamily: fontFamily(700), color: c.ink }}>
					{boxes} {plural(boxes, ['контейнер', 'контейнера', 'контейнеров'])}
				</Text>{' '}
				в {boxRows} {plural(boxRows, ['ряду', 'рядах', 'рядах'])}
			</>
		) : (
			'Запрос уйдёт всему рынку'
		)

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<View style={{ height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<Pressable onPress={() => router.back()}>
					<ChevronLeftIcon size={24} color={c.ink} />
				</Pressable>
				<Text style={{ flex: 1, fontSize: 20, fontFamily: fontFamily(700), letterSpacing: -0.2, color: c.ink }}>Кому отправить</Text>
			</View>

			<ScrollView contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
				<Segmented
					items={TARGETS.map((t) => t.label)}
					value={TARGETS.findIndex((t) => t.value === draft.target)}
					onChange={(i) => draft.setTarget(TARGETS[i].value)}
					height={44}
					itemHeight={34}
					padding={3}
					gap={0}
					activeWeight={600}
					inactiveColor={c.muted}
					borderColor={c.border}
				/>

				<QueryErrorBanner error={rows.error} onRetry={() => rows.refetch()} />

				<MarketSchemeView
					width={width - 32}
					height={250}
					selectedRowIds={selectedOnScheme}
					onRowPress={draft.target === 'MARKET' ? undefined : pressRow}
					hint={draft.target === 'ROWS' ? 'Тапните ряд' : draft.target === 'CONTAINERS' ? 'Тапните ряд или контейнер' : undefined}
				/>

				{draft.target === 'CONTAINERS' ? (
					<View style={{ flexDirection: 'row', gap: 14 }}>
						{[
							{ label: 'выбран', style: { backgroundColor: c.brand } },
							{ label: 'есть продавец', style: { backgroundColor: c.card, borderWidth: 1.5, borderColor: c.border } },
							{ label: 'нет в приложении', style: { backgroundColor: raw.fill } },
						].map((item) => (
							<View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
								<View style={[{ width: 14, height: 14, borderRadius: 4 }, item.style]} />
								<Text style={{ fontSize: 12, fontFamily: fontFamily(400), color: c.muted }}>{item.label}</Text>
							</View>
						))}
					</View>
				) : null}

				{draft.target === 'CONTAINERS'
					? containerRows.map((rowId) => (
							<RowCards key={rowId} rowId={rowId} brand={brand} gridWidth={width - 32 - 24} />
						))
					: null}

				{draft.target === 'ROWS' && draft.rows.length ? (
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{draft.rows.map((row) => (
							<Pressable
								key={row.id}
								onPress={() => draft.toggleRow(row)}
								style={{
									height: 36,
									paddingLeft: 14,
									paddingRight: 10,
									borderRadius: 18,
									backgroundColor: c.brandTint,
									borderWidth: 2,
									borderColor: c.brand,
									flexDirection: 'row',
									alignItems: 'center',
									gap: 6,
								}}
							>
								<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>{row.label}</Text>
								<CloseIcon size={14} color={c.brandStrong} strokeWidth={2.8} />
							</Pressable>
						))}
					</View>
				) : null}
			</ScrollView>

			<View
				style={{
					paddingTop: 12,
					paddingHorizontal: 16,
					paddingBottom: 28 + insets.bottom,
					backgroundColor: c.card,
					borderTopWidth: 1,
					borderTopColor: c.hairline,
					gap: 10,
				}}
			>
				<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted, textAlign: 'center' }}>{summary}</Text>
				<Button label="Готово" height={56} fontSize={17} onPress={() => router.back()} />
			</View>
		</View>
	)
}

/** One row: a card per side with the container grid and «продают Toyota: 9». */
function RowCards({ rowId, brand, gridWidth }: { rowId: number; brand?: Brand; gridWidth: number }) {
	const c = useColors()
	const row = useRowContainers(rowId, brand?.id)
	const { containers, toggleContainer } = useRequestDraft()
	const data = row.data
	if (!data) return null
	const picked = new Set(containers.map((box) => box.id))
	const sides = data.sides.filter((side) => side.containers.length)

	return (
		<>
			{sides.map((side, i) => (
				<View key={side.side} style={{ borderRadius: 16, backgroundColor: c.card, padding: 12, gap: 10 }}>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
						<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>
							{sides.length > 1 ? `${data.label} · ${formatSide(side.side)}` : data.label}
						</Text>
						{/* A per-row figure — only on the row's first card. */}
						{i === 0 && brand && data.brandSellers !== null ? (
							<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
								продают {brand.shortName}: {data.brandSellers}
							</Text>
						) : null}
					</View>
					<ContainerGrid
						slots={side.containers}
						selectedIds={picked}
						width={gridWidth}
						onToggle={(slot) =>
							toggleContainer({ id: slot.id, rowId, rowCode: data.code, rowLabel: data.label, number: slot.number })
						}
					/>
				</View>
			))}
		</>
	)
}
