<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { goto, onNavigate, invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Toasts from '$lib/components/Toasts.svelte';
  import PrintPill from '$lib/components/PrintPill.svelte';
  import Sheet from '$lib/components/Sheet.svelte';
  import BoxPicker from '$lib/components/BoxPicker.svelte';
  import { listenForScanner } from '$lib/client/wedge';
  import { parseCode } from '$lib/codes';
  import { toast } from '$lib/client/toast.svelte';
  import { moveSheet, completeMove } from '$lib/client/actions.svelte';
  import { flushQueue, queuedCount } from '$lib/client/offline.svelte';

  let { data, children } = $props();

  const tabs = [
    { href: '/', label: 'Home', icon: 'house' },
    { href: '/scan', label: 'Scan', icon: 'scan', primary: true },
    { href: '/labels', label: 'Labels', icon: 'tag' },
    { href: '/settings', label: 'Settings', icon: 'gear' }
  ];

  const bare = $derived(!data.user || ['/login', '/setup'].includes(page.url.pathname) || page.url.pathname.startsWith('/invite'));
  const onScan = $derived(page.url.pathname.startsWith('/scan'));

  function active(href: string) {
    const p = page.url.pathname;
    if (href === '/') return p === '/' || p.startsWith('/locations') || p.startsWith('/boxes') || p.startsWith('/items') || p === '/add' || p === '/checked-out' || p.startsWith('/trash') || p.startsWith('/report');
    return p.startsWith(href);
  }
  const activeIndex = $derived(Math.max(0, tabs.findIndex((t) => active(t.href))));

  // Tab bar tucks in while scrolling down and comes back on the way up, as on iOS.
  let compact = $state(false);
  let lastY = 0;
  function onScroll() {
    const y = window.scrollY;
    if (Math.abs(y - lastY) > 6) compact = y > lastY && y > 80;
    lastY = y;
  }

  // Pull to refresh (touch, at the top of the page).
  let pull = $state(0);
  let refreshing = $state(false);
  let startY: number | null = null;
  function touchStart(e: TouchEvent) {
    startY = window.scrollY <= 0 && !onScan ? e.touches[0].clientY : null;
  }
  function touchMove(e: TouchEvent) {
    if (startY == null || refreshing) return;
    const d = e.touches[0].clientY - startY;
    pull = d > 0 ? Math.min(110, d * 0.5) : 0;
  }
  async function touchEnd() {
    if (pull > 64 && !refreshing) {
      refreshing = true;
      navigator.vibrate?.(10);
      await Promise.all([invalidateAll(), flushQueue(), new Promise((r) => setTimeout(r, 450))]);
      refreshing = false;
    }
    pull = 0;
    startY = null;
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
    flushQueue();
    const online = () => flushQueue();
    window.addEventListener('online', online);
    const slash = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !t.matches('input, textarea, select, [contenteditable]')) {
        e.preventDefault();
        goto('/search');
      }
    };
    window.addEventListener('keydown', slash);
    // Hardware scanner works from any screen. Pages with their own scan flow handle it themselves.
    const stop = listenForScanner((code) => {
      const p = page.url.pathname;
      if (p.startsWith('/scan') || p.startsWith('/add') || p.endsWith('/verify')) {
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
    return () => {
      stop();
      window.removeEventListener('online', online);
      window.removeEventListener('keydown', slash);
    };
  });
</script>

<svelte:window onscroll={onScroll} ontouchstart={touchStart} ontouchmove={touchMove} ontouchend={touchEnd} />

{#if bare}
  {@render children()}
{:else}
  <div class="shell">
    <nav class="sidebar glass" aria-label="Main">
      <div class="brand"><img src="/icon.svg" alt="" width="30" height="30" /> Storage</div>
      <a href="/search" class="side-search"><Icon name="search" size={17} stroke={2.2} /><span>Search</span><kbd>/</kbd></a>
      {#each tabs as t}
        <a href={t.href} class="side-link" class:on={active(t.href)} aria-current={active(t.href) ? 'page' : undefined}>
          <Icon name={t.icon} size={20} />
          <span>{t.label}</span>
          {#if t.href === '/labels' && data.held}<span class="badge num">{data.held}</span>{/if}
        </a>
      {/each}
      {#if queuedCount.n}<p class="queued footnote"><Icon name="clock" size={14} /> {queuedCount.n} waiting to upload</p>{/if}
      <a href="/add" class="btn block side-add"><Icon name="plus" size={18} stroke={2.4} /> Add item</a>
    </nav>

    <div class="ptr" style:transform={`translateY(${refreshing ? 56 : pull * 0.8 - 40}px) rotate(${pull * 3}deg)`} style:opacity={refreshing ? 1 : Math.min(1, pull / 64)} aria-hidden="true">
      <span class="glass ptr-dot" class:spin={refreshing}><Icon name="chevron-down" size={18} stroke={2.6} /></span>
    </div>

    <main class="main" style:transform={pull && !refreshing ? `translateY(${pull * 0.35}px)` : undefined}>
      {@render children()}
    </main>

    <div class="dock" class:compact class:hidden={onScan}>
      <nav class="tabbar glass" aria-label="Main" style:--i={activeIndex}>
        <span class="lens" aria-hidden="true"></span>
        {#each tabs as t}
          <a href={t.href} class="tab" class:on={active(t.href)} class:primary={t.primary} aria-current={active(t.href) ? 'page' : undefined}>
            <span class="tab-icon">
              <Icon name={t.icon} size={t.primary ? 25 : 24} stroke={t.primary ? 2.2 : 1.9} />
              {#if t.href === '/labels' && data.held}<span class="badge num">{data.held}</span>{/if}
            </span>
            <span class="tab-label">{t.label}</span>
          </a>
        {/each}
      </nav>
      <a class="search-orb glass" href="/search" aria-label="Search" class:on={page.url.pathname.startsWith('/search')}>
        <Icon name="search" size={22} stroke={2.2} />
        {#if queuedCount.n}<span class="badge num">{queuedCount.n}</span>{/if}
      </a>
    </div>
  </div>

  <Sheet bind:open={moveSheet.open} title={moveSheet.ids.length > 1 ? `Move ${moveSheet.ids.length} items` : `Move ${moveSheet.label}`}>
    {#if moveSheet.open}<BoxPicker onPick={completeMove} />{/if}
  </Sheet>
  <PrintPill />
{/if}
<Toasts />

<style>
  .shell { min-height: 100dvh; }
  .main { min-width: 0; transition: transform 0.4s var(--spring); }

  /* Floating Liquid Glass tab bar + search orb */
  .dock {
    position: fixed; left: 16px; right: 16px; bottom: calc(var(--safe-b) + 10px); z-index: 40;
    display: flex; gap: 10px; align-items: center; transition: transform 0.5s var(--spring), opacity 0.3s;
  }
  .dock.hidden { transform: translateY(140%); opacity: 0; pointer-events: none; }
  .tabbar {
    position: relative; flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); height: 64px; padding: 5px; border-radius: 32px;
  }
  .lens {
    position: absolute; top: 5px; bottom: 5px; left: 5px; width: calc((100% - 10px) / 4); border-radius: 27px;
    background: var(--glass-lens); transform: translateX(calc(var(--i) * 100%)); transition: transform 0.55s var(--spring);
  }
  .tab { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; color: var(--label); font-size: 10.5px; font-weight: 600; letter-spacing: 0.01em; border-radius: 27px; }
  .tab.on { color: var(--tint); }
  .tab:active .tab-icon { transform: scale(0.88); transition-duration: 0.08s; }
  .tab-icon { position: relative; display: grid; place-items: center; height: 28px; transition: transform 0.45s var(--spring); }
  .tab.primary .tab-icon { width: 44px; height: 30px; border-radius: 15px; background: var(--tint); color: #fff; }
  .tab-label { transition: opacity 0.2s, transform 0.35s var(--spring); }
  .search-orb { position: relative; width: 64px; height: 64px; border-radius: 32px; flex: none; display: grid; place-items: center; color: var(--label); transition: transform 0.45s var(--spring); }
  .search-orb.on { color: var(--tint); }
  .search-orb:active { transform: scale(0.9); }
  /* Compacting scales the whole dock (transform only) and tucks the labels away. */
  .dock { transform-origin: 50% 100%; }
  .dock.compact { transform: scale(0.86) translateY(4px); }
  .dock.compact .tab-label { opacity: 0; transform: translateY(4px); }
  .dock.compact .tab-icon { transform: translateY(6px); }
  .badge { position: absolute; top: -4px; right: -10px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: var(--red); color: #fff; font-size: 12px; font-weight: 600; display: grid; place-items: center; }
  .search-orb .badge { top: 4px; right: 4px; background: var(--c-orange); }

  /* Pull to refresh */
  .ptr { position: fixed; top: calc(var(--safe-t) + 4px); left: 0; right: 0; display: flex; justify-content: center; z-index: 35; pointer-events: none; transition: transform 0.3s var(--spring); }
  .ptr-dot { width: 40px; height: 40px; border-radius: 20px; display: grid; place-items: center; color: var(--tint); }
  .ptr-dot.spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .sidebar { display: none; }
  @media (min-width: 900px) {
    .shell { display: grid; grid-template-columns: 272px 1fr; }
    .dock { display: none; }
    .sidebar {
      display: flex; flex-direction: column; gap: 2px; position: sticky; top: 12px; height: calc(100dvh - 24px); margin: 12px 0 12px 12px;
      padding: 16px 12px; border-radius: 26px;
    }
    .brand { display: flex; align-items: center; gap: 10px; font: 700 22px/1 var(--font-display); padding: 6px 10px 16px; }
    .brand img { border-radius: 8px; }
    .side-search { display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 12px; margin-bottom: 10px; border-radius: 12px; background: var(--fill); color: var(--label-2); font-size: 15px; }
    .side-search span { flex: 1; }
    .side-search kbd { font: 500 12px var(--mono); padding: 1px 6px; border-radius: 5px; background: var(--bg-2); color: var(--label-3); }
    .side-link { position: relative; display: flex; align-items: center; gap: 12px; height: 42px; padding: 0 12px; border-radius: 13px; color: var(--label); font-size: 16px; font-weight: 500; transition: background 0.2s; }
    .side-link :global(svg) { color: var(--tint); }
    .side-link:hover { background: var(--glass-lens); }
    .side-link.on { background: var(--tint); color: #fff; }
    .side-link.on :global(svg) { color: #fff; }
    .side-link .badge { position: static; margin-left: auto; }
    .queued { display: flex; align-items: center; gap: 6px; color: var(--c-orange); margin: auto 12px 8px; }
    .side-add { margin-top: auto; height: 46px; font-size: 16px; }
    .queued + .side-add { margin-top: 0; }
    :global(:root) { --tabbar-h: 0px; }
    .ptr { display: none; }
  }
</style>
