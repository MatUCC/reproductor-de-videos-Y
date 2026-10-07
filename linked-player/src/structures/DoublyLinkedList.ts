import { Node } from "./Node";

/**
 * Generic doubly linked list: head <-> ... <-> tail.
 * Every insertion/removal is reduced to two private primitives (link / unlink)
 * that only rewire the `prev` and `next` pointers of the neighbours.
 */
export class DoublyLinkedList<T> {
  head: Node<T> | null = null;
  tail: Node<T> | null = null;
  size = 0;

  prepend(value: T): Node<T> { return this.link(new Node(value), 0); }
  append(value: T): Node<T> { return this.link(new Node(value), this.size); }
  insertAt(index: number, value: T): Node<T> { return this.link(new Node(value), index); }

  removeAt(index: number): T {
    const node = this.getNodeAt(index);
    if (!node) throw new RangeError(`Index ${index} out of range`);
    this.unlink(node);
    return node.value;
  }

  removeNode(node: Node<T>): void { this.unlink(node); }

  /** Walks from the closest end (head or tail), so it never visits more than size/2 nodes. */
  getNodeAt(index: number): Node<T> | null {
    if (index < 0 || index >= this.size) return null;
    let node: Node<T>;
    if (index < this.size / 2) {
      node = this.head!;
      for (let i = 0; i < index; i++) node = node.next!;
    } else {
      node = this.tail!;
      for (let i = this.size - 1; i > index; i--) node = node.prev!;
    }
    return node;
  }

  findNode(predicate: (value: T) => boolean): Node<T> | null {
    for (const node of this.nodes()) if (predicate(node.value)) return node;
    return null;
  }

  indexOf(node: Node<T>): number {
    let i = 0;
    for (const n of this.nodes()) { if (n === node) return i; i++; }
    return -1;
  }

  /** Moves a node keeping its identity (so the player's currentNode stays valid). */
  move(from: number, to: number): void {
    const node = this.getNodeAt(from);
    if (!node) throw new RangeError(`Index ${from} out of range`);
    this.unlink(node);
    this.link(node, Math.max(0, Math.min(to, this.size)));
  }

  clear(): void {
    let node = this.head;
    while (node) { const next = node.next; node.next = node.prev = null; node = next; }
    this.head = this.tail = null;
    this.size = 0;
  }

  toArray(): T[] { return [...this.nodes()].map((n) => n.value); }

  *nodes(): IterableIterator<Node<T>> {
    for (let node = this.head; node; node = node.next) yield node;
  }

  /** Inserts `node` so that it ends up at `index`, rewiring only its neighbours. */
  private link(node: Node<T>, index: number): Node<T> {
    if (index < 0 || index > this.size) throw new RangeError(`Index ${index} out of range`);
    if (this.size === 0) {
      this.head = this.tail = node;                       // single node: both ends
    } else if (index === 0) {
      node.next = this.head; this.head!.prev = node; this.head = node;   // new head
    } else if (index === this.size) {
      node.prev = this.tail; this.tail!.next = node; this.tail = node;   // new tail
    } else {
      const after = this.getNodeAt(index)!;               // node currently at `index`
      const before = after.prev!;
      node.prev = before; node.next = after;              // 1) point the new node to its neighbours
      before.next = node; after.prev = node;              // 2) point the neighbours back to it
    }
    this.size++;
    return node;
  }

  /** Detaches `node`: its neighbours now point to each other. */
  private unlink(node: Node<T>): void {
    if (node.prev) node.prev.next = node.next; else this.head = node.next;
    if (node.next) node.next.prev = node.prev; else this.tail = node.prev;
    node.next = node.prev = null;
    this.size--;
  }
}
