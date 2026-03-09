import { INTRO_STORAGE_KEY, PALETTES } from './config.js';

export class UI {
  constructor(els, state) {
    this.els   = els;
    this.state = state;
    this.swatchNodes = [];
  }

  sync() {
    const { els, state, swatchNodes } = this;
    els.sizeLabel.textContent  = `${state.size}px`;
    els.sizeSlider.value       = String(state.size);
    els.zoomLabel.textContent  = `${state.zoom}%`;

    if (state.tool === 'hand' || state.spacePan) {
      els.canvas.style.cursor = state.panning ? 'grabbing' : 'grab';
    } else {
      els.canvas.style.cursor = state.tool === 'eraser' ? 'cell' : 'crosshair';
    }

    els.penBtn.classList.toggle('active',    state.tool === 'pen');
    els.eraserBtn.classList.toggle('active', state.tool === 'eraser');
    els.handBtn.classList.toggle('active',   state.tool === 'hand');
    swatchNodes.forEach((n) => n.classList.toggle('active', n.dataset.color === state.color));
  }

  setUndoRedoState(canUndo, canRedo) {
    this.els.undoBtn.disabled = !canUndo;
    this.els.redoBtn.disabled = !canRedo;
  }

  renderSwatches(onColorSelect) {
    const { els, state } = this;
    els.swatches.innerHTML = '';
    this.swatchNodes = [];
    PALETTES[state.palette].forEach((hex) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.style.background = hex;
      b.dataset.color = hex;
      b.setAttribute('aria-label', `Color ${hex}`);
      b.addEventListener('click', () => onColorSelect(hex));
      els.swatches.appendChild(b);
      this.swatchNodes.push(b);
    });
  }

  setupPaletteSelect() {
    const { els } = this;
    els.paletteSelect.innerHTML = '';
    Object.keys(PALETTES).forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name.charAt(0).toUpperCase() + name.slice(1);
      els.paletteSelect.appendChild(opt);
    });
  }

  openShortcutsModal() {
    this.els.shortcutsModal.classList.add('open');
    this.els.shortcutsModal.setAttribute('aria-hidden', 'false');
  }

  closeShortcutsModal() {
    this.els.shortcutsModal.classList.remove('open');
    this.els.shortcutsModal.setAttribute('aria-hidden', 'true');
  }

  openIntroModal() {
    this.els.introModal.classList.add('open');
    this.els.introModal.setAttribute('aria-hidden', 'false');
  }

  closeIntroModal() {
    if (this.els.introSkip.checked) localStorage.setItem(INTRO_STORAGE_KEY, '1');
    this.els.introModal.classList.remove('open');
    this.els.introModal.setAttribute('aria-hidden', 'true');
  }
}
