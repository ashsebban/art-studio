import { DEFAULTS, PALETTES, INTRO_STORAGE_KEY } from './config.js';
import { History }       from './history.js';
import { Brush }         from './brush.js';
import { DrawingCanvas } from './canvas.js';
import { UI }            from './ui.js';

export class DrawingApp {
  constructor() {
    this.state = {
      ...DEFAULTS,
      drawing: false,
      panning: false,
      spacePan: false,
      activePointerId: null,
      panStartClientX: 0,
      panStartClientY: 0,
      panStartX: 0,
      panStartY: 0,
      panX: 0,
      panY: 0,
      lastX: 0,
      lastY: 0,
    };

    this.els = {
      penBtn:           document.getElementById('pen-btn'),
      eraserBtn:        document.getElementById('eraser-btn'),
      handBtn:          document.getElementById('hand-btn'),
      zoomOutBtn:       document.getElementById('zoom-out-btn'),
      zoomResetBtn:     document.getElementById('zoom-reset-btn'),
      zoomInBtn:        document.getElementById('zoom-in-btn'),
      zoomLabel:        document.getElementById('zoom-label'),
      shortcutsBtn:     document.getElementById('shortcuts-btn'),
      shortcutsModal:   document.getElementById('shortcuts-modal'),
      shortcutsCloseBtn:document.getElementById('shortcuts-close-btn'),
      introModal:       document.getElementById('intro-modal'),
      introSkip:        document.getElementById('intro-skip'),
      introStartBtn:    document.getElementById('intro-start-btn'),
      sizeDownBtn:      document.getElementById('size-down-btn'),
      sizeUpBtn:        document.getElementById('size-up-btn'),
      undoBtn:          document.getElementById('undo-btn'),
      redoBtn:          document.getElementById('redo-btn'),
      saveBtn:          document.getElementById('save-btn'),
      clearBtn:         document.getElementById('clear-btn'),
      resetBtn:         document.getElementById('reset-btn'),
      paletteSelect:    document.getElementById('palette-select'),
      swatches:         document.getElementById('swatches'),
      colorPicker:      document.getElementById('color-picker'),
      sizeSlider:       document.getElementById('size-slider'),
      sizeLabel:        document.getElementById('size-label'),
      stage:            document.getElementById('canvas-stage'),
      paper:            document.getElementById('paper'),
      canvas:           document.getElementById('draw-canvas'),
      // Mobile
      mUndoBtn:         document.getElementById('m-undo-btn'),
      mRedoBtn:         document.getElementById('m-redo-btn'),
      mDrawBtn:         document.getElementById('m-draw-btn'),
      mSaveBtn:         document.getElementById('m-save-btn'),
      drawPanel:        document.getElementById('draw-panel'),
      drawPanelClose:   document.getElementById('draw-panel-close'),
      drawPanelDone:    document.getElementById('draw-panel-done'),
      drawPanelBack:    document.getElementById('draw-panel-backdrop'),
      dpPenBtn:         document.getElementById('dp-pen-btn'),
      dpEraserBtn:      document.getElementById('dp-eraser-btn'),
      dpSwatches:       document.getElementById('dp-swatches'),
      dpColorPicker:    document.getElementById('dp-color-picker'),
      dpSizeSlider:     document.getElementById('dp-size-slider'),
      dpSizeLabel:      document.getElementById('dp-size-label'),
      dpSizeDown:       document.getElementById('dp-size-down'),
      dpSizeUp:         document.getElementById('dp-size-up'),
    };

    const { canvas, paper, stage } = this.els;
    const ctx = canvas.getContext('2d');

    this.history = new History(canvas, ctx);
    this.brush   = new Brush(canvas, ctx, this.state);
    this.dc      = new DrawingCanvas(paper, canvas, stage, this.state);
    this.ui      = new UI(this.els, this.state);
  }

  init() {
    this.ui.setupPaletteSelect();
    this._setPalette(DEFAULTS.palette);
    this._setColor(DEFAULTS.color);
    this._setSize(DEFAULTS.size);
    this.dc.setZoom(DEFAULTS.zoom);
    this._setupCanvasInput();
    this._wireEvents();
    this.dc.resize(false);
    this.history.reset();
    this._sync();
    if (localStorage.getItem(INTRO_STORAGE_KEY) !== '1') this.ui.openIntroModal();
  }

  // ── Private state setters ─────────────────────────────────────────────────

  _setTool(tool) {
    this.state.tool = tool;
    this._sync();
  }

  _setSize(size) {
    this.state.size = Math.max(1, Math.min(40, Number(size)));
    this._sync();
  }

  _setColor(color) {
    this.state.color = color;
    this.els.colorPicker.value = color;
    if (this.state.tool === 'eraser') this.state.tool = 'pen';
    this._sync();
  }

  _setPalette(name) {
    if (!PALETTES[name]) return;
    this.state.palette = name;
    this.els.paletteSelect.value = name;
    this.ui.renderSwatches((hex) => this._setColor(hex));
    if (!PALETTES[name].includes(this.state.color)) this._setColor(PALETTES[name][0]);
    this._sync();
  }

  _sync() {
    this.ui.sync();
    this.ui.setUndoRedoState(this.history.canUndo, this.history.canRedo);
    if (this.els.drawPanel?.classList.contains('open')) this._syncDrawPanel();
  }

  _isPanMode() {
    return this.state.tool === 'hand' || this.state.spacePan;
  }

  _resetApp() {
    const s = this.state;
    s.tool    = DEFAULTS.tool;
    s.color   = DEFAULTS.color;
    s.palette = DEFAULTS.palette;
    s.size    = DEFAULTS.size;
    s.zoom    = DEFAULTS.zoom;
    s.panX    = 0;
    s.panY    = 0;
    this._setPalette(s.palette);
    this.dc.resize(false);
    this.history.reset();
    this._sync();
  }

  // ── Mobile draw panel ─────────────────────────────────────────────────────

  _openDrawPanel() {
    this.ui.renderDrawPanelSwatches((hex) => this._setColor(hex));
    this.els.drawPanel.classList.add('open');
    this.els.drawPanel.setAttribute('aria-hidden', 'false');
    this.els.drawPanelBack.classList.add('open');
    this._syncDrawPanel();
  }

  _closeDrawPanel() {
    this.els.drawPanel.classList.remove('open');
    this.els.drawPanel.setAttribute('aria-hidden', 'true');
    this.els.drawPanelBack.classList.remove('open');
  }

  _syncDrawPanel() {
    const { els, state } = this;
    els.dpPenBtn.classList.toggle('active',    state.tool === 'pen');
    els.dpEraserBtn.classList.toggle('active', state.tool === 'eraser');
    els.dpColorPicker.value         = state.color;
    els.dpSizeSlider.value          = String(state.size);
    els.dpSizeLabel.textContent     = `${state.size}px`;
    // Sync dp swatches active state
    els.dpSwatches.querySelectorAll('.dp-swatch').forEach((n) => {
      n.classList.toggle('active', n.dataset.color === state.color);
    });
  }

  // ── Canvas pointer input ──────────────────────────────────────────────────

  _setupCanvasInput() {
    const { canvas } = this.els;
    const s = this.state;

    canvas.addEventListener('pointerdown', (evt) => {
      evt.preventDefault();
      if (s.drawing || s.panning) return;
      if (this._isPanMode()) {
        s.panning = true;
        s.activePointerId = evt.pointerId;
        s.panStartClientX = evt.clientX;
        s.panStartClientY = evt.clientY;
        s.panStartX = s.panX;
        s.panStartY = s.panY;
        canvas.setPointerCapture(evt.pointerId);
        this._sync();
        return;
      }
      const pt = this.brush.localPoint(evt);
      s.drawing = true;
      s.activePointerId = evt.pointerId;
      s.lastX = pt.x;
      s.lastY = pt.y;
      this.brush.drawDot(pt.x, pt.y, this.brush.effectivePressure(evt));
      canvas.setPointerCapture(evt.pointerId);
    });

    canvas.addEventListener('pointermove', (evt) => {
      if (s.panning && evt.pointerId === s.activePointerId) {
        evt.preventDefault();
        s.panX = s.panStartX + (evt.clientX - s.panStartClientX);
        s.panY = s.panStartY + (evt.clientY - s.panStartClientY);
        this.dc.applyZoom();
        return;
      }
      if (!s.drawing || evt.pointerId !== s.activePointerId) return;
      evt.preventDefault();
      const pt = this.brush.localPoint(evt);
      this.brush.drawSegment(s.lastX, s.lastY, pt.x, pt.y, this.brush.effectivePressure(evt));
      s.lastX = pt.x;
      s.lastY = pt.y;
    });

    const endStroke = (evt) => {
      if (evt.pointerId !== s.activePointerId) return;
      evt.preventDefault();
      if (canvas.hasPointerCapture(evt.pointerId)) canvas.releasePointerCapture(evt.pointerId);
      if (s.panning) {
        s.panning = false;
      } else if (s.drawing) {
        s.drawing = false;
        this.history.commit();
      }
      s.activePointerId = null;
      this._sync();
    };
    canvas.addEventListener('pointerup',     endStroke);
    canvas.addEventListener('pointercancel', endStroke);
  }

  // ── UI event wiring ───────────────────────────────────────────────────────

  _wireEvents() {
    const { els, dc, ui } = this;
    const s = this.state;

    els.penBtn.addEventListener('click',    () => this._setTool('pen'));
    els.eraserBtn.addEventListener('click', () => this._setTool('eraser'));
    els.handBtn.addEventListener('click',   () => this._setTool('hand'));

    els.zoomOutBtn.addEventListener('click',   () => dc.setZoom(s.zoom - 10) || this._sync());
    els.zoomInBtn.addEventListener('click',    () => dc.setZoom(s.zoom + 10) || this._sync());
    els.zoomResetBtn.addEventListener('click', () => { s.panX = 0; s.panY = 0; dc.setZoom(100); this._sync(); });

    els.shortcutsBtn.addEventListener('click',      () => ui.openShortcutsModal());
    els.shortcutsCloseBtn.addEventListener('click', () => ui.closeShortcutsModal());
    els.shortcutsModal.addEventListener('click',    (e) => { if (e.target === els.shortcutsModal) ui.closeShortcutsModal(); });

    els.introStartBtn.addEventListener('click', () => ui.closeIntroModal());
    els.introModal.addEventListener('click',    (e) => { if (e.target === els.introModal) ui.closeIntroModal(); });

    els.paletteSelect.addEventListener('change', (e) => this._setPalette(e.target.value));
    els.colorPicker.addEventListener('input',    (e) => this._setColor(e.target.value));
    els.sizeSlider.addEventListener('input',     (e) => this._setSize(e.target.value));

    this._bindHoldAdjust(els.sizeDownBtn, -1);
    this._bindHoldAdjust(els.sizeUpBtn,    1);

    els.undoBtn.addEventListener('click', () => { this.history.undo(); this._sync(); });
    els.redoBtn.addEventListener('click', () => { this.history.redo(); this._sync(); });
    els.saveBtn.addEventListener('click', () => dc.savePng());
    els.clearBtn.addEventListener('click', () => { dc.clearCanvas(); this.history.commit(); this._sync(); });
    els.resetBtn.addEventListener('click', () => this._resetApp());

    // Mobile toolbar
    if (els.mUndoBtn) {
      els.mUndoBtn.addEventListener('click', () => { this.history.undo(); this._sync(); });
      els.mRedoBtn.addEventListener('click', () => { this.history.redo(); this._sync(); });
      els.mSaveBtn.addEventListener('click', () => dc.savePng());
      els.mDrawBtn.addEventListener('click', () => this._openDrawPanel());

      els.drawPanelClose.addEventListener('click',  () => this._closeDrawPanel());
      els.drawPanelDone.addEventListener('click',   () => this._closeDrawPanel());
      els.drawPanelBack.addEventListener('click',   () => this._closeDrawPanel());

      els.dpPenBtn.addEventListener('click',    () => this._setTool('pen'));
      els.dpEraserBtn.addEventListener('click', () => this._setTool('eraser'));
      els.dpColorPicker.addEventListener('input', (e) => this._setColor(e.target.value));
      els.dpSizeSlider.addEventListener('input',  (e) => this._setSize(e.target.value));
      this._bindHoldAdjust(els.dpSizeDown, -1);
      this._bindHoldAdjust(els.dpSizeUp,    1);
    }

    window.addEventListener('resize', () => { dc.resize(true); this.history.reset(); this._sync(); });
    new ResizeObserver(() => { dc.resize(true); this.history.reset(); this._sync(); }).observe(els.stage);

    document.addEventListener('keydown', (e) => this._onKeyDown(e));
    document.addEventListener('keyup',   (e) => {
      if (e.code === 'Space') {
        s.spacePan = false;
        if (!s.panning && s.tool === 'hand') this._setTool('pen');
        else this._sync();
      }
    });
  }

  _bindHoldAdjust(button, delta) {
    let holdTimer = null;
    let repeatTimer = null;
    const stop = () => {
      if (holdTimer)  clearTimeout(holdTimer);
      if (repeatTimer) clearInterval(repeatTimer);
      holdTimer = repeatTimer = null;
    };
    const start = (evt) => {
      evt.preventDefault();
      this._setSize(this.state.size + delta);
      holdTimer = setTimeout(() => {
        repeatTimer = setInterval(() => this._setSize(this.state.size + delta), 70);
      }, 320);
    };
    button.addEventListener('pointerdown',  start);
    button.addEventListener('pointerup',    stop);
    button.addEventListener('pointerleave', stop);
    button.addEventListener('pointercancel',stop);
  }

  _onKeyDown(e) {
    const key = e.key.toLowerCase();
    const tag = e.target?.tagName?.toLowerCase() ?? '';
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

    const { els, dc, ui, state: s } = this;

    if (key === 'escape') {
      if (els.drawPanel?.classList.contains('open'))       { this._closeDrawPanel();     return; }
      if (els.shortcutsModal.classList.contains('open'))   { ui.closeShortcutsModal();   return; }
      if (els.introModal.classList.contains('open'))       { ui.closeIntroModal();        return; }
    }
    if ((e.metaKey || e.ctrlKey) && key === 'z') {
      e.preventDefault();
      e.shiftKey ? this.history.redo() : this.history.undo();
      this._sync();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && key === 's') { e.preventDefault(); dc.savePng(); return; }

    if (key === 'p') this._setTool('pen');
    if (key === 'e') this._setTool('eraser');
    if (key === 'h') this._setTool('hand');
    if (e.code === 'Space') { e.preventDefault(); s.spacePan = true; this._sync(); }
    if (key === 'c') { dc.clearCanvas(); this.history.commit(); this._sync(); }
    if (key === 'r') this._resetApp();
    if (key === '-' || key === '_') { dc.setZoom(s.zoom - 10); this._sync(); }
    if (key === '=' || key === '+') { dc.setZoom(s.zoom + 10); this._sync(); }
    if (key === '[') this._setSize(s.size - 1);
    if (key === ']') this._setSize(s.size + 1);
  }
}
