import type { Location } from '$lib/types/getaway-guide';
import { randomUUID } from 'crypto';

export interface ParseResult {
	locations: Location[];
	errors: string[];
}

/**
 * Parse a vacation guide text file in the format:
 * 
 * 1. Location Name - Optional Description
 * What You'll See: ...
 * What You'll Visit: ...
 * Search Terms:
 * Search term 1
 * Search term 2
 * 
 * 2. Next Location Name
 * ...
 * 
 * @param fileContent - The raw text content of the guide file
 * @returns ParseResult with locations array and any parsing errors
 */
export function parseVacationGuide(fileContent: string): ParseResult {
	const locations: Location[] = [];
	const errors: string[] = [];

	// Split by numbered list items (e.g., "1.", "2.", "10.")
	// Match patterns like "1. " or "10. " at the start of a line
	const locationBlocks = fileContent.split(/(?=^\d+\.\s+)/gm).filter(block => block.trim());

	for (const block of locationBlocks) {
		try {
			const lines = block.split('\n').map(line => line.trim()).filter(line => line);
			
			if (lines.length === 0) continue;

			// First line should be the location name (with optional number prefix)
			const firstLine = lines[0];
			const locationNameMatch = firstLine.match(/^\d+\.\s+(.+)/);
			
			if (!locationNameMatch) {
				errors.push(`Could not parse location name from: "${firstLine}"`);
				continue;
			}

			// Extract location name (remove any " - description" suffix if desired to keep it clean)
			let locationName = locationNameMatch[1].trim();
			
			// Optional: Remove the description part after " - " to keep location name concise
			// e.g., "Vilshofen an der Donau - Oktoberfest Celebration" -> "Vilshofen an der Donau"
			const dashIndex = locationName.indexOf(' - ');
			if (dashIndex > 0) {
				locationName = locationName.substring(0, dashIndex).trim();
			}

			// Find "Search Terms:" section
			const searchTermsIndex = lines.findIndex(line => 
				line.toLowerCase().startsWith('search terms:')
			);

			if (searchTermsIndex === -1) {
				errors.push(`No "Search Terms:" section found for location: ${locationName}`);
				continue;
			}

			// Extract search terms (all lines after "Search Terms:" until end or next section)
			const searchTerms: string[] = [];
			for (let i = searchTermsIndex + 1; i < lines.length; i++) {
				const line = lines[i];
				
				// Stop if we hit another section header (What You'll See, What You'll Visit, etc.)
				if (line.match(/^(What You'll See|What You'll Visit|Search Terms):/i)) {
					break;
				}
				
				// Add non-empty lines as search terms
				if (line) {
					searchTerms.push(line);
				}
			}

			if (searchTerms.length === 0) {
				errors.push(`No search terms found for location: ${locationName}`);
				continue;
			}

			// Create location with sites (each search term becomes a site)
			const location: Location = {
				id: randomUUID(),
				name: locationName,
				sites: searchTerms.map(term => ({
					id: randomUUID(),
					name: term
				}))
			};

			locations.push(location);

		} catch (error) {
			errors.push(`Error parsing location block: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	// Add summary error if no locations were parsed
	if (locations.length === 0 && errors.length === 0) {
		errors.push('No locations found in the file. Please check the format.');
	}

	return { locations, errors };
}

/**
 * Validate file type and size before parsing
 * 
 * @param file - The uploaded file
 * @param maxSizeKB - Maximum file size in KB (default 100KB)
 * @returns Error message if invalid, null if valid
 */
export function validateGuideFile(file: File, maxSizeKB: number = 100): string | null {
	// Check file size
	if (file.size > maxSizeKB * 1024) {
		return `File too large. Maximum size is ${maxSizeKB}KB`;
	}

	// Check file type (text files)
	const allowedTypes = ['text/plain', 'text/x-plain', 'application/txt'];
	const allowedExtensions = ['.txt', '.text'];
	
	const hasValidType = allowedTypes.includes(file.type);
	const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

	if (!hasValidType && !hasValidExtension) {
		return 'Invalid file type. Please upload a .txt file';
	}

	return null;
}
