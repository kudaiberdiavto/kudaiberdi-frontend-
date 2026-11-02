import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

/**
 * Infinite scroll for a plain ScrollView (FlatList has onEndReached): `onScroll={onNearEnd(loadMore)}`
 * calls `loadMore` once the content's end is within `threshold` px of the viewport's bottom.
 */
export const onNearEnd =
	(loadMore: () => void, threshold = 600) =>
	({ nativeEvent: { layoutMeasurement, contentOffset, contentSize } }: NativeSyntheticEvent<NativeScrollEvent>) => {
		if (layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold) loadMore()
	}
