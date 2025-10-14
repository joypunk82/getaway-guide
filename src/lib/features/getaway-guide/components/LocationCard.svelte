<script lang="ts">
	import type { Location } from '$lib/types/getaway-guide';

	let { location, onDelete, onAddSite, onEdit } = $props<{
		location: Location;
		onDelete?: (id: string) => void;
		onAddSite?: (id: string) => void;
		onEdit?: (id: string) => void;
	}>();
</script>

<article class="card p-4">
	<header class="mb-3 flex items-start justify-between">
		<div>
			<h3 class="text-lg font-semibold">{location.name}</h3>
			<p class="text-sm text-[var(--muted-foreground)]">
				{location.sites.length} {location.sites.length === 1 ? 'site' : 'sites'}
			</p>
		</div>
		<div class="flex gap-2">
			{#if onAddSite}
				<button
					onclick={() => onAddSite?.(location.id)}
					class="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:shadow-[var(--shadow-sm)]"
					aria-label="Add site to {location.name}"
				>
					+ Site
				</button>
			{/if}
			{#if onDelete}
				<button
					onclick={() => onDelete?.(location.id)}
					class="rounded-md border border-[var(--destructive)] px-2 py-1 text-xs text-[var(--destructive)] hover:bg-[var(--destructive-muted)]"
					aria-label="Delete {location.name}"
				>
					Delete
				</button>
			{/if}
		</div>
	</header>

	{#if location.sites.length > 0}
		<ul class="mt-2 space-y-1">
			{#each location.sites as site (site.id)}
				<li class="flex items-center gap-2 text-sm">
					<span class="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]"></span>
					<span>{site.name}</span>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-sm italic text-[var(--muted-foreground)]">No sites added yet</p>
	{/if}
</article>
