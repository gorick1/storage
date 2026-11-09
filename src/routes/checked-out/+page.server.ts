import { checkedOutItems } from '$lib/server/records';
export const load = () => ({ items: checkedOutItems() });
