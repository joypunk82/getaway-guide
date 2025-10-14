import { z } from 'zod';

export const siteSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1, 'Site name is required').max(100)
});

export const locationSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1, 'Location name is required').max(100),
	sites: z.array(siteSchema).min(1, 'At least one site is required')
});

export const createLocationSchema = z.object({
	name: z.string().min(1, 'Location name is required').max(100)
});

export const addSiteSchema = z.object({
	locationId: z.string().min(1),
	siteName: z.string().min(1, 'Site name is required').max(100)
});

export const searchVideosSchema = z.object({
	locationId: z.string().min(1),
	maxResultsPerSite: z.number().int().min(1).max(5).default(2)
});

export const createPlaylistSchema = z.object({
	title: z.string().min(1, 'Playlist title is required').max(150),
	description: z.string().max(5000).optional(),
	videoIds: z.array(z.string()).min(1, 'At least one video is required')
});

export type LocationInput = z.infer<typeof locationSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type AddSiteInput = z.infer<typeof addSiteSchema>;
export type SearchVideosInput = z.infer<typeof searchVideosSchema>;
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
