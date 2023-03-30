
export type PlaylistItem = {
	playlistId: string,
	title: string,
	thumbnails?: Thumbnail[],
	count?: number,
};

export type Playlist = {
	id: string,
	title: string,
	privacy: string,
	description: string,
	thumbnails: Thumbnail[],
	isOwnPlaylist: boolean,
	author: string,
	year: string,
	trackCount: number,
	views: 0,
	duration: string,
	continuation?: string,
	tracks: Track[],
}

export type Thumbnail = {
	/**
	 * URL for thumbnail.
	 */
	url: string;

	/**
	 * Default width of thumbnail.
	 */
	width: number;

	/**
	 * Default height of thumbnail.
	 */
	height: number;
}

export type LikeStatus = "LIKE"|"DISLIKE"|"INDIFFERENT";

export type Track = {
	/**
	 * YouTube video ID. You can use this in both YouTube and YouTube Music.
	 */
	videoId: string,

	/**
	 * Title of track.
	 */
	title: string,

	/**
	 * Artists of track.
	 */
	artists?: {id?: string, name?: string}[],

	/**
	 * Album on which track appears.
	 */
	album?: {id?: string, name?: string},

	/**
	 * Do you like the track?
	 */
	likeStatus: LikeStatus,

	/**
	 * Thumbnails, ordered from smallest to largest.
	 * YouTube Music seems to render these at 40px by 40px in the player bar and 264px by 264px elsewhere.
	 */
	thumbnails?: Thumbnail[],

	/**
	 * The video isn't a song, or at least YouTube doesn't think it is, so it's not available in YouTube Music.
	 * It could also mean the video is unlicensed.
	 */
	isAvailable?: boolean,

	/**
	 * Flag indicating if track is licensed.
	 */
	isLicensed?: boolean,

	/**
	 * Naughty naughty singer!
	 */
	isExplicit?: boolean,

	/**
	 * No idea!
	 */
	videoType?: string,

	/**
	 * Duration as a string, such as 3:48.
	 */
	duration: string,

	/**
	 * Duration in number of seconds.
	 */
	durationSeconds: number,

	/**
	 * I think these might be tokens to add or remove a track to/from a playlist
	 * or a library, or both. I dunno.
	 */
	feedbackTokens?: {add: string, remove: string},

	/**
	 * A unique ID of this the track that is needed for adding
	 * or removing the track from a particular playlist.
	 */
	setVideoId?: string;
};

export type Album = {
	/**
	 * YouTube's internal ID for the album.
	 */
	id?: string,

	/**
	 * Album name.
	 */
	name?: string,
};

export type Artist = {
	/**
	 * YouTube's internal ID for an artist. Not all artists have IDs.
	 */
	id?: string,

	/**
	 * Artist's name.
	 */
	name?: string,
}