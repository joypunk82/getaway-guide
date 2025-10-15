<!-- Debug/test page for YouTube integration -->
<script lang="ts">
	import { onMount } from 'svelte';

	interface SystemHealth {
		status: 'healthy' | 'degraded';
		timestamp: string;
		checks: {
			apiKey: boolean;
			apiKeyValid: boolean;
			userAuthenticated: boolean;
			userTokenValid: boolean;
			databaseConnection: boolean;
		};
		message: string;
	}

	interface UserAuth {
		authenticated: boolean;
		valid?: boolean;
		canCreatePlaylists?: boolean;
		message: string;
	}

	interface TestResult {
		type: 'success' | 'error' | 'info';
		message: string;
		data?: any;
	}

	let systemHealth = $state<SystemHealth | null>(null);
	let userAuth = $state<UserAuth | null>(null);
	let testResults = $state<TestResult[]>([]);
	let loading = $state(false);

	async function checkSystemHealth() {
		loading = true;
		try {
			const response = await fetch('/api/getaway-guide/health');
			systemHealth = await response.json();
		} catch (error) {
			console.error('Health check failed:', error);
			testResults = [...testResults, { type: 'error', message: 'Failed to check system health' }];
		}
		loading = false;
	}

	async function checkUserAuth() {
		loading = true;
		try {
			const response = await fetch('/api/getaway-guide/auth/check');
			userAuth = await response.json();
		} catch (error) {
			console.error('Auth check failed:', error);
			testResults = [...testResults, { type: 'error', message: 'Failed to check user authentication' }];
		}
		loading = false;
	}

	async function testPlaylistCreation() {
		loading = true;
		testResults = [...testResults, { type: 'info', message: 'Testing playlist creation...' }];
		
		try {
			const response = await fetch('/api/getaway-guide/playlist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: 'Test Playlist ' + new Date().toISOString(),
					description: 'Test playlist created from debug page',
					videoIds: ['dQw4w9WgXcQ'] // Rick Roll for testing
				})
			});

			const result = await response.json();
			
			if (response.ok) {
				testResults = [...testResults, { 
					type: 'success', 
					message: `✅ Playlist created successfully: ${result.playlist?.title}`,
					data: result
				}];
			} else {
				testResults = [...testResults, { 
					type: 'error', 
					message: `❌ Playlist creation failed: ${result.message}`,
					data: result
				}];
			}
		} catch (error) {
			testResults = [...testResults, { 
				type: 'error', 
				message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
			}];
		}
		loading = false;
	}

	function connectYouTube() {
		window.location.href = '/api/getaway-guide/auth/login?redirect=/debug';
	}

	function clearResults() {
		testResults = [];
		systemHealth = null;
		userAuth = null;
	}

	onMount(() => {
		checkSystemHealth();
		checkUserAuth();
	});
</script>

<svelte:head>
	<title>YouTube API Debug - Getaway Guide</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8">
	<header>
		<h1 class="text-2xl font-bold">YouTube API Debug</h1>
		<p class="text-[var(--muted-foreground)]">Test and debug YouTube integration</p>
	</header>

	<!-- System Health -->
	<section class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
		<h2 class="mb-4 text-lg font-semibold">System Health</h2>
		{#if systemHealth}
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<span class="font-medium">Status:</span>
					<span class="rounded px-2 py-1 text-sm {systemHealth.status === 'healthy' 
						? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
						: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}">
						{systemHealth.status}
					</span>
				</div>
				<div class="text-sm text-[var(--muted-foreground)]">{systemHealth.message}</div>
				
				<details class="mt-4">
					<summary class="cursor-pointer text-sm font-medium">System Checks</summary>
					<pre class="mt-2 rounded bg-[var(--muted)] p-3 text-xs overflow-auto">{JSON.stringify(systemHealth.checks, null, 2)}</pre>
				</details>
			</div>
		{:else}
			<div class="text-[var(--muted-foreground)]">Loading...</div>
		{/if}
	</section>

	<!-- User Authentication -->
	<section class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
		<h2 class="mb-4 text-lg font-semibold">User Authentication</h2>
		{#if userAuth}
			{#if userAuth.authenticated}
				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<span class="font-medium">Status:</span>
						<span class="rounded px-2 py-1 text-sm {userAuth.valid && userAuth.canCreatePlaylists
							? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
							: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}">
							{userAuth.valid ? (userAuth.canCreatePlaylists ? 'Fully Authenticated' : 'Limited Access') : 'Invalid Token'}
						</span>
					</div>
					<div class="text-sm text-[var(--muted-foreground)]">{userAuth.message}</div>
				</div>
			{:else}
				<div class="space-y-4">
					<div class="text-[var(--muted-foreground)]">{userAuth.message}</div>
					<button 
						onclick={connectYouTube}
						class="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90"
					>
						Connect YouTube
					</button>
				</div>
			{/if}
		{:else}
			<div class="text-[var(--muted-foreground)]">Loading...</div>
		{/if}
	</section>

	<!-- Test Actions -->
	<section class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
		<h2 class="mb-4 text-lg font-semibold">Test Actions</h2>
		<div class="flex flex-wrap gap-4">
			<button 
				onclick={checkSystemHealth}
				disabled={loading}
				class="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:shadow-[var(--shadow-sm)] disabled:opacity-50"
			>
				Recheck System Health
			</button>
			<button 
				onclick={checkUserAuth}
				disabled={loading}
				class="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:shadow-[var(--shadow-sm)] disabled:opacity-50"
			>
				Recheck Authentication
			</button>
			<button 
				onclick={testPlaylistCreation}
				disabled={loading || !userAuth?.authenticated}
				class="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90 disabled:opacity-50"
			>
				Test Playlist Creation
			</button>
			<button 
				onclick={clearResults}
				disabled={loading}
				class="rounded-md border border-[var(--destructive)] px-4 py-2 text-sm text-[var(--destructive)] hover:bg-[var(--destructive-muted)] disabled:opacity-50"
			>
				Clear Results
			</button>
		</div>
	</section>

	<!-- Test Results -->
	{#if testResults.length > 0}
		<section class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
			<h2 class="mb-4 text-lg font-semibold">Test Results</h2>
			<div class="space-y-3">
				{#each testResults as result}
					<div class="rounded-md border p-3 {result.type === 'success' 
						? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
						: result.type === 'error' 
						? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
						: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'}">
						<div class="text-sm">{result.message}</div>
						{#if result.data}
							<details class="mt-2">
								<summary class="cursor-pointer text-xs">Raw Response</summary>
								<pre class="mt-1 text-xs overflow-auto">{JSON.stringify(result.data, null, 2)}</pre>
							</details>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<footer class="text-center">
		<a href="/getaway-guide" class="text-sm text-[var(--accent)] hover:underline">
			← Back to Getaway Guide
		</a>
	</footer>
</div>