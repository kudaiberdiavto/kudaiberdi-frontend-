import { Pressable, Text, View } from 'react-native'
import { fontFamily, raw, useColors } from '@/theme'
import type { ContainerSlot } from '@/api/types'

const COLUMNS = 7
const GAP = 6

/**
 * Container numbers of one row side [31]: selected (brand) / has a seller (white, tappable) /
 * not in the app (grey, disabled). `width` — the grid's width, to fit exactly 7 per line.
 */
export function ContainerGrid({
	slots,
	selectedIds,
	onToggle,
	width,
}: {
	slots: ContainerSlot[]
	selectedIds: Set<number>
	onToggle: (slot: ContainerSlot) => void
	width: number
}) {
	const c = useColors()
	const cell = (width - GAP * (COLUMNS - 1)) / COLUMNS
	return (
		<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
			{slots.map((slot) => {
				const selected = selectedIds.has(slot.id)
				const empty = slot.state === 'NO_SELLER'
				return (
					<Pressable
						key={slot.id}
						disabled={empty}
						onPress={() => onToggle(slot)}
						style={{
							width: cell,
							height: 36,
							borderRadius: 8,
							borderWidth: 1.5,
							borderColor: selected ? c.brand : empty ? raw.fill : c.border,
							backgroundColor: selected ? c.brand : empty ? raw.fill : c.card,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(selected ? 700 : 600), color: selected ? '#FFFFFF' : empty ? '#B8B4B4' : c.ink }}>
							{slot.number}
						</Text>
					</Pressable>
				)
			})}
		</View>
	)
}
