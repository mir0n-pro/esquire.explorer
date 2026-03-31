/*
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 03/26/2026 mir0n  initial; focus param; ConfirmFlag type; no X button
* 03/27/2026 mir0n  EsqDialogResizeDirective added; userId field for dialog position persistence
* 03/31/2026 mir0n  ArrowLeft/Right key navigation between buttons
*/
import {AfterViewInit, Component, Inject, QueryList, ViewChildren, ViewEncapsulation} from '@angular/core';
import {MatButton, MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatToolbarModule} from '@angular/material/toolbar';
import {EsqObjectKind} from 'src/esquire.ui/api/EsqObjectKind';
import {EsqExplorerCallApi} from 'src/esquire.ui/api/EsqExplorerCallApi';
import {EsqDialogResizeDirective} from './EsqDialogResizeDirective';

@Component({
  selector: 'esq-confirm-dialog',
  templateUrl: './EsqConfirmDialog.html',
  styleUrl: './EsqDetailsDialog.scss',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    DragDropModule,
    MatToolbarModule,
    EsqDialogResizeDirective,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class EsqConfirmDialog implements AfterViewInit {

  @ViewChildren(MatButton) buttons!: QueryList<MatButton>;

  protected dialogRef: MatDialogRef<EsqConfirmDialog>;
  public kind: EsqObjectKind | null;
  public header: string;
  public text: string;
  public flag: EsqExplorerCallApi.ConfirmFlag;
  public focus: number;
  public userId: string;

  constructor(
    dialogRef: MatDialogRef<EsqConfirmDialog>,
    @Inject(MAT_DIALOG_DATA) data: any
  ) {
    this.dialogRef = dialogRef;
    this.kind = data.kind ?? null;
    this.header = data.header ?? '';
    this.text = data.text ?? '';
    this.flag = data.flag ?? EsqExplorerCallApi.ConfirmFlag.Ok;
    this.focus = data.focus ?? 0;
    this.userId = data.userId ?? '';
    this.dialogRef.disableClose = true;
    this.dialogRef.addPanelClass('esq-dialog');
  }

  ngAfterViewInit(): void {
    var btn = this.buttons.get(this.focus);
    if (btn) {
      btn.focus();
    }
  }

  protected onButtonKeydown(event: KeyboardEvent, idx: number): void {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      var count = this.buttons.length;
      var next = event.key === 'ArrowRight' ? (idx + 1) % count : (idx - 1 + count) % count;
      var btn = this.buttons.get(next);
      if (btn) btn.focus();
    }
  }

  onOkYes(): void {
    this.dialogRef.close(0);
  }

  onNoCancel(): void {
    this.dialogRef.close(1);
  }

}
