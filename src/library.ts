import { YtmClient } from "..";
import { PlaylistItem } from "./types";

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
			gridRenderer?.
			items;
		if (obj && Array.isArray(obj)) {
			// First item is new playlist, skip it.
			obj.shift();

			lists = obj.map((item) => {
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
		}

		return lists;
	}
}