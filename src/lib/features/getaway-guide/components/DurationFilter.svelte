<script lang="ts">
	import { formatSecondsToDuration } from '$lib/utils/youtube';

	interface Props {
		minDuration: number | null; // null means no minimum
		maxDuration: number | null; // null means no maximum
		onFilterChange: (min: number | null, max: number | null) => void;
		totalVideos: number;
		filteredVideos: number;
	}

	let {
		minDuration = null,
		maxDuration = null,
		onFilterChange,
		totalVideos,
		filteredVideos
	} = $props<Props>();

	// Duration ranges in seconds - covering typical YouTube video lengths
	const MIN_SECONDS = 0;
	const MAX_SECONDS = 7200; // 2 hours
	const STEP = 30; // 30 second increments

	// Slider values (0 = "no limit", 1+ = actual seconds)
	let minSliderValue = $state(minDuration ? Math.max(1, Math.floor(minDuration / STEP)) : 0);
	let maxSliderValue = $state(
		maxDuration ? Math.max(1, Math.floor(maxDuration / STEP)) : Math.floor(MAX_SECONDS / STEP)
	);

	// Convert slider values to actual duration values
	const actualMinDuration = $derived(minSliderValue === 0 ? null : minSliderValue * STEP);
	const actualMaxDuration = $derived(
		maxSliderValue === Math.floor(MAX_SECONDS / STEP) ? null : maxSliderValue * STEP
	);

	// Format labels for display
	const minLabel = $derived(
		actualMinDuration ? formatSecondsToDuration(actualMinDuration) : 'No min'
	);
	const maxLabel = $derived(
		actualMaxDuration ? formatSecondsToDuration(actualMaxDuration) : 'No max'
	);

	// Update filters when slider values change
	$effect(() => {
		onFilterChange(actualMinDuration, actualMaxDuration);
	});

	// Ensure min is always less than max
	function handleMinChange() {
		if (minSliderValue >= maxSliderValue && maxSliderValue < Math.floor(MAX_SECONDS / STEP)) {
			maxSliderValue = minSliderValue + 1;
		}
	}

	function handleMaxChange() {
		if (maxSliderValue <= minSliderValue && minSliderValue > 0) {
			minSliderValue = maxSliderValue - 1;
		}
	}

	const maxSliderSteps = Math.floor(MAX_SECONDS / STEP);
</script>

<div class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-sm font-medium">Filter by Duration</h3>
		<p class="text-xs text-[var(--muted-foreground)]">
			Showing {filteredVideos} of {totalVideos} videos
		</p>
	</div>

	<div class="space-y-4">
		<!-- Range Labels -->
		<div class="flex justify-between text-xs text-[var(--muted-foreground)]">
			<span>{minLabel}</span>
			<span>{maxLabel}</span>
		</div>

		<!-- Dual Range Slider -->
		<div class="relative">
			<!-- Track -->
			<div class="h-2 rounded-full bg-[var(--muted)]"></div>

			<!-- Active range -->
			<div
				class="absolute top-0 h-2 rounded-full bg-[var(--accent)]"
				style:left="{(minSliderValue / maxSliderSteps) * 100}%"
				style:width="{((maxSliderValue - minSliderValue) / maxSliderSteps) * 100}%"
			></div>

			<!-- Min slider -->
			<input
				type="range"
				min="0"
				max={maxSliderSteps}
				step="1"
				bind:value={minSliderValue}
				oninput={handleMinChange}
				onfocus={() => (minSliderValue = minSliderValue)} 
				style:z-index={minSliderValue > maxSliderValue - 10 ? 20 : 10}
				class="min-slider absolute top-0 h-2 w-full cursor-pointer appearance-none bg-transparent focus:outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:shadow-[var(--shadow)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[var(--accent)] [&::-moz-range-thumb]:transition-all"
			/>

			<!-- Max slider -->
			<input
				type="range"
				min="0"
				max={maxSliderSteps}
				step="1"
				bind:value={maxSliderValue}
				oninput={handleMaxChange}
				onfocus={() => (maxSliderValue = maxSliderValue)}
				style:z-index={maxSliderValue < minSliderValue + 10 ? 20 : 10}
				class="max-slider absolute top-0 h-2 w-full cursor-pointer appearance-none bg-transparent focus:outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:shadow-[var(--shadow-lg)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--accent)] [&::-moz-range-thumb]:transition-all"
			/>
		</div>

		<!-- Preset buttons -->
		<div class="flex flex-wrap gap-2">
			<button
				onclick={() => {
					minSliderValue = 0;
					maxSliderValue = maxSliderSteps;
				}}
				class="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:shadow-[var(--shadow-sm)]"
			>
				All
			</button>
			<button
				onclick={() => {
					minSliderValue = 0;
					maxSliderValue = Math.floor(300 / STEP);
				}}
				class="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:shadow-[var(--shadow-sm)]"
			>
				&lt; 5 min
			</button>
			<button
				onclick={() => {
					minSliderValue = Math.floor(300 / STEP);
					maxSliderValue = Math.floor(900 / STEP);
				}}
				class="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:shadow-[var(--shadow-sm)]"
			>
				5-15 min
			</button>
			<button
				onclick={() => {
					minSliderValue = Math.floor(900 / STEP);
					maxSliderValue = maxSliderSteps;
				}}
				class="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:shadow-[var(--shadow-sm)]"
			>
				&gt; 15 min
			</button>
		</div>
	</div>
</div>
