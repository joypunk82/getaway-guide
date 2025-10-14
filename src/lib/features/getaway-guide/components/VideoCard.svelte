<script lang="ts">
	import type { YouTubeVideo } from '$lib/types/getaway-guide';
	import { formatDuration, formatViewCount } from '$lib/utils/youtube';

	let {
		video,
		isSelected = false,
		onToggleSelect
	} = $props<{
		video: YouTubeVideo;
		isSelected?: boolean;
		onToggleSelect?: (videoId: string, selected: boolean) => void;
	}>();

	function handleToggle() {
		onToggleSelect?.(video.id, !isSelected);
	}

	const duration = $derived(formatDuration(video.duration));
	const viewCount = $derived(formatViewCount(video.viewCount));
</script>

<article
	class="card group relative overflow-hidden transition-all {isSelected
		? 'ring-2 ring-[var(--accent)]'
		: ''}"
>
	<!-- Thumbnail -->
	<div class="relative aspect-video overflow-hidden bg-[var(--muted)]">
		<img
			src={video.thumbnailUrl}
			alt={video.title}
			class="h-full w-full object-cover transition-transform group-hover:scale-105"
			loading="lazy"
		/>
		<!-- Duration badge -->
		<div class="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
			{duration}
		</div>
		{#if onToggleSelect}
			<button
				onclick={handleToggle}
				class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 backdrop-blur transition-all {isSelected
					? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-md'
					: 'border-gray-300 bg-white/70 text-gray-400 hover:border-[var(--accent)] hover:bg-white/90'}"
				aria-label={isSelected ? 'Deselect video' : 'Select video'}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 transition-opacity {isSelected ? 'opacity-100' : 'opacity-50'}"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		{/if}
	</div>

	<!-- Content -->
	<div class="p-3">
		<h3 class="line-clamp-2 text-sm font-semibold leading-snug" title={video.title}>
			{video.title}
		</h3>
		<p class="mt-1 text-xs text-[var(--muted-foreground)]">{video.channelTitle}</p>
		
		<!-- View count -->
		<p class="mt-1 text-xs text-[var(--muted-foreground)]">
			{viewCount} views
		</p>
		
		{#if video.description}
			<p class="mt-2 line-clamp-2 text-xs text-[var(--muted-foreground)]" title={video.description}>
				{video.description}
			</p>
		{/if}
		<a
			href="https://www.youtube.com/watch?v={video.id}"
			target="_blank"
			rel="noopener noreferrer"
			class="mt-2 inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
		>
			Watch on YouTube
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-3 w-3"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"
				/>
				<path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
			</svg>
		</a>
	</div>
</article>
