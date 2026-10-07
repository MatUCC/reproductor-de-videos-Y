import { PlayerEngine } from "../player/MusicPlayer";

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady?: () => void; }
}

/** PlayerEngine implementation on top of the YouTube Iframe Player API. */
export class YouTubePlayerAdapter implements PlayerEngine {
  onEnded: () => void = () => {};
  onPlayingChange: (playing: boolean) => void = () => {};
  private yt: any = null;
  private ready: Promise<void>;

  constructor(elementId: string) {
    this.ready = new Promise((resolve) => {
      window.onYouTubeIframeAPIReady = () => {
        this.yt = new window.YT.Player(elementId, {
          width: "100%", height: "100%", playerVars: { playsinline: 1, rel: 0 },
          events: { onReady: () => resolve(), onStateChange: (e: any) => this.handleState(e.data) },
        });
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    });
  }

  private handleState(state: number): void {
    const S = window.YT.PlayerState;
    if (state === S.ENDED) this.onEnded();            // auto-advance to node.next
    else if (state === S.PLAYING) this.onPlayingChange(true);
    else if (state === S.PAUSED) this.onPlayingChange(false);
  }

  load(videoId: string, autoplay: boolean): void {
    this.ready.then(() => (autoplay ? this.yt.loadVideoById(videoId) : this.yt.cueVideoById(videoId)));
  }
  play(): void { this.ready.then(() => this.yt.playVideo()); }
  pause(): void { this.ready.then(() => this.yt.pauseVideo()); }
}
