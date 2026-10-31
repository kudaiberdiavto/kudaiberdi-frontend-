import { useState } from 'react'
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CheckIcon, CloseIcon, SearchIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'

export interface SelectOption<K extends string | number> {
	key: K
	label: string
	/** A second line: «2011–2017». */
	sub?: string | null
}

/** A select field like a dropdown: label above, the chosen value (or a placeholder) and ▾; tap — `onPress`. */
export function SelectField({
	label,
	value,
	placeholder,
	disabled,
	onPress,
}: {
	label: string
	value?: string | null
	placeholder: string
	disabled?: boolean
	onPress: () => void
}) {
	const c = useColors()
	return (
		<View style={{ gap: 6, opacity: disabled ? 0.5 : 1 }}>
			<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>{label.toUpperCase()}</Text>
			<Pressable
				onPress={onPress}
				disabled={disabled}
				style={{
					height: 56,
					borderRadius: 14,
					borderWidth: 2,
					borderColor: value ? c.brand : c.border,
					backgroundColor: c.card,
					paddingHorizontal: 16,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 10,
				}}
			>
				<Text numberOfLines={1} style={{ flex: 1, fontSize: 18, fontFamily: fontFamily(value ? 600 : 400), color: value ? c.ink : raw.fillInk }}>
					{value || placeholder}
				</Text>
				<Text style={{ fontSize: 18, color: c.muted }}>▾</Text>
			</Pressable>
		</View>
	)
}

/** The list behind a SelectField: full height, search on top (when the list is long), the chosen row ticked. */
export function SelectSheet<K extends string | number>({
	title,
	options,
	selected,
	onPick,
	onClose,
	searchPlaceholder = 'Поиск',
	onSearch,
}: {
	/** The server searches (brands by «мерс», «бэха»): the sheet shows `options` as they come and always has the field. */
	onSearch?: (q: string) => void
	title: string
	options: SelectOption<K>[]
	selected?: K | null
	onPick: (key: K) => void
	onClose: () => void
	searchPlaceholder?: string
}) {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [q, setQ] = useState('')
	const query = q.trim().toLowerCase()
	const shown = query && !onSearch ? options.filter((o) => o.label.toLowerCase().includes(query)) : options
	const searchable = Boolean(onSearch) || options.length > 12

	return (
		<Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
			<View style={{ flex: 1, backgroundColor: c.surface, paddingBottom: insets.bottom }}>
				<View style={{ height: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
					<Text style={{ flex: 1, fontSize: 22, fontFamily: fontFamily(800), color: c.ink }}>{title}</Text>
					<Pressable onPress={onClose} hitSlop={10} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}>
						<CloseIcon size={18} color={c.ink} />
					</Pressable>
				</View>
				{searchable ? (
					<View
						style={{
							marginHorizontal: 16,
							marginBottom: 8,
							height: 52,
							borderRadius: 14,
							backgroundColor: c.card,
							borderWidth: 2,
							borderColor: c.brand,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 10,
							paddingHorizontal: 14,
						}}
					>
						<SearchIcon size={22} color={c.muted} strokeWidth={2.4} />
						<TextInput
							value={q}
							onChangeText={setQ}
							autoFocus
							placeholder={searchPlaceholder}
							placeholderTextColor={raw.fillInk}
							style={{ flex: 1, fontSize: 17, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
						/>
					</View>
				) : null}
				<FlatList
					data={shown}
					keyExtractor={(o) => String(o.key)}
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
					renderItem={({ item }) => {
						const active = item.key === selected
						return (
							<Pressable
								onPress={() => {
									onPick(item.key)
									onClose()
								}}
								style={{ minHeight: 58, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}
							>
								<View style={{ flex: 1, gap: 2 }}>
									<Text style={{ fontSize: 18, fontFamily: fontFamily(active ? 700 : 500), color: active ? c.brandStrong : c.ink }}>{item.label}</Text>
									{item.sub ? <Text style={{ fontSize: 14.5, fontFamily: fontFamily(400), color: c.muted }}>{item.sub}</Text> : null}
								</View>
								{active ? <CheckIcon size={20} color={c.brand} strokeWidth={3} /> : null}
							</Pressable>
						)
					}}
					ListEmptyComponent={
						<Text style={{ paddingTop: 24, fontSize: 17, fontFamily: fontFamily(500), color: c.muted, textAlign: 'center' }}>Ничего не нашли</Text>
					}
				/>
			</View>
		</Modal>
	)
}
