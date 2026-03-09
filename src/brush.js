export class Brush {
  constructor(canvas, ctx, state) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.state = state;
  }

  drawSegment(x0, y0, x1, y1, pressure = 1) {
    const { ctx, state } = this;
    ctx.save();
    ctx.globalCompositeOperation = state.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = state.color;
    ctx.lineWidth = state.size * pressure;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }

  drawDot(x, y, pressure = 1) {
    const { ctx, state } = this;
    ctx.save();
    ctx.globalCompositeOperation = state.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.fillStyle = state.color;
    const radius = Math.max(0.5, (state.size * pressure) / 2);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  localPoint(evt) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(this.canvas.width,  (evt.clientX - r.left) * (this.canvas.width  / r.width))),
      y: Math.max(0, Math.min(this.canvas.height, (evt.clientY - r.top)  * (this.canvas.height / r.height))),
    };
  }

  effectivePressure(evt) {
    return evt.pressure && evt.pressure > 0 ? evt.pressure : 1;
  }
}
