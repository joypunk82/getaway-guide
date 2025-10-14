<script lang="ts">
	let {
		onSubmit,
		submitLabel = 'Add Location',
		initialValue = ''
	} = $props<{
		onSubmit: (name: string) => void;
		submitLabel?: string;
		initialValue?: string;
	}>();

	let locationName = $state(initialValue);
	let isSubmitting = $state(false);
	
	const isValid = $derived(locationName.trim().length > 0);
	const canSubmit = $derived(isValid && !isSubmitting);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!locationName.trim() || isSubmitting) return;

		isSubmitting = true;
		try {
			await onSubmit(locationName.trim());
			locationName = '';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex gap-2">
	<div class="flex-1">
		<label class="sr-only" for="location-name">Location name</label>
		<input
			id="location-name"
			type="text"
			bind:value={locationName}
			placeholder="Enter location name (e.g., Paris)"
			required
			maxlength="100"
			class="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
			disabled={isSubmitting}
		/>
	</div>
	<button
		type="submit"
		disabled={!canSubmit}
		class="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:shadow-[var(--shadow-sm)] disabled:opacity-50"
	>
		{submitLabel}
	</button>
</form>

