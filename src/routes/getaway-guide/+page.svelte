<script lang="ts">
	import { resolve } from '$app/paths';
	import GuideImporter from '$lib/features/getaway-guide/components/GuideImporter.svelte';
	import LocationCard from '$lib/features/getaway-guide/components/LocationCard.svelte';
	import LocationForm from '$lib/features/getaway-guide/components/LocationForm.svelte';
	import SiteForm from '$lib/features/getaway-guide/components/SiteForm.svelte';
	import type { Location } from '$lib/types/getaway-guide';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	let addingSiteToLocationId = $state<string | null>(null);
	let isSearching = $state(false);
	let searchError = $state<string | null>(null);
	let locations = $state<Location[]>(data.locations);

	// Derived state for computed values
	const hasLocations = $derived(locations.length > 0);
	const locationCount = $derived(locations.length);
	const hasLocationWithSites = $derived(locations.some((loc) => loc.sites.length > 0));

	async function handleAddLocation(name: string) {
		const response = await fetch('/api/getaway-guide/locations', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		});

		if (!response.ok) {
			const error = await response.json();
			console.error('Failed to add location:', error);
			return;
		}

		const result = await response.json();
		if (result.success && result.location) {
			locations = [...locations, result.location];
		}
	}

	async function handleDeleteLocation(id: string) {
		if (!confirm('Delete this location and all its sites?')) return;

		try {
			const response = await fetch(`/api/getaway-guide/locations/${id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (!response.ok) {
				console.error('Failed to delete location:', result);
				return;
			}

			// Refresh locations from server to ensure consistency
			await refreshLocations();

			if (addingSiteToLocationId === id) {
				addingSiteToLocationId = null;
			}
		} catch (error) {
			console.error('Error deleting location:', error);
		}
	}

	async function handleAddSite(locationId: string, siteName: string) {
		try {
			const response = await fetch(`/api/getaway-guide/locations/${locationId}/sites`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ siteName })
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error('Failed to add site:', errorData);

				// Check if it's a cookie size issue
				if (response.status === 400 && errorData.message?.includes('cookie')) {
					alert(
						'Session storage limit reached. This is a cookie size limitation. Please start a new session or reduce the number of locations/sites.'
					);
				} else {
					alert('Failed to add site. Please try again.');
				}
				return;
			}

			// Update the location in the local state
			locations = locations.map((loc) => {
				if (loc.id === locationId) {
					return {
						...loc,
						sites: [...loc.sites, { id: crypto.randomUUID(), name: siteName }]
					};
				}
				return loc;
			});
		} catch (error) {
			console.error('Error adding site:', error);
			alert('An error occurred while adding the site. Please try again.');
		}
	}

	function openAddSiteForm(locationId: string) {
		addingSiteToLocationId = locationId;
	}

	function closeAddSiteForm() {
		addingSiteToLocationId = null;
	}

	async function handleSearchVideos() {
		if (locations.length === 0) return;

		isSearching = true;
		searchError = null;

		try {
			const response = await fetch('/api/getaway-guide/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (!response.ok) {
				const error = await response.json();
				searchError = error.message || 'Failed to search for videos';
				return;
			}

			// Navigate to results page
			window.location.href = resolve('/getaway-guide/videos');
		} catch (error) {
			console.error('Search error:', error);
			searchError = 'An error occurred while searching for videos';
		} finally {
			isSearching = false;
		}
	}

	async function refreshLocations() {
		try {
			const response = await fetch('/api/getaway-guide/locations');
			if (response.ok) {
				const data = await response.json();
				locations = data.locations;
			} else {
				console.error('Failed to fetch locations');
				throw new Error('Failed to fetch locations');
			}
		} catch (error) {
			console.error('Error fetching locations:', error);
			throw error;
		}
	}

	async function handleImportSuccess() {
		// Fetch updated locations from server
		try {
			await refreshLocations();
		} catch (error) {
			// Fallback to page reload if there's an error
			window.location.reload();
		}
	}

	async function handleReset() {
		if (!confirm('Delete all locations and sites? This cannot be undone.')) return;

		try {
			const response = await fetch('/api/getaway-guide/reset', {
				method: 'POST'
			});

			if (!response.ok) {
				console.error('Failed to reset data');
				return;
			}

			// Refresh locations (should be empty now)
			await refreshLocations();
		} catch (error) {
			console.error('Error resetting data:', error);
		}
	}

	$effect(() => {
		// Clear error when locations change
		searchError = null;
	});
</script>

<div class="mx-auto max-w-4xl">
	<!-- Header -->
	<section class="mb-6">
		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Getaway Guide</h1>
				<p class="mt-1 text-[var(--muted-foreground)]">
					Build your vacation location list and discover YouTube videos for each destination.
				</p>
			</div>
			{#if hasLocations}
				<button
					onclick={handleReset}
					class="rounded-md border border-[var(--destructive)] px-3 py-1.5 text-sm text-[var(--destructive)] hover:bg-[var(--destructive-muted)] transition-colors"
				>
					Reset All
				</button>
			{/if}
		</div>
	</section>

	<!-- Add Location Form -->
	<section class="mb-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
		<h2 class="mb-3 text-sm font-semibold">Add Location</h2>
		<LocationForm onSubmit={handleAddLocation} />
	</section>

	<!-- Import Guide -->
	<section class="mb-6">
		<GuideImporter onImportSuccess={handleImportSuccess} />
	</section>

	<!-- Locations List -->
	<section class="mb-6">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-lg font-semibold">Your Locations</h2>
			{#if hasLocations}
				<span class="text-sm text-[var(--muted-foreground)]">{locationCount} total</span>
			{/if}
		</div>

		{#if !hasLocations}
			<div
				class="rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)] p-8 text-center"
			>
				<p class="text-[var(--muted-foreground)]">
					No locations yet. Add your first vacation destination above!
				</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each locations as location (location.id)}
					<div class="space-y-2">
						<LocationCard {location} onDelete={handleDeleteLocation} onAddSite={openAddSiteForm} />
						{#if addingSiteToLocationId === location.id}
							<SiteForm
								locationId={location.id}
								locationName={location.name}
								onSubmit={handleAddSite}
								onCancel={closeAddSiteForm}
							/>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Search Action -->
	{#if hasLocations}
		<section class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
			<h2 class="mb-2 text-lg font-semibold">Ready to Search?</h2>
			<p class="mb-4 text-sm text-[var(--muted-foreground)]">
				We'll search YouTube for videos based on your locations and sites. This will help you discover
				content for your vacation planning.
			</p>

			{#if searchError}
				<div
					class="mb-4 rounded-md bg-[var(--destructive-muted)] p-3 text-sm text-[var(--destructive)]"
				>
					{searchError}
				</div>
			{/if}

			<button
				onclick={handleSearchVideos}
				disabled={isSearching || !hasLocationWithSites}
				class="rounded-md bg-[var(--accent)] px-6 py-2.5 font-medium text-[var(--accent-foreground)] hover:shadow-[var(--shadow)] disabled:opacity-50"
			>
				{isSearching ? 'Searching...' : 'Search for Videos'}
			</button>

			{#if !hasLocationWithSites}
				<p class="mt-2 text-xs text-[var(--muted-foreground)]">
					Add at least one site to a location to enable search
				</p>
			{/if}
		</section>
	{/if}
</div>
