import { createHash } from "crypto";
import axios from "axios";
import Library from "./src/library";
import Playlist from "./src/playlist";
import { PlaylistItem, Track } from "./src/types";

export const YTM_DOMAIN = "https://music.youtube.com";
export const YTM_BASE_API = "https://music.youtube.com/youtubei/v1/";
export const YTM_QUERY_PARAMS = "?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30"
export const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:111.0) Gecko/20100101 Firefox/111.0";

export function getContext(): any {
	return {
		context: {
			client: {
				clientName: "WEB_REMIX",
				clientVersion: "0.1",
				hl: "en",
			},
			user: {},
		}
	}
};

export function getAuthorization(sapisid: string, origin: string = "https://music.youtube.com"): string {
	const sha_1 = createHash('sha1');
	const timestamp = Math.floor(Date.now() / 1000).toString();
	sha_1.update(`${timestamp} ${sapisid} ${origin}`);
	const authorization = `SAPISIDHASH ${timestamp}_${sha_1.digest("hex")}`;
	return authorization;
}

export function getCookies(cookiesStr: string): Record<string, string> {
	cookiesStr = cookiesStr.trim();

	if (cookiesStr.length <= 0 || cookiesStr.indexOf("=") < 0) {
		return {};
	}

	const split: string[] = cookiesStr.split(";")

	const cookies:Record<string, string> = {};
	split.forEach((value) => {
		let [key, val] = value.split("=");
		cookies[key.trim()] = val.trim();
	});

	return cookies;
}

export class YtmClient {
	cookies:string = "";
	sapiSid:string|null = null;
	user:string;
	origin:string = YTM_DOMAIN;
	playlist:Playlist;
	library:Library;

	constructor(cookies: string, user: string = "0") {
		const c = getCookies(cookies);
		this.sapiSid = c["__Secure-3PAPISID"] || null;
		this.cookies = cookies;
		this.playlist = new Playlist(this);
		this.library = new Library(this);
		this.user = user;
	}

	async sendAuthorizedRequest(endpoint: string, body: Record<string, any>, additional:string = ""): Promise<any> {
		const headers = this.getHeaders();
		const url = `${YTM_BASE_API}${endpoint}${YTM_QUERY_PARAMS}&${additional}`;
		const reqBody = JSON.stringify({...body, ...getContext()});

		const response = await axios.post(
			url,
			reqBody,
			{
				headers,
			}
		);

		return response.data;
	}

	getHeaders(): Record<string, string> {
		return {
			Origin: this.origin,
			'User-Agent': USER_AGENT,
			Accept: '*/*',
			'Accept-Language': 'en-US,en;q=0.5',
			'Content-Type': 'application/json',
			'X-Goog-AuthUser': this.user,
			'x-origin': this.origin,
			cookie: this.cookies,
			authorization: this.sapiSid ? getAuthorization(this.sapiSid, this.origin) : "",
		};
	}

	/**
	 * Retrieves the playlists in the user's library.
	 *
	 * @param {number} limit optional number of playlists to retrieve. Retrieve all if not provided.
	 * @return List of owned playlists. Each item is in the following format:
	 * {
	 *     playlistId: string,
	 *     title: string,
	 *     thumbnails: [{url, width, height}],
	 *     count: number
	 * }
	 */
	async getLibraryPlaylists(limit?: number): Promise<PlaylistItem[]> {
		return await this.library.getPlaylists(limit);
	}

	/**
	 * Returns a list of playlist items
	 *
	 * @param id ID of playlist
	 * @param limit How many songs to return. 0 retrieves them all. Default: all
	 * @param related Whether to fetch 10 related playlists or not. Default: false (Not implemented)
	 * @param suggestionsLimit  How many suggestions to return. Default 0 (Not implemented)
	 * @returns
	 */
	async getPlaylist(id: string, limit: number = 0, related: boolean = false, suggestionsLimit: number = 0): Promise<any> {
		const playlist = await this.playlist.getTracks(id);

		// YouTube actually limits playlist lengths to 5,000, but we'll make it bigger.
		if (limit === 0) {
			limit = 99999999;
		}

		// Load continuations
		while (playlist.continuation && playlist.tracks.length < limit) {
			let next = await this.playlist.getTrackContinuations(id, playlist.continuation);
			playlist.tracks.push(...next.tracks);
			playlist.continuation = next.continuation;
		}

		return playlist;
	}

	/**
	 * Returns the next (up to) 100 tracks from a playlist if not all were previously returned.
	 *
	 * @param id ID of playlist
	 * @param token The continuation token from original getPlaylist call or last getPlaylistContinuations call
	 * @returns {continuation: string|undefined, tracks: Track[]}
	 */
	async getPlaylistContinuations(id: string, token: string) {
		return await this.playlist.getTrackContinuations(id, token);
	}

	/**
	 * Create new playlist
	 *
	 * @param title Title of playlist
	 * @param description Short description for playlist
	 * @param privacyStatus
	 * @param videoIds List of video ids to add to playlist
	 *
	 * @returns
	 */
	async createPlaylist(
		title: string,
		description: string,
		privacyStatus: "PRIVATE"|"PUBLIC"|"UNLISTED" = "PRIVATE",
		videoIds: string[] = [],
	): Promise<string> {
		return await this.playlist.create(title, description, privacyStatus, videoIds);
	}

	/**
	 * Add videos to a playlist
	 *
	 * @param playlistId Playlist to add to
	 * @param videoIds List of video ids to add to playlist
	 * @param sourcePlaylist Copy this playlist to playlistId
	 * @param duplicates Allow duplicate tracks
	 */
	async addPlaylistItems(
		playlistId: string,
		videoIds: string[],
		sourcePlaylist: string,
		duplicates: boolean = false,
	): Promise<boolean> {
		return await this.playlist.addTracks(playlistId, videoIds, sourcePlaylist, duplicates);
	}
}
