import { useState } from 'react'
import { RefreshControl, ScrollView, View, useWindowDimensions } from 'react-native'
import { router } from 'expo-router'
import { EmptyState, QueryErrorBanner, Screen, ScreenHeader, Segmented, SkeletonProductGrid, SkeletonRepeat } from '@/components/ui'
import { HeartIcon } from '@/components/icons'
import { PartTile } from '@/components/catalog-screen'
import { useColors } from '@/theme'
import { usePullRefresh } from '@/lib/use-pull-refresh'
import { useFavoriteParts, useFavoriteShops } from '@/api/me'
import { useSession } from '@/store/useSession'
import { ShopRow, ShopRowSkeleton } from './shops'
import { t } from '@/i18n'

/** «Избранное»: the parts and shops saved with ♥ — two tabs, a tap opens them; ♥ on a part removes it here too. */
export default function FavoritesScreen() {
	const c = useColors()
	const { width } = useWindowDimensions()
	const parts = useFavoriteParts()
	const shops = useFavoriteShops()
	const [tab, setTab] = useState(0)
	const pull = usePullRefresh(() => [parts.refetch(), shops.refetch()])
	const partList = parts.data ?? []
	const shopList = shops.data ?? []
	const query = tab === 0 ? parts : shops
	const role = useSession((s) => s.role)

	return (
		<Screen padding={0}>
			<ScreenHeader title={t('Избранное')} />
			<View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
				<Segmented
					items={[
						partList.length ? t('Запчасти · {0}', partList.length) : t('Запчасти'),
						shopList.length ? t('Магазины · {0}', shopList.length) : t('Магазины'),
					]}
					value={tab}
					onChange={setTab}
					height={48}
					itemHeight={40}
				/>
			</View>

			<ScrollView
				contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}
				showsVerticalScrollIndicator={false}
				refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={c.muted} />}
			>
				<QueryErrorBanner error={query.error} onRetry={() => query.refetch()} />

				{tab === 0 ? (
					parts.isLoading ? (
						<SkeletonProductGrid rows={2} />
					) : partList.length ? (
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 20 }}>
							{partList.map((part) => (
								<View key={part.id} style={{ width: (width - 32 - 12) / 2 }}>
									<PartTile part={part} />
								</View>
							))}
						</View>
					) : parts.isSuccess ? (
						<EmptyState
							title={t('Здесь будут сохранённые запчасти')}
							hint={t('Нажмите ♥ на запчасти, чтобы вернуться к ней позже')}
							icon={HeartIcon}
							action={{ label: t('Перейти в каталог'), onPress: () => router.push(role === 'MASTER' ? '/master/parts' : '/buyer/parts') }}
						/>
					) : null
				) : shops.isLoading ? (
					<SkeletonRepeat count={5} gap={10}>
						<ShopRowSkeleton />
					</SkeletonRepeat>
				) : shopList.length ? (
					shopList.map((shop) => <ShopRow key={shop.id} shop={shop} />)
				) : shops.isSuccess ? (
					<EmptyState
						title={t('Здесь будут любимые магазины')}
						hint={t('Нажмите ♥ в профиле магазина — он будет под рукой')}
						icon={HeartIcon}
						action={{ label: t('Все магазины'), onPress: () => router.push('/shops') }}
					/>
				) : null}
			</ScrollView>
		</Screen>
	)
}
