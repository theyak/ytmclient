import { YtmClient } from "..";
import { Track, Album, Artist, LikeStatus } from "./types";
import { parseDuration, nav } from "./utils";

export default class Playlist {
	client: YtmClient;

	constructor(client: YtmClient) {
		this.client = client;
	}

	async getTracks(browseId: string, continueToken?: string): Promise<any[]> {

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

		const additional = continueToken ? `ctoken=${continueToken}&continuation=${continueToken}` : "";
		const response = await this.client.sendAuthorizedRequest("browse", body, additional);
		const tracks = this.parseTrackResponse(response);

		return tracks;
	}

	async create(): Promise<boolean> {
		return true;
	}

	async addTracks(): Promise<boolean> {
		return true;
	}

	parseTrackResponse(response: any): any {
		let tracks: Track[] = [];
		const obj: any[] = nav(response, `
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

		if (obj && Array.isArray(obj)) {
			for (let i = 0; i < obj.length; i++) {
				const trackObj: {musicResponsiveListItemRenderer: any} = obj[i];
				const renderer = trackObj.musicResponsiveListItemRenderer;

				if (!renderer) {
					continue;
				}

				const menu = renderer.menu.menuRenderer;
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
				// so I'm keeping it in. I can see that it does set the videoId attribute for videos
				// that aren't available.
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
				const durationObj = nav(fixed, "0.musicResponsiveListItemFixedColumnRenderer.text");
				const duration = durationObj.simpleText || durationObj.runs[0].text;

				// Available?
				const isAvailable = renderer.musicItemRendererDisplayPolicy !== "MUSIC_ITEM_RENDERER_DISPLAY_POLICY_GREY_OUT";

				// Explicit?
				const isExplicit = !!nav(renderer, "badges.0.musicInlineBadgeRenderer.accessibilityData.accessibilityData.label");

				// Like status.
				// Did you know you can't like songs that YouTube Music deems made for kids?
				if (isAvailable && menu.topLevelButtons) {
					likeStatus = menu.topLevelButtons[0].likeButtonRenderer?.likeStatus || "INDIFFERENT";
				}

				// Video type
				let videoType:string|undefined = nav(menu, `
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
					isExplicit,
					videoType,
					duration,
					durationSeconds: parseDuration(duration),
					feedbackTokens,
				};
				tracks.push(track);
				// console.log(track);
			}
		}

		return tracks;
	}
}
