<!-- Optional YouTube authentication component -->
<script lang="ts">
	let { isAuthenticated = false, onConnect } = $props<{
		isAuthenticated?: boolean;
		onConnect?: () => void;
	}>();

	function handleConnect() {
		onConnect?.();
	}
</script>

{#if !isAuthenticated}
	<div class="rounded-lg border border-[var(--info)] bg-[var(--info-muted)] p-4">
		<div class="flex items-start gap-3">
			<svg
				class="h-5 w-5 flex-shrink-0 text-[var(--info)]"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
					clip-rule="evenodd"
				/>
			</svg>
			<div class="flex-1">
				<h3 class="text-sm font-medium text-[var(--card-foreground)]">Connect YouTube (Optional)</h3>
				<p class="mt-1 text-sm text-[var(--muted-foreground)]">
					Connect your YouTube account now to create playlists seamlessly later. You can also do this
					when creating your playlist.
				</p>
				<button
					onclick={handleConnect}
					class="mt-3 rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-foreground)] hover:shadow-[var(--shadow-sm)] transition-all"
				>
					Connect YouTube Account
				</button>
			</div>
		</div>
	</div>
{:else}
	<div class="rounded-lg border border-[var(--success)] bg-[var(--success-muted)] p-4">
		<div class="flex items-center gap-2">
			<svg
				class="h-5 w-5 text-[var(--success)]"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
					clip-rule="evenodd"
				/>
			</svg>
			<span class="text-sm font-medium text-[var(--card-foreground)]">YouTube Connected</span>
		</div>
	</div>
{/if}
