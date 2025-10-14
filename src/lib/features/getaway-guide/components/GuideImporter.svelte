<script lang="ts">
	let {
		onImportSuccess
	} = $props<{
		onImportSuccess?: () => void;
	}>();

	let isDragging = $state(false);
	let isUploading = $state(false);
	let uploadError = $state<string | null>(null);
	let uploadSuccess = $state<{ locationsAdded: number; sitesAdded: number } | null>(null);
	let fileInputElement: HTMLInputElement;

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			await uploadFile(files[0]);
		}
	}

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			await uploadFile(files[0]);
		}
	}

	async function uploadFile(file: File) {
		uploadError = null;
		uploadSuccess = null;
		isUploading = true;

		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch('/api/getaway-guide/import', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				uploadError = result.error || 'Failed to import file';
				if (result.details) {
					console.error('Import details:', result.details);
				}
				return;
			}

			uploadSuccess = {
				locationsAdded: result.locationsAdded,
				sitesAdded: result.sitesAdded
			};

			// Clear file input
			if (fileInputElement) {
				fileInputElement.value = '';
			}

			// Notify parent component
			onImportSuccess?.();

		} catch (error) {
			console.error('Upload error:', error);
			uploadError = 'An error occurred while uploading the file';
		} finally {
			isUploading = false;
		}
	}

	function triggerFileInput() {
		fileInputElement?.click();
	}

	function dismissSuccess() {
		uploadSuccess = null;
	}

	function dismissError() {
		uploadError = null;
	}
</script>

<div class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
	<h3 class="mb-2 text-lg font-semibold">Import Vacation Guide</h3>
	<p class="mb-4 text-sm text-[var(--muted-foreground)]">
		Upload a text file with numbered locations and search terms
	</p>

	<!-- Upload Area -->
	<div
		role="button"
		tabindex="0"
		class="relative rounded-lg border-2 border-dashed transition-colors {isDragging
			? 'border-[var(--accent)] bg-[var(--accent)]/5'
			: 'border-[var(--border)]'} {isUploading ? 'opacity-50 pointer-events-none' : ''}"
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
	>
		<input
			bind:this={fileInputElement}
			type="file"
			accept=".txt"
			onchange={handleFileSelect}
			class="hidden"
			disabled={isUploading}
		/>

		<button
			onclick={triggerFileInput}
			disabled={isUploading}
			class="w-full p-8 text-center transition-colors hover:bg-[var(--muted)]/50 disabled:cursor-not-allowed"
		>
			{#if isUploading}
				<svg
					class="mx-auto h-12 w-12 animate-spin text-[var(--accent)]"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<p class="mt-2 text-sm text-[var(--muted-foreground)]">Uploading...</p>
			{:else}
				<svg
					class="mx-auto h-12 w-12 text-[var(--muted-foreground)]"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
					/>
				</svg>
				<p class="mt-2 text-sm font-medium">
					{isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
				</p>
				<p class="mt-1 text-xs text-[var(--muted-foreground)]">
					Text files (.txt) up to 100KB
				</p>
			{/if}
		</button>
	</div>

	<!-- Success Message -->
	{#if uploadSuccess}
		<div class="mt-4 rounded-md border border-green-600 bg-green-50 p-4 dark:bg-green-950/30">
			<div class="flex items-start justify-between">
				<div class="flex items-start gap-2">
					<svg
						class="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400"
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
					<div>
						<p class="text-sm font-medium text-green-800 dark:text-green-200">
							Successfully imported {uploadSuccess.locationsAdded} locations with {uploadSuccess.sitesAdded} search terms
						</p>
					</div>
				</div>
				<button
					onclick={dismissSuccess}
					aria-label="Dismiss success message"
					class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
				>
					<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<!-- Error Message -->
	{#if uploadError}
		<div class="mt-4 rounded-md border border-red-600 bg-red-50 p-4 dark:bg-red-950/30">
			<div class="flex items-start justify-between">
				<div class="flex items-start gap-2">
					<svg
						class="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
					<div>
						<p class="text-sm font-medium text-red-800 dark:text-red-200">{uploadError}</p>
					</div>
				</div>
				<button
					onclick={dismissError}
					aria-label="Dismiss error message"
					class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
				>
					<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<!-- Format Help -->
	<details class="mt-4">
		<summary class="cursor-pointer text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
			Expected file format
		</summary>
		<div class="mt-2 rounded-md bg-[var(--muted)] p-3 text-xs">
			<pre class="whitespace-pre-wrap font-mono">1. Location Name - Optional Description
What You'll See: ...
What You'll Visit: ...
Search Terms:
Search term 1
Search term 2
Search term 3

2. Next Location Name
Search Terms:
Another search term
...</pre>
		</div>
	</details>
</div>
