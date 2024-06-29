import { YtmClient } from "..";
import { Playlist as PlaylistDTO, Track, Album, Artist, LikeStatus } from "./types";
import { parseDuration, nav } from "./utils";
import * as util from "util";
import * as fs from "fs";
import logger from "./logger";

export default class Browsing {
	client: YtmClient;

	constructor(client: YtmClient) {
		this.client = client;
	}

    /**
     * Get information about the authorized account.
     */
	async getAccount(): Promise<Object>
	{
		const body = {}
		const response = await this.client.sendAuthorizedRequest("account/account_menu", body);
		const renderer = nav(response, "actions.0.openPopupAction.popup.multiPageMenuRenderer");
		const header = nav(renderer, "header.activeAccountHeaderRenderer");
		const sections = nav(renderer, "sections.0.multiPageMenuSectionRenderer");

		const accountName = nav(header, "accountName.runs.0.text", null);
		const thumbnails = nav(header, "accountPhoto.thumbnails", []);
		const channelHandle = nav(header, "channelHandle.runs.0.text", null);
		const channelId = nav(sections, "items.0.compactLinkRenderer.navigationEndpoint.browseEndpoint.browseId", null);
		const isPremium = nav(sections, "items.1.compactLinkRenderer.icon.iconType", null) === "MONETIZATION_ON";

		return {
			accountName,
			channelHandle,
			channelId,
			thumbnails,
			isPremium
		};
	}

	/**
	 * Returns metadata and streaming information about a song or video.
	 *
	 * @param videoId Video id
	 * @param signatureTimestamp Provide the current YouTube signatureTimestamp.
	 *    If not provided a default value will be used, which might result in invalid streaming URLs
	 * @returns Object with all sorts of track data. Log it to view. It's insane.
	 */
	async getSong(videoId: string, signatureTimestamp: number|null = null): Promise<Object> {
		if (!signatureTimestamp) {
			const epoch = new Date("1969-12-31");
			const today = new Date();
			const difference = today.getTime() - epoch.getTime();
			const days = Math.floor(difference / (1000 * 60 * 60 * 24));
			signatureTimestamp = days - 1;
		}

		const body = {
			playbackContext: {
				contentPlaybackContext: {
					signatureTimestamp,
				},
			},
			video_id: videoId,
		};

		const response = await this.client.sendAuthorizedRequest("player", body);

		return response;
	}
}
