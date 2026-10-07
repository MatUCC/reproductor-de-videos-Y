import { YOUTUBE_API_KEY } from "../config";
import { Song } from "../models/Song";

const BASE = "https://www.googleapis.com/youtube/v3";

/** Thin wrapper over the YouTube Data API v3 (search + video durations). */
export class YouTubeService {
  async search(query: string, maxResults = 8): Promise<Song[]> {
    const params = new URLSearchParams({
      part: "snippet", q: query, type: "video", videoEmbeddable: "true",
      videoCategoryId: "10", maxResults: String(maxResults), key: YOUTUBE_API_KEY,
    });
    const data = await this.request(`${BASE}/search?${params}`);
    const items: any[] = data.items ?? [];
    const durations = await this.fetchDurations(items.map((i) => i.id.videoId));
    return items.map((i) =>
      Song.create(
        this.decode(i.snippet.title), this.decode(i.snippet.channelTitle), i.id.videoId,
        i.snippet.thumbnails?.medium?.url ?? i.snippet.thumbnails?.default?.url ?? "",
        durations.get(i.id.videoId) ?? ""
      )
    );
  }

  private async fetchDurations(ids: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (!ids.length) return map;
    const params = new URLSearchParams({ part: "contentDetails", id: ids.join(","), key: YOUTUBE_API_KEY });
    try {
      const data = await this.request(`${BASE}/videos?${params}`);
      for (const v of data.items ?? []) map.set(v.id, this.formatDuration(v.contentDetails.duration));
    } catch { /* durations are optional */ }
    return map;
  }

  private async request(url: string): Promise<any> {
    const res = await fetch(url);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.error?.message ?? `YouTube API error (${res.status})`);
    return body;
  }

  /** ISO 8601 (PT1H2M3S) -> "1:02:03" */
  private formatDuration(iso: string): string {
    const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
    if (!m) return "";
    const [h, min, s] = [Number(m[1] ?? 0), Number(m[2] ?? 0), Number(m[3] ?? 0)];
    const pad = (n: number) => String(n).padStart(2, "0");
    return h ? `${h}:${pad(min)}:${pad(s)}` : `${min}:${pad(s)}`;
  }

  /** The API returns HTML-escaped titles (&amp;, &#39;...). */
  private decode(text: string): string {
    return new DOMParser().parseFromString(text, "text/html").documentElement.textContent ?? text;
  }
}
