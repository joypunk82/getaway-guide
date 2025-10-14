<script lang="ts">
	let {
		locationId,
		locationName,
		onSubmit,
		onCancel
	} = $props<{
		locationId: string;
		locationName: string;
		onSubmit: (locationId: string, siteName: string) => void;
		onCancel: () => void;
	}>();

	let siteName = $state('');
	let isSubmitting = $state(false);
	
	const isValid = $derived(siteName.trim().length > 0);
	const canSubmit = $derived(isValid && !isSubmitting);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!siteName.trim() || isSubmitting) return;

		isSubmitting = true;
		try {
			await onSubmit(locationId, siteName.trim());
			// Clear the input but keep the form open for adding more sites
			siteName = '';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow)]">
	<h3 class="mb-3 text-sm font-semibold">Add Site to {locationName}</h3>
	<form onsubmit={handleSubmit} class="space-y-3">
		<div>
			<label class="mb-1 block text-xs font-medium" for="site-name">Site Name</label>
			<input
				id="site-name"
				type="text"
				bind:value={siteName}
				placeholder="e.g., Eiffel Tower, Louvre Museum"
				required
				maxlength="100"
				class="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
				disabled={isSubmitting}
			/>
		</div>
		<div class="flex gap-2">
			<button
				type="submit"
				disabled={!canSubmit}
				class="rounded-md bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-[var(--accent-foreground)] hover:shadow-[var(--shadow-sm)] disabled:opacity-50"
			>
				{isSubmitting ? 'Adding...' : 'Add Site'}
			</button>
			<button
				type="button"
				onclick={onCancel}
				disabled={isSubmitting}
				class="rounded-md border border-[var(--border)] px-4 py-1.5 text-sm hover:shadow-[var(--shadow-sm)] disabled:opacity-50"
			>
				Done
			</button>
		</div>
	</form>
</div>
