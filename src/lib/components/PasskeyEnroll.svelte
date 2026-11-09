<script lang="ts">
  import { onMount } from 'svelte';
  import { prefetchRegistration, registerPasskey, describeError } from '$lib/client/passkey';
  import Icon from './Icon.svelte';

  let { codes, onDone }: { codes: string[]; onDone: () => void } = $props();
  let phase = $state<'ask' | 'busy' | 'done' | 'error'>('ask');
  let message = $state('');
  let saved = $state(false);

  onMount(prefetchRegistration);

  async function enroll() {
    phase = 'busy';
    try {
      await registerPasskey(navigator.platform || 'This device');
      phase = 'done';
    } catch (e) {
      phase = 'error';
      message = describeError(e);
    }
  }

  function copy() {
    navigator.clipboard?.writeText(codes.join('\n'));
    saved = true;
  }
</script>

<div class="enroll">
  <div class="step">
    <span class="badge" class:ok={phase === 'done'}><Icon name={phase === 'done' ? 'check' : 'key'} size={22} stroke={2.2} /></span>
    <div>
      <h2 class="title-3">{phase === 'done' ? 'Passkey saved' : 'Sign in with Face ID'}</h2>
      <p class="muted footnote">{phase === 'done' ? 'Next time, tap “Sign in with passkey”. It syncs to your other Apple devices through iCloud Keychain.' : 'Create a passkey for this device. No password to remember.'}</p>
    </div>
  </div>
  {#if phase !== 'done'}
    <button class="btn block" onclick={enroll} disabled={phase === 'busy'}>{phase === 'busy' ? 'Waiting for your device…' : 'Create passkey'}</button>
    {#if phase === 'error'}<p class="error-text">{message}</p>{/if}
  {/if}

  <h3 class="group-label">Recovery codes</h3>
  <div class="group codes">
    {#each codes as c}<span class="code-cell">{c}</span>{/each}
  </div>
  <p class="group-foot">Each code signs you in once if you lose your phone. Keep them somewhere safe, like your password manager.</p>
  <div class="btns">
    <button class="btn gray block" onclick={copy}>{saved ? 'Copied' : 'Copy codes'}</button>
    <button class="btn block" onclick={onDone} disabled={phase !== 'done' && !saved}>Continue</button>
  </div>
  {#if phase !== 'done' && !saved}<p class="footnote muted center">Create a passkey or copy your recovery codes to continue.</p>{/if}
</div>

<style>
  .enroll { display: flex; flex-direction: column; gap: 14px; }
  .step { display: flex; gap: 14px; align-items: flex-start; }
  .step p { margin: 4px 0 0; }
  .badge { width: 46px; height: 46px; border-radius: 14px; background: var(--tint); color: #fff; display: grid; place-items: center; flex: none; }
  .badge.ok { background: var(--green); }
  .codes { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--sep); }
  .code-cell { background: var(--bg-2); padding: 12px; font-family: var(--mono); font-size: 15px; text-align: center; letter-spacing: 0.04em; }
  .group-label { margin: 10px 4px 0; }
  .group-foot { margin: -6px 4px 0; }
  .btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .center { text-align: center; margin: 0; }
</style>
