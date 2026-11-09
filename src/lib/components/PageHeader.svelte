<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  // large: iOS large title in the page. hero: the page draws its own big title, so the bar's title appears only once that scrolls away.
  let { title, back, actions, sub, large = true, hero = false }: { title: string; back?: { href: string; label: string }; actions?: Snippet; sub?: Snippet; large?: boolean; hero?: boolean } = $props();
  let scrolled = $state(false);
  let sentinel: HTMLElement;

  onMount(() => {
    if (hero) {
      const on = () => (scrolled = window.scrollY > 150);
      on();
      window.addEventListener('scroll', on, { passive: true });
      return () => window.removeEventListener('scroll', on);
    }
    const io = new IntersectionObserver(([e]) => (scrolled = !e.isIntersecting), { rootMargin: '-52px 0px 0px 0px' });
    io.observe(sentinel);
    return () => io.disconnect();
  });
</script>

<header class="bar" class:scrolled={scrolled || (!large && !hero)}>
  <div class="bar-inner">
    <div class="left">
      {#if back}
        <a class="back glass" href={back.href}><Icon name="chevron-left" size={22} stroke={2.5} /><span>{back.label}</span></a>
      {/if}
    </div>
    <div class="small-title" class:gone={(hero || large) && !scrolled} aria-hidden={(large || hero) && !scrolled}>{title}</div>
    <div class="right">{@render actions?.()}</div>
  </div>
</header>
{#if large}
  <div class="large">
    <h1 class="large-title">{title}</h1>
    {@render sub?.()}
  </div>
{/if}
<div bind:this={sentinel} class="sentinel"></div>

<style>
  /* iOS 26 header: no bar slab. Controls float as glass; content softens under a blurred scroll edge. */
  .bar { position: sticky; top: 0; z-index: 30; padding-top: var(--safe-t); margin: 0 -16px; }
  .bar::before {
    content: ''; position: absolute; inset: 0 0 -18px; pointer-events: none; opacity: 0; transition: opacity 0.3s;
    background: linear-gradient(to bottom, color-mix(in srgb, var(--bg) 88%, transparent), transparent);
    -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
    -webkit-mask-image: linear-gradient(to bottom, #000 55%, transparent); mask-image: linear-gradient(to bottom, #000 55%, transparent);
  }
  .bar.scrolled::before { opacity: 1; }
  .bar-inner { position: relative; height: 56px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, auto) minmax(0, 1fr); gap: 8px; align-items: center; padding: 0 12px; }
  .left { display: flex; min-width: 0; }
  .right { display: flex; justify-content: flex-end; gap: 8px; align-items: center; }
  .right :global(.btn.plain) {
    height: 40px; padding: 0 16px; border-radius: 20px; font-weight: 600;
    background: var(--glass-bg); -webkit-backdrop-filter: blur(24px) saturate(190%); backdrop-filter: blur(24px) saturate(190%);
    box-shadow: inset 0 1px 0 var(--glass-rim), inset 0 0 0 0.5px var(--glass-edge), var(--glass-shadow);
  }
  .right :global(.btn.small) { height: 40px; border-radius: 20px; padding: 0 18px; }
  .right :global(.icon-btn) { width: 40px; height: 40px; border-radius: 20px; }
  .back { display: flex; align-items: center; gap: 0; height: 40px; padding: 0 14px 0 6px; border-radius: 20px; font-size: 16px; font-weight: 500; min-width: 0; max-width: 100%; transition: transform 0.45s var(--spring); }
  .back:active { transform: scale(0.94); transition-duration: 0.08s; }
  .back span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .back :global(svg) { flex: none; }
  .small-title { font-weight: 600; font-size: 17px; opacity: 0; transform: translateY(6px); transition: opacity 0.2s, transform 0.3s var(--ease); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: min(46vw, 420px); }
  .bar.scrolled .small-title { opacity: 1; transform: none; }
  .small-title.gone { max-width: 0; }
  .large { padding: 2px 4px 6px; }
  .large h1 { overflow-wrap: anywhere; }
  .sentinel { height: 1px; margin-top: -1px; }
</style>
