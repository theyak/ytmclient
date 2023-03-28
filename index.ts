import { createHash } from "crypto";
import axios from "axios";
import Library from "./src/library";
import Playlist from "./src/playlist";
import { IPlaylist } from "./src/types";

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
	origin:string = YTM_DOMAIN;
	playlist:Playlist;
	library:Library;

	constructor(cookies: string, user: string = "0") {
		const c = getCookies(cookies);
		this.sapiSid = c["__Secure-3PAPISID"] || null;
		this.cookies = cookies;
		this.playlist = new Playlist(this);
		this.library = new Library(this);
	}

	async sendAuthorizedRequest(endpoint: string, body: Record<string, any>, additional:string = ""): Promise<any> {
		const headers = this.getHeaders();
		const url = `${YTM_BASE_API}${endpoint}${YTM_QUERY_PARAMS}${additional}`;
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
			'X-Goog-AuthUser': '0',
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
	async getLibraryPlaylists(limit?: number): Promise<IPlaylist[]> {
		return await this.library.getPlaylists(limit);
	}

	async getPlaylist(): Promise<boolean> {
		return await this.playlist.getTracks();
	}

	async createPlaylist(): Promise<boolean> {
		return await this.playlist.create();
	}

	async addPlaylistItems(): Promise<boolean> {
		return await this.playlist.addTracks();
	}
}
