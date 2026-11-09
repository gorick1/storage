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
        <a class="back" href={back.href}><Icon name="chevron-left" size={24} stroke={2.4} /><span>{back.label}</span></a>
      {/if}
    </div>
    <div class="small-title" class:gone={hero && !scrolled} aria-hidden={(large || hero) && !scrolled}>{title}</div>
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
  .bar { position: sticky; top: 0; z-index: 30; padding-top: var(--safe-t); margin: 0 -16px; transition: background 0.25s, border-color 0.25s; border-bottom: 0.5px solid transparent; }
  .bar.scrolled { background: var(--bar); backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px); border-bottom-color: var(--sep); }
  .bar-inner { height: 52px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, auto) minmax(0, 1fr); gap: 8px; align-items: center; padding: 0 12px; }
  .left { display: flex; min-width: 0; }
  .right { display: flex; justify-content: flex-end; gap: 10px; align-items: center; }
  .back { display: flex; align-items: center; gap: 0; margin-left: -6px; font-size: 17px; min-width: 0; }
  .back span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .back :global(svg) { flex: none; }
  .small-title { font-weight: 600; font-size: 17px; opacity: 0; transform: translateY(6px); transition: opacity 0.2s, transform 0.3s var(--ease); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: min(46vw, 420px); }
  .bar.scrolled .small-title { opacity: 1; transform: none; }
  .small-title.gone { max-width: 0; }
  .large { padding: 2px 4px 6px; }
  .large h1 { overflow-wrap: anywhere; }
  .sentinel { height: 1px; margin-top: -1px; }
</style>
