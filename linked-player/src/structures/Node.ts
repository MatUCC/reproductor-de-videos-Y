/**
 * A node of the doubly linked list.
 * - `next` points to the following node (null at the tail).
 * - `prev` points to the previous node (null at the head).
 * Having both pointers is what allows O(1) navigation in both directions.
 */
export class Node<T> {
  next: Node<T> | null = null;
  prev: Node<T> | null = null;
  constructor(public value: T) {}
}
