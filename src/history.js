import { MAX_HISTORY } from './config.js';

export class History {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.stack = [];
    this.redoStack = [];
  }

  snapshot() {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  restore(imageData) {
    this.ctx.putImageData(imageData, 0, 0);
  }

  commit() {
    this.stack.push(this.snapshot());
    if (this.stack.length > MAX_HISTORY) this.stack.shift();
    this.redoStack = [];
  }

  reset() {
    this.stack = [this.snapshot()];
    this.redoStack = [];
  }

  undo() {
    if (this.stack.length <= 1) return false;
    this.redoStack.push(this.stack.pop());
    this.restore(this.stack[this.stack.length - 1]);
    return true;
  }

  redo() {
    if (!this.redoStack.length) return false;
    const next = this.redoStack.pop();
    this.stack.push(next);
    this.restore(next);
    return true;
  }

  get canUndo() { return this.stack.length > 1; }
  get canRedo()  { return this.redoStack.length > 0; }
}
