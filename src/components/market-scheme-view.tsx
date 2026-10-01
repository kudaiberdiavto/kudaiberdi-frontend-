import { useRef, useState } from 'react'
import { Pressable, ScrollView, Text, View, type GestureResponderEvent } from 'react-native'
import Svg, { G, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg'
import { fontFamily, raw, useColors } from '@/theme'
import { useMarketScheme } from '@/api/market'

interface Props {
	width: number
	height: number
	/** Rows drawn as selected (brand outline, tinted). */
	selectedRowIds?: number[]
	onRowPress?: (rowId: number) => void
	/** Scheme → screen scale (the mockup uses 0.40). */
	scale?: number
	/** Pill over the scheme — «Тапните ряд или контейнер». */
	hint?: string
}

/**
 * Static market scheme [31] — the GET /market/map geometry drawn with SVG (no GPS map),
 * tappable rows, pannable. Colours are the map tokens.
 */
export function MarketSchemeView({ width, height, selectedRowIds = [], onRowPress, scale = 0.4, hint }: Props) {
	const c = useColors()
	const scheme = useMarketScheme().data
	const selected = new Set(selectedRowIds)

	const points = [
		...scheme.boundary,
		...scheme.rows.flatMap((r) =>
			r.geometry.rect ? [[r.geometry.rect.x + r.geometry.rect.w, r.geometry.rect.y + r.geometry.rect.h]] : (r.geometry.polygon ?? [])
		),
	]
	const contentWidth = (Math.max(...points.map(([x]) => x)) + 40) * scale
	const contentHeight = (Math.max(...points.map(([, y]) => y)) + 40) * scale
	const pts = (list: number[][]) => list.map(([x, y]) => `${x},${y}`).join(' ')

	// Open centred on the selected rows (or on the rows' middle) — computed once, on mount.
	const [offset] = useState(() => {
		const focus = scheme.rows.filter((r) => selected.has(r.id))
		const centers = (focus.length ? focus : scheme.rows).map(rowCenter)
		const cx = (centers.reduce((s, [x]) => s + x, 0) / centers.length) * scale
		const cy = (centers.reduce((s, [, y]) => s + y, 0) / centers.length) * scale
		return {
			x: Math.max(0, Math.min(contentWidth - width, cx - width / 2)),
			y: Math.max(0, Math.min(contentHeight - height, cy - height / 2)),
		}
	})

	// One press handler + hit test instead of onPress on every SVG shape (react-native-web
	// leaks responder props onto <rect>). A drag cancels the press, so panning still works.
	const canvas = useRef<View>(null)
	const scrollV = useRef<ScrollView>(null)
	const scrollH = useRef<ScrollView>(null)
	// contentOffset is ignored by react-native-web — scroll once the canvas is laid out.
	const scrollToOffset = () => {
		scrollV.current?.scrollTo({ y: offset.y, animated: false })
		scrollH.current?.scrollTo({ x: offset.x, animated: false })
	}
	const press = (e: GestureResponderEvent) => {
		if (!onRowPress) return
		const { pageX, pageY } = e.nativeEvent
		canvas.current?.measureInWindow((left, top) => {
			const point = [(pageX - left) / scale, (pageY - top) / scale]
			const hit = scheme.rows.find((r) => hitRow(r.geometry, point))
			if (hit) onRowPress(hit.id)
		})
	}

	return (
		<View
			style={{
				width,
				height,
				borderRadius: 16,
				overflow: 'hidden',
				backgroundColor: raw.mapSurface,
			}}
		>
			<ScrollView ref={scrollV} contentOffset={{ x: 0, y: offset.y }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
				<ScrollView ref={scrollH} horizontal contentOffset={{ x: offset.x, y: 0 }} showsHorizontalScrollIndicator={false} nestedScrollEnabled>
					<Pressable ref={canvas} onPress={press} disabled={!onRowPress} onLayout={scrollToOffset}>
						<Svg width={contentWidth} height={contentHeight}>
							<G scale={scale}>
								<Polygon points={pts(scheme.boundary)} fill={raw.mapBoundary} stroke={raw.mapBoundaryStroke} strokeOpacity={0.55} strokeWidth={4} />
								{scheme.passages.map((passage, i) => (
									<G key={`p${i}`}>
										<Polyline
											points={pts(passage.points)}
											fill="none"
											stroke={raw.mapPassageEdge}
											strokeWidth={passage.width + 3}
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
										<Polyline
											points={pts(passage.points)}
											fill="none"
											stroke={raw.mapPassage}
											strokeWidth={passage.width}
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</G>
								))}
								{scheme.blocks.map((block, i) =>
									block.rect ? (
										<Rect
											key={`b${i}`}
											x={block.rect.x}
											y={block.rect.y}
											width={block.rect.w}
											height={block.rect.h}
											rx={6}
											fill={block.kind === 'admin' ? raw.mapAdmin : raw.mapShop}
											stroke={block.kind === 'admin' ? raw.mapAdminBorder : raw.mapShopBorder}
											strokeWidth={2}
										/>
									) : null
								)}
								{scheme.rows.map((row) => {
									const on = selected.has(row.id)
									const common = {
										fill: on ? c.brandTint : raw.mapRow,
										stroke: on ? c.brand : raw.mapRowBorder,
										strokeWidth: on ? 6 : 2,
									}
									const rect = row.geometry.rect
									const center = rowCenter(row)
									const vertical = rect ? rect.h > rect.w : true
									return (
										<G key={row.id}>
											{rect ? (
												<Rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={8} {...common} />
											) : (
												<Polygon points={pts(row.geometry.polygon ?? [])} {...common} />
											)}
											<SvgText x={center[0]} y={center[1] + 9} fontSize={25} fontWeight="700" fill={on ? c.brandStrong : c.muted} textAnchor="middle">
												{/* Vertical rows are too narrow for «Ряд Ж» — just the letter. */}
												{vertical ? row.code : row.label}
											</SvgText>
										</G>
									)
								})}
							</G>
						</Svg>
					</Pressable>
				</ScrollView>
			</ScrollView>

			{hint ? (
				<View
					pointerEvents="none"
					style={{
						position: 'absolute',
						left: 10,
						bottom: 10,
						height: 28,
						paddingHorizontal: 10,
						borderRadius: 14,
						backgroundColor: 'rgba(255,255,255,0.94)',
						justifyContent: 'center',
					}}
				>
					<Text
						style={{
							fontSize: 12,
							fontFamily: fontFamily(700),
							color: c.brandStrong,
						}}
					>
						{hint}
					</Text>
				</View>
			) : null}
		</View>
	)
}

type Row = ReturnType<typeof useMarketScheme>['data']['rows'][number]

function rowCenter(row: Row): number[] {
	const rect = row.geometry.rect
	if (rect) return [rect.x + rect.w / 2, rect.y + rect.h / 2]
	const poly = row.geometry.polygon ?? [[0, 0]]
	return [poly.reduce((s, [x]) => s + x, 0) / poly.length, poly.reduce((s, [, y]) => s + y, 0) / poly.length]
}

function hitRow(geometry: Row['geometry'], [x, y]: number[]): boolean {
	const rect = geometry.rect
	if (rect) return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
	const poly = geometry.polygon ?? []
	let inside = false
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const [xi, yi] = poly[i]
		const [xj, yj] = poly[j]
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
	}
	return inside
}
