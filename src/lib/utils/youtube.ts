/**
 * Format ISO 8601 duration (e.g., "PT4M13S") to human-readable format (e.g., "4:13")
 * Handles hours, minutes, and seconds
 * 
 * @param duration - ISO 8601 duration string from YouTube API
 */
export function formatDuration(duration: string): string {
	if (!duration || duration === 'PT0S') return '0:00';

	// Parse ISO 8601 duration format (e.g., PT1H2M30S, PT4M13S, PT45S)
	const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	
	if (!match) return '0:00';

	const hours = parseInt(match[1] || '0', 10);
	const minutes = parseInt(match[2] || '0', 10);
	const seconds = parseInt(match[3] || '0', 10);

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	} else {
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}
}

/**
 * Format view count to human-readable format with abbreviations
 * Examples: 1234 -> "1.2K", 1234567 -> "1.2M", 1234567890 -> "1.2B"
 * 
 * @param viewCount - Number of views
 */
export function formatViewCount(viewCount: number): string {
	if (viewCount < 1000) {
		return viewCount.toString();
	}

	const units = ['', 'K', 'M', 'B'];
	let unitIndex = 0;
	let value = viewCount;

	while (value >= 1000 && unitIndex < units.length - 1) {
		value /= 1000;
		unitIndex++;
	}

	// Round to 1 decimal place
	const formatted = Math.round(value * 10) / 10;
	
	// Remove unnecessary .0
	return formatted % 1 === 0 ? `${formatted.toFixed(0)}${units[unitIndex]}` : `${formatted}${units[unitIndex]}`;
}
