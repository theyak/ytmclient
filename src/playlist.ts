import { YtmClient } from "..";

export default class Playlist {
	client: YtmClient;

	constructor(client: YtmClient) {
		this.client = client;
	}

	async getTracks(): Promise<boolean> {
		return true;
	}

	async create(): Promise<boolean> {
		return true;
	}

	async addTracks(): Promise<boolean> {
		return true;
	}
}