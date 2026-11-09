import type { ParamMatcher } from '@sveltejs/kit';
export const match: ParamMatcher = (p) => /^[IBLibl][0-9A-Za-z]{1,7}$/.test(p);
