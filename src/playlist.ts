import { YtmClient } from "..";
import { Playlist as PlaylistDTO, Track, Album, Artist, LikeStatus } from "./types";
import { parseDuration, nav } from "./utils";
import * as util from "util";
import * as fs from "fs";
import logger from "./logger";

export default class Playlist {
	client: YtmClient;

	constructor(client: YtmClient) {
		this.client = client;
	}

	async getTracks(browseId: string): Promise<PlaylistDTO> {

		if (!browseId.toUpperCase().startsWith("VL")) {
			browseId = "VL" + browseId;
		}

		const body = {
            browseId,
            browseEndpointContextSupportedConfigs: {
                browseEndpointContextMusicConfig: {
                    pageType: "MUSIC_PAGE_TYPE_PLAYLIST"
                }
            }
        };

		const response = await this.client.sendAuthorizedRequest("browse", body);

		const tracksObj: any[] = nav(response, `
			contents.
			singleColumnBrowseResultsRenderer.
			tabs.0.
			tabRenderer.
			content.
			sectionListRenderer.
			contents.0.
			musicPlaylistShelfRenderer.
			contents
		`);

		const meta = this.parsePlaylistResponse(browseId, response);
		const tracks = this.parseTrackResponse(tracksObj);

		return {
			...meta,
			tracks,
		};
	}

	async getTrackContinuations(browseId: string, continueToken: string): Promise<any> {
		if (!browseId.toUpperCase().startsWith("VL")) {
			browseId = "VL" + browseId;
		}

		const body = {
            browseId,
            browseEndpointContextSupportedConfigs: {
                browseEndpointContextMusicConfig: {
                    pageType: "MUSIC_PAGE_TYPE_PLAYLIST"
                }
            }
        };

		const additional = `ctoken=${continueToken}&continuation=${continueToken}&type=next`;
		const response = await this.client.sendAuthorizedRequest("browse", body, additional);

		const tracksObj: any[] = nav(response, `
			continuationContents.
			musicPlaylistShelfContinuation.
			contents
		`);

		const continuation = nav(response, `
			continuationContents.
			musicPlaylistShelfContinuation.
			continuations.0.
			nextContinuationData.
			continuation
		`);

		const tracks = this.parseTrackResponse(tracksObj);

		return {
			continuation,
			tracks,
		}
	}

	/**
	 * Create new playlist
	 *
	 * @returns
	 */
	async create(
		title: string,
		description: string = "",
		privacyStatus: "PUBLIC"|"PRIVATE"|"UNLISTED" = "PRIVATE",
		videoIds: string[] = [],
	): Promise<any> {

		if (["PUBLIC", "PRIVATE", "UNLISTED"].indexOf(privacyStatus) < 0) {
			return "Error";
		}

		const body: any = {
			title,
			description,
			privacyStatus,
		};

		if (Array.isArray(videoIds) && videoIds.length > 0) {
			body.videoIds = videoIds;
		}

		try {
			const response = await this.client.sendAuthorizedRequest("playlist/create", body);
			return {
				success: true,
				playlistId: response.playlistId,
			};
		} catch (error: any) {
			if (error.response) {
				return {
					success: false,
					error: error.response.data.error.message,
				};
			} else if (error.request) {
				return {
					success: false,
				}
			} else {
				return {
					success: false,
					error: error.message,
				}
			}
		}
	}

	async addTracks(
		playlistId: string,
		videoIds: string[],
		sourcePlaylist: string,
		duplicates: boolean = false
	): Promise<boolean> {
		const body: any = {
			playlistId,
			actions: [],
		}

		if (Array.isArray(videoIds) && videoIds.length > 0) {
			for (let videoId of videoIds) {
				const action: Record<string, string> = {
					action: "ACTION_ADD_VIDEO",
					addedVideoId: videoId,
				};
				if (duplicates) {
					action.dedupeOption = 'DEDUPE_OPTION_SKIP';
				}
				body.actions.push(action);
			}
		}

		if (sourcePlaylist) {
			const action = {
				action: "ACTION_ADD_PLAYLIST",
				addedFullListId: sourcePlaylist,
			};
			body.actions.push(action);

			// add an empty ACTION_ADD_VIDEO because otherwise
        	// YTM doesn't return the dict that maps videoIds to their new setVideoIds
			if (!Array.isArray(videoIds) || videoIds.length <= 0) {
				body.actions.push({
					action: "ACTION_ADD_VIDEO",
					addedVideoId: null,
				});
			}
		}

		const response = await this.client.sendAuthorizedRequest("browse/edit_playlist", body);

		if (response.status === "SUCCEEDED") {
			return true;
		}

		return false;
	}

	parsePlaylistResponse(id: string, response: any): any {

		const isOwnPlaylist = !!nav(response, "header.musicEditablePlaylistDetailHeaderRenderer");

		let privacy = "";
		let header = {};
		if (isOwnPlaylist) {
			header = nav(response, "header.musicEditablePlaylistDetailHeaderRenderer.header.musicDetailHeaderRenderer");
			privacy = nav(response, "header.musicEditablePlaylistDetailHeaderRenderer.editHeader.musicPlaylistEditHeaderRenderer.privacy");
		} else {
			header = nav(response, "header.musicDetailHeaderRenderer");
			privacy = "PUBLIC";
		}

        const runCount = nav(header, "subtitle.runs").length;
		let author = {};
		if (runCount > 1) {
			author = {
				id: nav(header, "subtitle.runs.2.navigationEndpoint.browseEndpoint.browseId"),
				name: nav(header, "subtitle.runs.2.text"),
			}
		}
		const year = runCount === 5 ? nav(header, "subtitle.runs.4.text") : "";

		let trackCount = 0;
		let views = 0;
		let duration = "";

		const runs = nav(header, "secondSubtitle.runs");

		if (runs.length >= 5) {
			trackCount = parseInt(nav(header, "secondSubtitle.runs.2.text").replace(/\D/g,''));
			views = nav(header, "secondSubtitle.runs.0.text");
			duration = nav(header, "secondSubtitle.runs.4.text");
		} else {
			trackCount = parseInt(nav(header, "secondSubtitle.runs.0.text").replace(/\D/g,''));
			duration = nav(header, "secondSubtitle.runs.2.text");
		}

		const continuation: any[] = nav(response, `
			contents.
			singleColumnBrowseResultsRenderer.
			tabs.0.
			tabRenderer.
			content.
			sectionListRenderer.
			contents.0.
			musicPlaylistShelfRenderer.
			continuations.0.
			nextContinuationData.
			continuation
		`);

		const meta = {
			id,
			title: nav(header, "title.runs.0.text"),
			privacy,
			description: nav(header, "description.runs.0.text"),
			thumbnails: nav(header, "thumbnail.croppedSquareThumbnailRenderer.thumbnail.thumbnails"),
			isOwnPlaylist,
			author,
			year,
			trackCount,
			views,
			duration,
			continuation,
		};

		return meta;
	}

	parseTrackResponse(obj: any): any {
		let tracks: Track[] = [];

		if (obj && Array.isArray(obj)) {
			for (let i = 0; i < obj.length; i++) {
				const trackObj: {musicResponsiveListItemRenderer: any} = obj[i];
				const renderer = trackObj.musicResponsiveListItemRenderer;

				if (!renderer) {
					continue;
				}
				const menu = renderer.menu?.menuRenderer;
				const fixed = renderer.fixedColumns;
				const flex = renderer.flexColumns;
				const overlay = renderer.overlay.musicItemThumbnailOverlayRenderer;

				let videoId: string = "";
				let setVideoId: string|undefined = void 0;
				let likeStatus: LikeStatus = "INDIFFERENT";
				let feedbackTokens:{add: string, remove: string}|undefined = void 0;
				const thumbnails = nav(renderer, "thumbnail.musicThumbnailRenderer.thumbnail.thumbnails")
				const title = nav(flex, "0.musicResponsiveListItemFlexColumnRenderer.text.runs.0.text");

				// Go through menu items - I'm not really sure what this is for but it's in sigma67/ytmusicapi
				// so I'm keeping it in. I can see that it does set the videoId attribute for some videos
				// that aren't available.

				if (menu) {
					for (let i = 0; i < menu.items.length; i++) {
						const item = menu.items[i];
						setVideoId = nav(item, "menuServiceItemRenderer.serviceEndpoint.playlistEditEndpoint.actions.0.setVideoId");
						videoId = nav(item, "menuServiceItemRenderer.serviceEndpoint.playlistEditEndpoint.actions.0.removedVideoId");
						if (item.toggleMenuServiceItemRenderer) {
							const toggle = item.toggleMenuServiceItemRenderer;
							const serviceType = toggle.defaultIcon?.iconType;
							let addToken = toggle.defaultServiceEndpoint?.feedbackEndpoint?.feedbackTokens;
							let removeToken = toggle.toggledServiceEndpoint?.feedbackEndpoint?.feedbackTokens;
							if (serviceType === "LIBRARY_REMOVE") {
								feedbackTokens = {add: removeToken, remove: addToken};
							} else {
								feedbackTokens = {add: addToken, remove: removeToken};
							}
						}
					}
				}

				// Another way to get video id - this time for playable videos
				if (overlay?.content?.musicPlayButtonRenderer) {
					const endpoint = overlay.content.musicPlayButtonRenderer.playNavigationEndpoint;
					if (endpoint) {
						videoId = endpoint.watchEndpoint.videoId;
					}
				}

				// Artists - There can be 0, 1, or more than 1.
				// Fun fact. Not all artists have artist IDs. Because why should they? Stupid YouTube.
				const artists: Artist[] = [];
				const artistsObj: any[] = nav(flex, "1.musicResponsiveListItemFlexColumnRenderer.text.runs");
				if (Array.isArray(artistsObj)) {
					for (const artistObj of artistsObj) {
						const id:string = artistObj.navigationEndpoint?.browseEndpoint?.browseId.trim();
						const name:string = artistObj.text.trim();
						artists.push({id, name});
					}
				}

				// Album - There can be 0 or 1.
				let album: Album|undefined;
				let albumObj: any = nav(flex, "2.musicResponsiveListItemFlexColumnRenderer.text.runs.0");
				if (albumObj) {
					const id:string = albumObj.navigationEndpoint?.browseEndpoint?.browseId?.trim();
					const name:string = albumObj.text.trim();
					album = {id, name};
				}

				// Duration
				let duration = "0";
				if (fixed) {
					const durationObj = nav(fixed, "0.musicResponsiveListItemFixedColumnRenderer.text");
					if (durationObj) {
						duration = durationObj.simpleText || durationObj.runs[0].text;
					}
				}

				// Available?
				const isAvailable = renderer.musicItemRendererDisplayPolicy !== "MUSIC_ITEM_RENDERER_DISPLAY_POLICY_GREY_OUT";
				const isLicensed = !!menu;

				// Explicit?
				const isExplicit = !!nav(renderer, "badges.0.musicInlineBadgeRenderer.accessibilityData.accessibilityData.label");

				// Like status.
				// Did you know you can't like songs that YouTube Music deems made for kids?
				if (isAvailable && menu.topLevelButtons) {
					likeStatus = menu.topLevelButtons[0].likeButtonRenderer?.likeStatus || "INDIFFERENT";
				}

				// Video type
				let videoType:string|undefined = menu && nav(menu, `
					items.0.
					menuNavigationItemRenderer.
					navigationEndpoint.
					watchEndpoint.
					watchEndpointMusicSupportedConfigs.
					watchEndpointMusicConfig.
					musicVideoType
				`);

				const track: Track = {
					videoId,
					title,
					artists,
					album,
					likeStatus,
					thumbnails,
					isAvailable,
					isLicensed,
					isExplicit,
					videoType,
					duration,
					durationSeconds: parseDuration(duration),
					feedbackTokens,
					setVideoId,
				};
				tracks.push(track);
			}
		}

		return tracks;
	}
}
