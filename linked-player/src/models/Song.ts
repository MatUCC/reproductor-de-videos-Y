let idCounter = 0;

/** Immutable model of a track. The same video can appear twice: every Song gets its own id. */
export class Song {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly artist: string,
    readonly youtubeVideoId: string,
    readonly thumbnailUrl: string,
    readonly duration: string = ""
  ) {}

  static create(title: string, artist: string, videoId: string, thumbnailUrl: string, duration = ""): Song {
    return new Song(`song-${++idCounter}`, title, artist, videoId, thumbnailUrl, duration);
  }
}
