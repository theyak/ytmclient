import { YtmClient } from "..";
import { PlaylistItem } from "./types";
import { nav } from "./utils";
export default class Library {
	client: YtmClient;

	constructor(client: YtmClient) {
		this.client = client;
	}

	async getPlaylists(limit?: number): Promise<PlaylistItem[]> {
		let lists:PlaylistItem[] = [];
		const body = { browseId: "FEmusic_liked_playlists" };
		const response = await this.client.sendAuthorizedRequest("browse", body);
		const obj = response.
			contents?.
			singleColumnBrowseResultsRenderer?.
			tabs[0]?.
			tabRenderer?.
			content?.
			sectionListRenderer?.
			contents[0]?.
			gridRenderer;
		if (obj && Array.isArray(obj.items)) {
			// First item is new playlist, skip it.
			obj.items.shift();

			lists = obj.items.map((item: any) => {
				// Look for count of songs which is provided via a label like "6 songs".
				let count = 0;
				const subtitles = item?.musicTwoRowItemRenderer?.subtitle?.runs;
				if (Array.isArray(subtitles)) {
					for (let i = 0; i < subtitles.length; i++) {
						const text = subtitles[i].text.trim();
						const match = text.match(/^([\d,]+)\s+\w+/);
						if (match && match.length > 1) {
							count = match[1];
							break;
						}
					}
				}

				return {
					playlistId: item?.musicTwoRowItemRenderer?.navigationEndpoint?.browseEndpoint?.browseId,
					title: item?.musicTwoRowItemRenderer?.title?.runs[0]?.text,
					thumbnails: item?.musicTwoRowItemRenderer?.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails,
					count,
				} as PlaylistItem;
			});

			// TODO: Figure out how to get lots and lots of playlists. I don't have enough
			// to figure that out.
			const continuation = nav(obj, "continuations.0.nextContinuationData.continuation", "");
			if (continuation) {
				const more = await this.getPlaylistsContinuation(continuation);
				lists = lists.concat(more);
			}
		}

		return lists;
	}


	async getPlaylistsContinuation(token: string): Promise<any> {
		const response = await this.client.sendAuthorizedRequest('browse', { continuation: token });

		const obj = nav(response, "continuationContents.gridContinuation", { items: [] });

		if (obj.items) {
			const lists = obj.items.map((item: any) => {
				// Look for count of songs which is provided via a label like "6 songs".
				let count = 0;
				const subtitles = item?.musicTwoRowItemRenderer?.subtitle?.runs;
				if (Array.isArray(subtitles)) {
					for (let i = 0; i < subtitles.length; i++) {
						const text = subtitles[i].text.trim();
						const match = text.match(/^([\d,]+)\s+\w+/);
						if (match && match.length > 1) {
							count = match[1];
							break;
						}
					}
				}

				return {
					playlistId: item?.musicTwoRowItemRenderer?.navigationEndpoint?.browseEndpoint?.browseId,
					title: item?.musicTwoRowItemRenderer?.title?.runs[0]?.text,
					thumbnails: item?.musicTwoRowItemRenderer?.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails,
					count,
				} as PlaylistItem;
			});

			return lists;
		}

		return [];
	}
}