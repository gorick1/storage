import { checkedOutItems, listBoxes, listLocations, missingItems, pinnedBoxes, recentBoxes, recentItems, unplacedItems } from '$lib/server/records';

export const load = () => ({
  locations: listLocations(),
  pinned: pinnedBoxes(),
  recentBoxes: recentBoxes(12, true),
  recentItems: recentItems(6),
  checkedOut: checkedOutItems().length,
  missing: missingItems().length,
  unplaced: unplacedItems().length,
  homeless: listBoxes(null).length
});
