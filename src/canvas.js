import { BG } from './config.js';

export class DrawingCanvas {
  constructor(paperEl, canvasEl, stageEl, state) {
    this.paper  = paperEl;
    this.canvas = canvasEl;
    this.stage  = stageEl;
    this.state  = state;
    this.ctx    = canvasEl.getContext('2d');
  }

  applyZoom() {
    const { panX, panY, zoom } = this.state;
    this.paper.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom / 100})`;
  }

  setZoom(nextZoom) {
    this.state.zoom = Math.max(50, Math.min(200, Math.round(nextZoom)));
    this.applyZoom();
  }

  clearCanvas() {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  resize(preserveDrawing = true) {
    const { canvas, paper, stage, ctx } = this;
    let prevData = null;

    if (preserveDrawing && canvas.width && canvas.height) {
      const temp = document.createElement('canvas');
      temp.width  = canvas.width;
      temp.height = canvas.height;
      temp.getContext('2d').drawImage(canvas, 0, 0);
      prevData = temp;
    }

    const stageRect = stage.getBoundingClientRect();
    const ratio = 4 / 3;
    const maxW = Math.max(240, Math.floor(stageRect.width  - 12));
    const maxH = Math.max(240, Math.floor(stageRect.height - 12));
    let w = Math.min(maxW, Math.floor(maxH * ratio));
    let h = Math.floor(w / ratio);
    if (h > maxH) { h = maxH; w = Math.floor(h * ratio); }

    paper.style.width  = `${w}px`;
    paper.style.height = `${h}px`;
    this.applyZoom();
    canvas.width  = w;
    canvas.height = h;
    this.clearCanvas();

    if (prevData) ctx.drawImage(prevData, 0, 0, prevData.width, prevData.height, 0, 0, w, h);
  }

  savePng() {
    try {
      const link = document.createElement('a');
      link.href     = this.canvas.toDataURL('image/png');
      link.download = `art-studio-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      console.warn('Save blocked. Use capture help.');
    }
  }
}
