export class AsyncQueue<T> implements AsyncIterator<T>, AsyncIterable<T> {
  #buf: T[] = [];
  #wakeUp?: () => void;
  #closed = false;
  #totalLength = 0;

  push(v: T) {
    if (this.#closed) return;
    this.#buf.push(v);
    this.#totalLength++;
    this.#wakeUp?.();
  }

  pushFirst(v: T) {
    if (this.#closed) return;
    this.#buf.unshift(v);
    this.#totalLength++;
    this.#wakeUp?.();
  }

  stop() {
    if (this.#closed) return;
    this.#closed = true;
    this.#wakeUp?.();
  }

  some(predicate: (value: T) => boolean) {
    return this.#buf.some(predicate);
  }

  length() {
    return this.#buf.length;
  }

  totalLength() {
    return this.#totalLength;
  }

  async next(): Promise<IteratorResult<T>> {
    while (true) {
      const value = this.#buf.shift();
      if (value !== undefined) return { value, done: false };
      if (this.#closed) return { value: undefined, done: true };
      // biome-ignore lint/nursery/noAwaitInLoop: expected here
      await new Promise<void>((res) => (this.#wakeUp = res)); // sleep until push/stop
      this.#wakeUp = undefined;
    }
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}
