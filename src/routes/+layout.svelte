<script lang="ts">
	import { browser, dev } from '$app/environment';
	import '../app.css';

	// Only load analytics in browser and when deployed to Vercel
	if (browser && typeof window !== 'undefined') {
		// Check if we're on Vercel (has the analytics scripts)
		const isVercel =
			document.querySelector('script[src*="/_vercel/"]') ||
			window.location.hostname.includes('vercel.app') ||
			window.location.hostname.includes('getawayguide.vercel.app');

		if (isVercel) {
			import('@vercel/analytics').then(({ inject }) => {
				inject({ mode: dev ? 'development' : 'production' });
			});

			import('@vercel/speed-insights/sveltekit').then(({ injectSpeedInsights }) => {
				injectSpeedInsights();
			});
		}
	}

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
			<div class="flex flex-col items-center space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
				<p class="text-sm text-[var(--muted-foreground)]">
					Getaway Guide &copy; {new Date().getFullYear()}
				</p>
				<div class="flex space-x-6 text-sm">
					<a href="/privacy-policy" class="text-[var(--muted-foreground)] hover:text-[var(--accent)]">
						Privacy Policy
					</a>
					<a href="/terms-of-service" class="text-[var(--muted-foreground)] hover:text-[var(--accent)]">
						Terms of Service
					</a>
				</div>
			</div>
		</div>
	</footer>
</div>
