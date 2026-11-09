import { resolveCode } from '$lib/server/resolve';
export const load = ({ params }) => resolveCode(params.code);
