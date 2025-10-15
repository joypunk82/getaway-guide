// Video selection state management with localStorage persistence
import { browser } from '$app/environment';

const STORAGE_KEY = 'getaway-guide-selections';

interface VideoSelections {
	selectedVideoIds: string[];
	playlistTitle: string;
	playlistDescription: string;
}

export class VideoSelectionsManager {
	private selections: VideoSelections = {
		selectedVideoIds: [],
		playlistTitle: 'My Vacation Playlist',
		playlistDescription: ''
	};

	constructor() {
		if (browser) {
			this.loadFromStorage();
		}
	}

	private loadFromStorage() {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				this.selections = { ...this.selections, ...JSON.parse(stored) };
			}
		} catch (error) {
			console.warn('Failed to load video selections from storage:', error);
		}
	}

	private saveToStorage() {
		if (browser) {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(this.selections));
			} catch (error) {
				console.warn('Failed to save video selections to storage:', error);
			}
		}
	}

	getSelectedVideoIds(): string[] {
		return [...this.selections.selectedVideoIds];
	}

	isVideoSelected(videoId: string): boolean {
		return this.selections.selectedVideoIds.includes(videoId);
	}

	toggleVideo(videoId: string, selected: boolean) {
		if (selected) {
			if (!this.selections.selectedVideoIds.includes(videoId)) {
				this.selections.selectedVideoIds.push(videoId);
			}
		} else {
			const index = this.selections.selectedVideoIds.indexOf(videoId);
			if (index > -1) {
				this.selections.selectedVideoIds.splice(index, 1);
			}
		}
		this.saveToStorage();
	}

	selectAllVideos(videoIds: string[]) {
		for (const videoId of videoIds) {
			if (!this.selections.selectedVideoIds.includes(videoId)) {
				this.selections.selectedVideoIds.push(videoId);
			}
		}
		this.saveToStorage();
	}

	deselectAllVideos(videoIds: string[]) {
		this.selections.selectedVideoIds = this.selections.selectedVideoIds.filter(
			(id) => !videoIds.includes(id)
		);
		this.saveToStorage();
	}

	setPlaylistInfo(title: string, description: string) {
		this.selections.playlistTitle = title;
		this.selections.playlistDescription = description;
		this.saveToStorage();
	}

	getPlaylistInfo() {
		return {
			title: this.selections.playlistTitle,
			description: this.selections.playlistDescription
		};
	}

	clear() {
		this.selections = {
			selectedVideoIds: [],
			playlistTitle: 'My Vacation Playlist',
			playlistDescription: ''
		};
		if (browser) {
			localStorage.removeItem(STORAGE_KEY);
		}
	}

	getSelectionCount(): number {
		return this.selections.selectedVideoIds.length;
	}
}

// Singleton instance
export const videoSelections = new VideoSelectionsManager();
