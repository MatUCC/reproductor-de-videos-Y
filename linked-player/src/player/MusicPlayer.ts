import { Song } from "../models/Song";
import { DoublyLinkedList } from "../structures/DoublyLinkedList";
import { Node } from "../structures/Node";

export type InsertPosition = "start" | "end" | number;

/** Abstraction of the audio/video backend (YouTube iframe), so the player stays testable. */
export interface PlayerEngine {
  load(videoId: string, autoplay: boolean): void;
  play(): void;
  pause(): void;
}

export class MusicPlayer {
  readonly playlist = new DoublyLinkedList<Song>();
  /** Reference to the node being played: next/prev are just `currentNode.next/prev`. */
  currentNode: Node<Song> | null = null;
  isPlaying = false;
  loop = true; // when true, next on the tail wraps to head (and prev on head wraps to tail)
  private listeners: Array<() => void> = [];

  constructor(private engine: PlayerEngine) {}

  onChange(listener: () => void): void { this.listeners.push(listener); }
  private emit(): void { this.listeners.forEach((l) => l()); }

  addSong(song: Song, position: InsertPosition = "end"): void {
    const node =
      position === "start" ? this.playlist.prepend(song)
      : position === "end" ? this.playlist.append(song)
      : this.playlist.insertAt(position, song);
    if (!this.currentNode) this.setCurrent(node, false); // first song is only cued
    else this.emit();
  }

  removeById(id: string): void {
    const node = this.playlist.findNode((s) => s.id === id);
    if (node) this.removeNode(node);
  }

  removeAt(index: number): void {
    const node = this.playlist.getNodeAt(index);
    if (node) this.removeNode(node);
  }

  private removeNode(node: Node<Song>): void {
    if (node === this.currentNode) {
      // Pick the replacement BEFORE unlinking, because unlink clears the node's pointers.
      const replacement = node.next ?? node.prev;
      this.playlist.removeNode(node);
      if (replacement) this.setCurrent(replacement, this.isPlaying);
      else { this.currentNode = null; this.isPlaying = false; this.engine.pause(); this.emit(); }
    } else {
      this.playlist.removeNode(node);
      this.emit();
    }
  }

  nextTrack(): void {
    if (!this.currentNode) return;
    const target = this.currentNode.next ?? (this.loop ? this.playlist.head : null);
    if (target) this.setCurrent(target, true); else this.pause();
  }

  prevTrack(): void {
    if (!this.currentNode) return;
    const target = this.currentNode.prev ?? (this.loop ? this.playlist.tail : null);
    if (target) this.setCurrent(target, true);
  }

  selectById(id: string): void {
    const node = this.playlist.findNode((s) => s.id === id);
    if (node) this.setCurrent(node, true);
  }

  play(): void { if (this.currentNode) { this.engine.play(); this.isPlaying = true; this.emit(); } }
  pause(): void { this.engine.pause(); this.isPlaying = false; this.emit(); }
  togglePlay(): void { this.isPlaying ? this.pause() : this.play(); }

  /** Keeps state in sync with events coming from the iframe (user clicked inside it). */
  syncPlaying(playing: boolean): void {
    if (this.isPlaying !== playing) { this.isPlaying = playing; this.emit(); }
  }

  moveSong(id: string, delta: number): void {
    const node = this.playlist.findNode((s) => s.id === id);
    if (!node) return;
    const from = this.playlist.indexOf(node);
    const to = from + delta;
    if (to < 0 || to >= this.playlist.size) return;
    this.playlist.move(from, to);
    this.emit();
  }

  clear(): void {
    this.playlist.clear();
    this.currentNode = null;
    this.isPlaying = false;
    this.engine.pause();
    this.emit();
  }

  searchInPlaylist(query: string): Song[] {
    const q = query.trim().toLowerCase();
    return this.playlist.toArray().filter((s) => !q || `${s.title} ${s.artist}`.toLowerCase().includes(q));
  }

  private setCurrent(node: Node<Song>, autoplay: boolean): void {
    this.currentNode = node;
    this.isPlaying = autoplay;
    this.engine.load(node.value.youtubeVideoId, autoplay);
    this.emit();
  }
}
