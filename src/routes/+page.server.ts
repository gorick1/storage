import { checkedOutItems, listBoxes, listLocations, recentBoxes, recentItems, unplacedItems } from '$lib/server/records';

export const load = () => ({
  locations: listLocations(),
  recentBoxes: recentBoxes(12),
  recentItems: recentItems(6),
  checkedOut: checkedOutItems().length,
  unplaced: unplacedItems().length,
  homeless: listBoxes(null).length
});
