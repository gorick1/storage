<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { goto, onNavigate } from '$app/navigation';
  import { onMount } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Toasts from '$lib/components/Toasts.svelte';
  import { listenForScanner } from '$lib/client/wedge';
  import { parseCode } from '$lib/codes';
  import { toast } from '$lib/client/toast.svelte';

  let { data, children } = $props();

  const tabs = [
    { href: '/', label: 'Home', icon: 'house' },
    { href: '/search', label: 'Search', icon: 'search' },
    { href: '/scan', label: 'Scan', icon: 'scan', primary: true },
    { href: '/labels', label: 'Labels', icon: 'tag' },
    { href: '/settings', label: 'Settings', icon: 'gear' }
  ];

  const bare = $derived(!data.user || ['/login', '/setup'].includes(page.url.pathname) || page.url.pathname.startsWith('/invite'));

  function active(href: string) {
    const p = page.url.pathname;
    if (href === '/') return p === '/' || p.startsWith('/locations') || p.startsWith('/boxes') || p.startsWith('/items') || p === '/add' || p === '/checked-out';
    return p.startsWith(href);
  }

  // Tiles expand into their record: matching view-transition-names morph between pages.
  onNavigate((navigation) => {
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  onMount(() => {
    if (!data.user) return;
    // Hardware scanner works from any screen. The scan page handles its own flow.
    return listenForScanner((code) => {
      if (page.url.pathname.startsWith('/scan') || page.url.pathname.startsWith('/add')) {
        window.dispatchEvent(new CustomEvent('storage:scan', { detail: code }));
        return;
      }
      const c = parseCode(code);
      if (!c) {
        toast(`“${code}” isn’t a Storage label`, { tone: 'error', icon: 'warning' });
        return;
      }
      goto(`/go/${encodeURIComponent(code)}`);
    });
  });
</script>

{#if bare}
  {@render children()}
{:else}
  <div class="shell">
    <nav class="sidebar" aria-label="Main">
      <div class="brand"><img src="/icon.svg" alt="" width="28" height="28" /> Storage</div>
      {#each tabs as t}
        <a href={t.href} class="side-link" class:on={active(t.href)} aria-current={active(t.href) ? 'page' : undefined}>
          <Icon name={t.icon} size={20} />
          <span>{t.label}</span>
          {#if t.href === '/labels' && data.held}<span class="badge num">{data.held}</span>{/if}
        </a>
      {/each}
      <a href="/add" class="btn block side-add"><Icon name="plus" size={18} stroke={2.4} /> Add item</a>
    </nav>
    <main class="main">
      {@render children()}
    </main>
    <nav class="tabbar" aria-label="Main">
      {#each tabs as t}
        <a href={t.href} class="tab" class:on={active(t.href)} class:primary={t.primary} aria-current={active(t.href) ? 'page' : undefined}>
          <span class="tab-icon">
            <Icon name={t.icon} size={t.primary ? 26 : 25} stroke={t.primary ? 2.1 : 1.8} />
            {#if t.href === '/labels' && data.held}<span class="badge num">{data.held}</span>{/if}
          </span>
          <span class="tab-label">{t.label}</span>
        </a>
      {/each}
    </nav>
  </div>
{/if}
<Toasts />

<style>
  .shell { min-height: 100dvh; }
  .main { min-width: 0; }
  .tabbar {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
    display: grid; grid-template-columns: repeat(5, 1fr);
    height: var(--tabbar-h); padding-bottom: var(--safe-b);
    background: var(--bar); backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-top: 0.5px solid var(--sep);
  }
  .tab { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; color: var(--label-2); font-size: 10px; font-weight: 500; letter-spacing: 0.01em; }
  .tab.on { color: var(--tint); }
  .tab-icon { position: relative; display: grid; place-items: center; height: 28px; }
  .tab.primary .tab-icon { width: 46px; height: 32px; border-radius: 16px; background: var(--tint); color: #fff; margin-top: -2px; }
  .tab.primary { color: var(--label-2); }
  .tab.primary.on { color: var(--tint); }
  .badge { position: absolute; top: -4px; right: -10px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: var(--red); color: #fff; font-size: 12px; font-weight: 600; display: grid; place-items: center; }

  .sidebar { display: none; }
  @media (min-width: 900px) {
    .shell { display: grid; grid-template-columns: 260px 1fr; }
    .tabbar { display: none; }
    .sidebar {
      display: flex; flex-direction: column; gap: 2px; position: sticky; top: 0; height: 100dvh;
      padding: 18px 12px; background: var(--bg-2); border-right: 0.5px solid var(--sep);
    }
    .brand { display: flex; align-items: center; gap: 10px; font: 700 22px/1 var(--font-display); padding: 6px 10px 18px; }
    .brand img { border-radius: 7px; }
    .side-link { position: relative; display: flex; align-items: center; gap: 12px; height: 40px; padding: 0 12px; border-radius: 10px; color: var(--label); font-size: 16px; }
    .side-link :global(svg) { color: var(--tint); }
    .side-link.on { background: var(--tint); color: #fff; }
    .side-link.on :global(svg) { color: #fff; }
    .side-link .badge { position: static; margin-left: auto; }
    .side-add { margin-top: auto; height: 44px; font-size: 16px; }
    :global(:root) { --tabbar-h: 0px; }
  }
  :global(::view-transition-group(*)) { animation-duration: 0.42s; animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1); }
</style>
