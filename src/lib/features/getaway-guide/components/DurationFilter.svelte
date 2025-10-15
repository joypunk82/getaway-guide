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

	// Weighted duration scale: 30s increments up to 20min, then 5min increments up to 2hrs
	const TWENTY_MINUTES = 20 * 60; // 1200 seconds
	const TWO_HOURS = 2 * 60 * 60; // 7200 seconds

	// Create duration breakpoints array
	function createDurationBreakpoints(): number[] {
		const breakpoints: number[] = [0]; // Start with 0 (no minimum)

		// 30-second increments from 0 to 20 minutes (40 steps)
		for (let i = 30; i <= TWENTY_MINUTES; i += 30) {
			breakpoints.push(i);
		}

		// 5-minute increments from 25 minutes to 2 hours (21 steps)
		for (let i = TWENTY_MINUTES + 300; i <= TWO_HOURS; i += 300) {
			breakpoints.push(i);
		}

		return breakpoints;
	}

	const durationBreakpoints = createDurationBreakpoints();
	const maxSliderSteps = durationBreakpoints.length - 1;

	// Convert duration (seconds) to slider position
	function durationToSliderValue(duration: number | null): number {
		if (duration === null || duration === 0) return 0;

		// Find the closest breakpoint
		for (let i = 1; i < durationBreakpoints.length; i++) {
			if (duration <= durationBreakpoints[i]) {
				return i;
			}
		}
		return maxSliderSteps;
	}

	// Convert slider position to duration (seconds)
	function sliderValueToDuration(sliderValue: number): number | null {
		if (sliderValue === 0) return null; // "No minimum"
		if (sliderValue >= durationBreakpoints.length) return null; // "No maximum"
		return durationBreakpoints[sliderValue];
	}

	// Initialize slider values based on props
	let minSliderValue = $state(durationToSliderValue(minDuration));
	let maxSliderValue = $state(maxDuration ? durationToSliderValue(maxDuration) : maxSliderSteps);

	// Convert slider values to actual duration values
	const actualMinDuration = $derived(sliderValueToDuration(minSliderValue));
	const actualMaxDuration = $derived(
		maxSliderValue === maxSliderSteps ? null : sliderValueToDuration(maxSliderValue)
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
		if (minSliderValue >= maxSliderValue && maxSliderValue < maxSliderSteps) {
			maxSliderValue = minSliderValue + 1;
		}
	}

	function handleMaxChange() {
		if (maxSliderValue <= minSliderValue && minSliderValue > 0) {
			minSliderValue = maxSliderValue - 1;
		}
	}
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
					maxSliderValue = durationToSliderValue(300); // 5 minutes
				}}
				class="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:shadow-[var(--shadow-sm)]"
			>
				&lt; 5 min
			</button>
			<button
				onclick={() => {
					minSliderValue = durationToSliderValue(300); // 5 minutes
					maxSliderValue = durationToSliderValue(900); // 15 minutes
				}}
				class="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:shadow-[var(--shadow-sm)]"
			>
				5-15 min
			</button>
			<button
				onclick={() => {
					minSliderValue = durationToSliderValue(900); // 15 minutes
					maxSliderValue = maxSliderSteps;
				}}
				class="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:shadow-[var(--shadow-sm)]"
			>
				&gt; 15 min
			</button>
		</div>
	</div>
</div>
