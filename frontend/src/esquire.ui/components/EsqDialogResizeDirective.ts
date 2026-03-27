/*
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 03/27/2026 mir0n  initial: Windows-style all-edge resize; [esqDialogResize]="key:user" for cookie-based position/size persistence
*/
import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  Renderer2,
} from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[esqDialogResize]',
  standalone: true,
})
export class EsqDialogResizeDirective implements AfterViewInit, OnDestroy {

  // Set to false to globally disable position/size persistence
  private static readonly PERSIST_BOUNDS = true;

  // [esqDialogResize]="'key:' + userId"  →  parsed as key:user for persistence
  // esqDialogResize (plain attribute)    →  empty string, no persistence
  @Input('esqDialogResize') set esqDialogConfig(val: string) {
    var idx = val ? val.indexOf(':') : -1;
    if (idx > 0) {
      this._key  = val.substring(0, idx);
      this._user = val.substring(idx + 1);
    } else {
      this._key  = '';
      this._user = '';
    }
  }
  private _key  = '';
  private _user = '';

  private pane!: HTMLElement;
  private destroy$ = new Subject<void>();
  private resizing = false;
  private activeEdge = '';
  private startX = 0;
  private startY = 0;
  private startLeft = 0;
  private startTop = 0;
  private startWidth = 0;
  private startHeight = 0;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private zone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.init(), 0);
  }

  private init(): void {
    var el: HTMLElement = this.el.nativeElement;
    while (el.parentElement && !el.classList.contains('cdk-overlay-pane')) {
      el = el.parentElement!;
    }
    if (!el.classList.contains('cdk-overlay-pane')) {
      return;
    }
    this.pane = el;
    this.renderer.setStyle(this.pane, 'resize', 'none');
    // Establish a CSS stacking context on the pane via transform so handles
    // render above the dialog container immediately — without waiting for
    // cdkDrag to apply its own transform on first drag.
    if (!this.pane.style.transform) {
      this.renderer.setStyle(this.pane, 'transform', 'translate3d(0px, 0px, 0px)');
    }
    this.createHandles();
    this.restoreState();
    this.zone.runOutsideAngular(() => {
      fromEvent<MouseEvent>(document, 'mousemove')
        .pipe(takeUntil(this.destroy$))
        .subscribe(e => this.onMouseMove(e));
      fromEvent<MouseEvent>(document, 'mouseup')
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.onMouseUp());
      // Save position after drag ends (toolbar is the cdkDragHandle)
      this.el.nativeElement.addEventListener('mouseup', () => this.saveState());
    });
  }

  // ── Persistence ─────────────────────────────────────────────────────────────

  private cookieName(): string {
    if (!EsqDialogResizeDirective.PERSIST_BOUNDS) return '';
    if (!this._key || !this._user) return '';
    return 'esq_dlg_' + this._key + '_' + this._user;
  }

  private saveState(): void {
    var name = this.cookieName();
    if (!name || !this.pane) return;
    var r = this.pane.getBoundingClientRect();
    var val = JSON.stringify({ left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) });
    var exp = new Date();
    exp.setFullYear(exp.getFullYear() + 1);
    document.cookie = name + '=' + encodeURIComponent(val) + '; path=/; expires=' + exp.toUTCString() + '; SameSite=Lax';
  }

  private restoreState(): void {
    var name = this.cookieName();
    if (!name || !this.pane) return;
    var prefix = name + '=';
    var parts = document.cookie.split(';');
    var raw: string | null = null;
    for (var i = 0; i < parts.length; i++) {
      var c = parts[i].trim();
      if (c.startsWith(prefix)) { raw = decodeURIComponent(c.substring(prefix.length)); break; }
    }
    if (!raw) return;
    try {
      var s = JSON.parse(raw);
      this.renderer.setStyle(this.pane, 'position',   'fixed');
      this.renderer.setStyle(this.pane, 'left',        s.left   + 'px');
      this.renderer.setStyle(this.pane, 'top',         s.top    + 'px');
      this.renderer.setStyle(this.pane, 'width',       s.width  + 'px');
      this.renderer.setStyle(this.pane, 'height',      s.height + 'px');
      this.renderer.setStyle(this.pane, 'max-width',   'none');
      this.renderer.setStyle(this.pane, 'max-height',  'none');
      this.renderer.setStyle(this.pane, 'transform',   'translate3d(0px, 0px, 0px)');
    } catch {}
  }

  // ────────────────────────────────────────────────────────────────────────────

  private createHandles(): void {
    var defs = [
      { edge: 'n',  top: '0',    left: '6px',  right: '6px',  bottom: '',    width: '',      height: '6px',  cursor: 'n-resize',  cls: ''         },
      { edge: 's',  top: '',     left: '6px',  right: '6px',  bottom: '0',   width: '',      height: '6px',  cursor: 's-resize',  cls: ''         },
      { edge: 'e',  top: '6px',  left: '',     right: '0',    bottom: '6px', width: '6px',   height: '',     cursor: 'e-resize',  cls: ''         },
      { edge: 'w',  top: '6px',  left: '0',    right: '',     bottom: '6px', width: '6px',   height: '',     cursor: 'w-resize',  cls: ''         },
      { edge: 'ne', top: '0',    left: '',     right: '0',    bottom: '',    width: '6px',   height: '6px',  cursor: 'ne-resize', cls: ''         },
      { edge: 'nw', top: '0',    left: '0',    right: '',     bottom: '',    width: '6px',   height: '6px',  cursor: 'nw-resize', cls: ''         },
      { edge: 'se', top: '',     left: '',     right: '0',    bottom: '0',   width: '12px',  height: '12px', cursor: 'se-resize', cls: 'esq-dialog-resize-se' },
      { edge: 'sw', top: '',     left: '0',    right: '',     bottom: '0',   width: '6px',   height: '6px',  cursor: 'sw-resize', cls: ''         },
    ];
    for (var i = 0; i < defs.length; i++) {
      var def = defs[i];
      var handle: HTMLElement = this.renderer.createElement('div');
      this.renderer.setStyle(handle, 'position', 'absolute');
      this.renderer.setStyle(handle, 'z-index', '1000');
      this.renderer.setStyle(handle, 'cursor', def.cursor);
      if (def.top)    this.renderer.setStyle(handle, 'top',    def.top);
      if (def.left)   this.renderer.setStyle(handle, 'left',   def.left);
      if (def.right)  this.renderer.setStyle(handle, 'right',  def.right);
      if (def.bottom) this.renderer.setStyle(handle, 'bottom', def.bottom);
      if (def.width)  this.renderer.setStyle(handle, 'width',  def.width);
      if (def.height) this.renderer.setStyle(handle, 'height', def.height);
      if (def.cls)    this.renderer.addClass(handle, def.cls);
      this.addHandleMousedown(handle, def.edge);
      this.renderer.appendChild(this.pane, handle);
    }
  }

  private addHandleMousedown(handle: HTMLElement, edge: string): void {
    this.zone.runOutsideAngular(() => {
      handle.addEventListener('mousedown', (e: MouseEvent) => this.onMouseDown(e, edge));
    });
  }

  private onMouseDown(event: MouseEvent, edge: string): void {
    event.preventDefault();
    event.stopPropagation();
    var rect = this.pane.getBoundingClientRect();
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startLeft = rect.left;
    this.startTop = rect.top;
    this.startWidth = rect.width;
    this.startHeight = rect.height;
    this.renderer.setStyle(this.pane, 'position',   'fixed');
    this.renderer.setStyle(this.pane, 'left',        rect.left   + 'px');
    this.renderer.setStyle(this.pane, 'top',         rect.top    + 'px');
    this.renderer.setStyle(this.pane, 'width',       rect.width  + 'px');
    this.renderer.setStyle(this.pane, 'height',      rect.height + 'px');
    this.renderer.setStyle(this.pane, 'transform',   'none');
    this.renderer.setStyle(this.pane, 'max-width',   'none');
    this.renderer.setStyle(this.pane, 'max-height',  'none');
    this.activeEdge = edge;
    this.resizing = true;
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.resizing) {
      return;
    }
    var dx = event.clientX - this.startX;
    var dy = event.clientY - this.startY;
    var style = window.getComputedStyle(this.pane);
    var minW = parseFloat(style.minWidth)  || 100;
    var minH = parseFloat(style.minHeight) || 100;
    if (this.activeEdge.includes('e')) {
      this.renderer.setStyle(this.pane, 'width', Math.max(this.startWidth + dx, minW) + 'px');
    }
    if (this.activeEdge.includes('s')) {
      this.renderer.setStyle(this.pane, 'height', Math.max(this.startHeight + dy, minH) + 'px');
    }
    if (this.activeEdge.includes('w')) {
      var newWidth = Math.max(this.startWidth - dx, minW);
      this.renderer.setStyle(this.pane, 'width', newWidth + 'px');
      this.renderer.setStyle(this.pane, 'left', (this.startLeft + this.startWidth - newWidth) + 'px');
    }
    if (this.activeEdge.includes('n')) {
      var newHeight = Math.max(this.startHeight - dy, minH);
      this.renderer.setStyle(this.pane, 'height', newHeight + 'px');
      this.renderer.setStyle(this.pane, 'top', (this.startTop + this.startHeight - newHeight) + 'px');
    }
  }

  private onMouseUp(): void {
    if (this.resizing) {
      this.resizing = false;
      this.activeEdge = '';
      this.saveState();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
