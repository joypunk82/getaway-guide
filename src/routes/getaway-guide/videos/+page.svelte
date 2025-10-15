<script lang="ts">
	import { resolve } from '$app/paths';
	import DurationFilter from '$lib/features/getaway-guide/components/DurationFilter.svelte';
	import VideoCard from '$lib/features/getaway-guide/components/VideoCard.svelte';
	import type { LocationWithVideos, YouTubeVideo } from '$lib/types/getaway-guide';
	import { parseDurationToSeconds } from '$lib/utils/youtube';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	let selectedVideoIds = $state<Set<string>>(new Set());
	let playlistTitle = $state('My Vacation Playlist');
	let playlistDescription = $state('');
	let isCreatingPlaylist = $state(false);
	let playlistError = $state<string | null>(null);

	// Duration filtering state
	let minDurationFilter = $state<number | null>(null);
	let maxDurationFilter = $state<number | null>(null);

	// Filter videos by duration
	function filterVideosByDuration(videos: YouTubeVideo[]): YouTubeVideo[] {
		if (!minDurationFilter && !maxDurationFilter) {
			return videos;
		}

		return videos.filter((video) => {
			const duration = parseDurationToSeconds(video.duration);

			if (minDurationFilter && duration < minDurationFilter) {
				return false;
			}

			if (maxDurationFilter && duration > maxDurationFilter) {
				return false;
			}

			return true;
		});
	}

	function handleDurationFilterChange(min: number | null, max: number | null) {
		minDurationFilter = min;
		maxDurationFilter = max;
	}

	function toggleVideoSelection(videoId: string, selected: boolean) {
		if (selected) {
			selectedVideoIds.add(videoId);
		} else {
			selectedVideoIds.delete(videoId);
		}
		// Trigger reactivity by creating new Set
		selectedVideoIds = new Set(selectedVideoIds);
	}

	function selectAllForLocation(location: LocationWithVideos) {
		const filteredVideos = filterVideosByDuration(location.videos);
		filteredVideos.forEach((video) => selectedVideoIds.add(video.id));
		// Trigger reactivity by creating new Set
		selectedVideoIds = new Set(selectedVideoIds);
	}

	function deselectAllForLocation(location: LocationWithVideos) {
		const filteredVideos = filterVideosByDuration(location.videos);
		filteredVideos.forEach((video) => selectedVideoIds.delete(video.id));
		// Trigger reactivity by creating new Set
		selectedVideoIds = new Set(selectedVideoIds);
	}

	async function handleCreatePlaylist() {
		if (selectedVideoIds.size === 0) {
			playlistError = 'Please select at least one video';
			return;
		}

		isCreatingPlaylist = true;
		playlistError = null;

		try {
			const response = await fetch('/api/getaway-guide/playlist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: playlistTitle,
					description: playlistDescription || undefined,
					videoIds: Array.from(selectedVideoIds)
				})
			});

			if (response.status === 401) {
				const error = await response.json();
				if (error.requiresAuth) {
					// Redirect to YouTube OAuth
					window.location.href = '/api/getaway-guide/auth/login?redirect=/getaway-guide/videos';
					return;
				}
			}

			if (!response.ok) {
				const error = await response.json();
				playlistError = error.message || 'Failed to create playlist';
				return;
			}

			const result = await response.json();
			window.location.href = result.playlistUrl;
		} catch (error) {
			console.error('Playlist creation error:', error);
			playlistError = 'An error occurred while creating the playlist';
		} finally {
			isCreatingPlaylist = false;
		}
	}

	// Filter search results by duration
	const filteredSearchResults = $derived(
		data.searchResults.map((location) => ({
			...location,
			videos: filterVideosByDuration(location.videos)
		}))
	);

	const totalVideos = $derived(
		data.searchResults.reduce(
			(sum: number, location: LocationWithVideos) => sum + location.videos.length,
			0
		)
	);

	const filteredVideoCount = $derived(
		filteredSearchResults.reduce(
			(sum: number, location: LocationWithVideos) => sum + location.videos.length,
			0
		)
	);

	const selectedCount = $derived(selectedVideoIds.size);
	const hasSelectedVideos = $derived(selectedCount > 0);
	const canCreatePlaylist = $derived(hasSelectedVideos && !isCreatingPlaylist);
</script>

<div class="mx-auto max-w-6xl">
	<!-- Header -->
	<section class="mb-6">
		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Video Results</h1>
				<p class="mt-1 text-[var(--muted-foreground)]">
					Found {totalVideos} videos across {data.searchResults.length} locations
					{#if filteredVideoCount !== totalVideos}
						• Showing {filteredVideoCount} after filtering
					{/if}
				</p>
			</div>
			<a
				href={resolve('/getaway-guide')}
				class="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:shadow-[var(--shadow-sm)]"
			>
				← Back to Locations
			</a>
		</div>
	</section>

	{#if data.searchResults.length === 0}
		<div
			class="rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)] p-8 text-center"
		>
			<p class="text-[var(--muted-foreground)]">No video results found. Try adding more locations.</p>
		</div>
	{:else}
		<!-- Duration Filter -->
		<section class="mb-6">
			<DurationFilter
				minDuration={minDurationFilter}
				maxDuration={maxDurationFilter}
				onFilterChange={handleDurationFilterChange}
				{totalVideos}
				filteredVideos={filteredVideoCount}
			/>
		</section>
		<!-- Videos by Location -->
		{#each filteredSearchResults.filter((loc) => loc.videos.length > 0) as location (location.id)}
			<section class="mb-8">
				<div class="mb-4 flex items-center justify-between">
					<div>
						<h2 class="text-xl font-semibold">{location.name}</h2>
						<p class="text-sm text-[var(--muted-foreground)]">
							{location.videos.length} videos • {location.sites
								.map((s: { name: string }) => s.name)
								.join(', ')}
						</p>
					</div>
					<div class="flex gap-2">
						<button
							onclick={() => selectAllForLocation(location)}
							class="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs hover:shadow-[var(--shadow-sm)]"
						>
							Select All
						</button>
						<button
							onclick={() => deselectAllForLocation(location)}
							class="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs hover:shadow-[var(--shadow-sm)]"
						>
							Deselect All
						</button>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each location.videos as video (video.id)}
						<VideoCard
							{video}
							isSelected={selectedVideoIds.has(video.id)}
							onToggleSelect={toggleVideoSelection}
						/>
					{/each}
				</div>
			</section>
		{/each}

		<!-- Playlist Creation Section -->
		<section
			class="sticky bottom-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-lg)]"
		>
			<h2 class="mb-4 text-lg font-semibold">Create YouTube Playlist</h2>

			<div class="mb-4 grid gap-4 sm:grid-cols-2">
				<div>
					<label class="mb-1 block text-sm font-medium" for="playlist-title">Playlist Title</label>
					<input
						id="playlist-title"
						type="text"
						bind:value={playlistTitle}
						maxlength="150"
						required
						class="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium" for="playlist-description"
						>Description (Optional)</label
					>
					<input
						id="playlist-description"
						type="text"
						bind:value={playlistDescription}
						maxlength="200"
						class="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
					/>
				</div>
			</div>

			<div class="mb-4 flex items-center justify-between">
				<p class="text-sm text-[var(--muted-foreground)]">
					{selectedCount} video{selectedCount === 1 ? '' : 's'} selected
				</p>
			</div>

			{#if playlistError}
				<div
					class="mb-4 rounded-md bg-[var(--destructive-muted)] p-3 text-sm text-[var(--destructive)]"
				>
					{playlistError}
				</div>
			{/if}

			<button
				onclick={handleCreatePlaylist}
				disabled={!canCreatePlaylist}
				class="w-full rounded-md bg-[var(--accent)] px-6 py-3 font-medium text-[var(--accent-foreground)] hover:shadow-[var(--shadow)] disabled:opacity-50 sm:w-auto"
			>
				{isCreatingPlaylist ? 'Creating Playlist...' : 'Create Playlist on YouTube'}
			</button>
		</section>
	{/if}
</div>
