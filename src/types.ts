
export type IPlaylist = {
	playlistId: string,
	title: string,
	thumbnails?: IThumbnails[],
	count?: number,
};

export type IThumbnails = {
	url: string;
	width: number;
	height: number;
}