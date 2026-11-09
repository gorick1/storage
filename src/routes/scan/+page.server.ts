import { getBox } from '$lib/server/records';
export const load = ({ url }) => {
  const into = url.searchParams.get('into');
  return { into: into ? getBox(Number(into)) ?? null : null };
};
