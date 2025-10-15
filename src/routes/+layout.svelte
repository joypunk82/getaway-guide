<script lang="ts">
import '../app.css';
import { dev } from '$app/environment';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

inject({ mode: dev ? 'development' : 'production' });
injectSpeedInsights();

let { children } = $props();
</script>

<svelte:head>
<title>Getaway Guide</title>
<meta name="description" content="Plan your vacation with curated YouTube playlists" />
</svelte:head>

<div class="min-h-screen bg-[var(--bg)]">
<header class="border-b border-[var(--border)] bg-[var(--card)]">
<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
<div class="flex items-center justify-between">
<h1 class="text-2xl font-bold text-[var(--accent)]">
<a href="/">Getaway Guide</a>
</h1>
<nav>
<a
href="/getaway-guide"
class="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--muted)]"
>
Plan Trip
</a>
</nav>
</div>
</div>
</header>

<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
{@render children?.()}
</main>

<footer class="mt-16 border-t border-[var(--border)] bg-[var(--card)] py-8">
<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
<p class="text-center text-sm text-[var(--muted-foreground)]">
Getaway Guide &copy; {new Date().getFullYear()}
</p>
</div>
</footer>
</div>
