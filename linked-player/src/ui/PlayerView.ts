import { Song } from "../models/Song";
import { MusicPlayer } from "../player/MusicPlayer";
import { YouTubeService } from "../services/YouTubeService";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);
const short = (s: string, n = 16) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/** Renders the player state and wires DOM events to MusicPlayer methods. */
export class PlayerView {
  private results: Song[] = [];
  private candidate: Song | null = null;
  private filter = "";

  constructor(private player: MusicPlayer, private youtube: YouTubeService) {
    $("prev-btn").onclick = () => player.prevTrack();
    $("next-btn").onclick = () => player.nextTrack();
    $("play-btn").onclick = () => player.togglePlay();
    $("clear-btn").onclick = () => player.clear();
    $("filter-input").oninput = (e) => { this.filter = (e.target as HTMLInputElement).value; this.render(); };
    $("search-form").onsubmit = (e) => { e.preventDefault(); this.runSearch(); };
    $("results").onclick = (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-add]");
      if (btn) this.openModal(this.results[Number(btn.dataset.add)]);
    };
    $("queue").onclick = (e) => this.onListClick(e);
    $("chain").onclick = (e) => this.onListClick(e);
    $("modal-pos").onchange = () => this.syncModal();
    $("modal-cancel").onclick = () => this.closeModal();
    $("modal-form").onsubmit = (e) => { e.preventDefault(); this.confirmAdd(); };
    player.onChange(() => this.render());
    this.render();
  }

  private async runSearch(): Promise<void> {
    const q = $<HTMLInputElement>("search-input").value.trim();
    if (!q) return;
    const box = $("results");
    box.innerHTML = `<p class="text-sm text-zinc-400">Searching…</p>`;
    try {
      this.results = await this.youtube.search(q);
      box.innerHTML = this.results.map((s, i) => `
        <div class="flex items-center gap-3 rounded-xl bg-white/5 p-2">
          <img src="${esc(s.thumbnailUrl)}" class="h-12 w-20 rounded-md object-cover" />
          <div class="min-w-0 flex-1"><p class="truncate text-sm">${esc(s.title)}</p>
            <p class="truncate text-xs text-zinc-400">${esc(s.artist)} · ${s.duration}</p></div>
          <button data-add="${i}" class="rounded-full bg-violet-500 px-3 py-1 text-xs hover:bg-violet-400">+ Add</button>
        </div>`).join("") || `<p class="text-sm text-zinc-400">No results.</p>`;
    } catch (err) {
      box.innerHTML = `<p class="text-sm text-red-400">${esc((err as Error).message)}</p>`;
    }
  }

  // ---- Modal: choose where the song is inserted (prepend / append / insertAt) ----
  private openModal(song: Song): void {
    this.candidate = song;
    $("modal-title").textContent = song.title;
    $<HTMLSelectElement>("modal-pos").value = "end";
    $<HTMLInputElement>("modal-index").max = String(this.player.playlist.size);
    this.syncModal();
    $("modal").classList.replace("hidden", "flex");
  }
  private closeModal(): void { $("modal").classList.replace("flex", "hidden"); this.candidate = null; }
  private syncModal(): void {
    $("modal-index").classList.toggle("hidden", $<HTMLSelectElement>("modal-pos").value !== "index");
  }
  private confirmAdd(): void {
    if (!this.candidate) return;
    const pos = $<HTMLSelectElement>("modal-pos").value;
    const index = Number($<HTMLInputElement>("modal-index").value);
    try {
      this.player.addSong(this.candidate, pos === "index" ? index : (pos as "start" | "end"));
      this.closeModal();
    } catch (err) { alert((err as Error).message); }
  }

  private onListClick(e: Event): void {
    const t = e.target as HTMLElement;
    const row = t.closest<HTMLElement>("[data-id]");
    if (!row) return;
    const id = row.dataset.id!;
    if (t.closest("[data-remove]")) this.player.removeById(id);
    else if (t.closest("[data-up]")) this.player.moveSong(id, -1);
    else if (t.closest("[data-down]")) this.player.moveSong(id, 1);
    else this.player.selectById(id);
  }

  private render(): void {
    const { playlist, currentNode, isPlaying } = this.player;
    const song = currentNode?.value;
    $("play-btn").textContent = isPlaying ? "❚❚" : "▶";
    $("size").textContent = `(${playlist.size})`;
    $("now-playing").innerHTML = song
      ? `<h2 class="text-xl font-semibold">${esc(song.title)}</h2><p class="text-sm text-zinc-400">${esc(song.artist)}</p>`
      : `<p class="text-zinc-400">The playlist is empty. Search a song and add it.</p>`;

    // Pointers of the current node: prev <- current -> next
    const card = (label: string, value: string | null, accent = false) => `
      <div class="rounded-xl p-3 ring-1 ${accent ? "bg-violet-500/20 ring-violet-400/50" : "bg-white/5 ring-white/10"}">
        <p class="font-mono text-[11px] uppercase text-zinc-400">${label}</p>
        <p class="truncate text-sm">${value === null ? '<span class="text-zinc-500">null</span>' : esc(value)}</p></div>`;
    $("pointers").innerHTML =
      card("◀ current.prev", currentNode ? currentNode.prev?.value.title ?? null : null) +
      card("current", song?.title ?? null, true) +
      card("current.next ▶", currentNode ? currentNode.next?.value.title ?? null : null);

    // Visual chain: null <-> [head] <-> ... <-> [tail] <-> null
    const arrow = `<span class="px-1 text-violet-400">⇄</span>`;
    const nil = `<span class="font-mono text-xs text-zinc-500">null</span>`;
    const nodes = [...playlist.nodes()].map((n, i) => {
      const tag = n === playlist.head ? "HEAD" : n === playlist.tail ? "TAIL" : "";
      const active = n === currentNode;
      return `<div data-id="${n.value.id}" class="min-w-[104px] shrink-0 cursor-pointer rounded-xl p-2 text-center text-xs ring-1 ${active ? "bg-violet-500/30 ring-violet-400" : "bg-white/5 ring-white/10 hover:bg-white/10"}">
        <p class="font-mono text-[10px] text-zinc-400">[${i}] ${tag}</p><p>${esc(short(n.value.title))}</p></div>`;
    });
    $("chain").innerHTML = nodes.length
      ? `<div class="flex items-center">${nil}${arrow}${nodes.join(arrow)}${arrow}${nil}</div>`
      : `<span class="text-sm text-zinc-500">head = null · tail = null · size = 0</span>`;

    // Queue (optionally filtered with searchInPlaylist)
    const visible = this.player.searchInPlaylist(this.filter);
    $("queue").innerHTML = visible.map((s) => {
      const active = s.id === song?.id;
      return `<li data-id="${s.id}" class="flex cursor-pointer items-center gap-2 rounded-xl p-2 ${active ? "bg-violet-500/20" : "hover:bg-white/5"}">
        <img src="${esc(s.thumbnailUrl)}" class="h-9 w-14 rounded object-cover" />
        <div class="min-w-0 flex-1"><p class="truncate text-sm">${esc(s.title)}</p><p class="truncate text-xs text-zinc-400">${esc(s.artist)}</p></div>
        <button data-up class="px-1 text-zinc-400 hover:text-white" title="Move up">↑</button>
        <button data-down class="px-1 text-zinc-400 hover:text-white" title="Move down">↓</button>
        <button data-remove class="px-1 text-zinc-400 hover:text-red-400" title="Remove">✕</button></li>`;
    }).join("");
  }
}
