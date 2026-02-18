/*
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 12/24/2025 mir0n added processing of tabstring field value type
*                  readOnly made public
*                  kind parameter is requried for esq-cmd, esq-enode
*                  listvalues_kind moved inside of generic format
* 02/01/2026 mir0n EsqTabLStringComponent renamed with EsqTabStringComponent
*                  added use EsqTabIknListComponent
* 02/04/2026 mir0n use ChangeDetectorRef to obtain dialog heading
*                  require id and kind to run, not a tree node
* 02/05/2026 mir0n use EsqTabFieldComponent
* 02/13/2026 mir0n  EsqNodeType renamed with EsqObjectKind
* 02/17/2026 mir0n  added userId field
* 02/18/2026 mir0n  added Save/Refresh buttons with change tracking
*                   wired onSave() to restApi.esquireCmdSave()
*/
import {AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {MatButton, MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { Observable, tap } from 'rxjs';
import { CommonModule } from '@angular/common'
import {MatTableModule } from '@angular/material/table';
/*
import { EsqNodeType
  , EsqNodeTypeFactory
  , EsqRestApi
  , EsqTreeNode
  , EsqNodeStatusFactory
  , EsqExplorerCallApi
  , EsqDictionaryApi, EsqEntityLayer
} from '@mir0n-pro/esquire.ui/api';
*/

import {EsqObjectKindFactory} from 'src/esquire.ui/api/EsqObjectKindFactory';
import {EsqRestApi} from 'src/esquire.ui/api/EsqRestApi';
import {EsqExplorerCallApi} from 'src/esquire.ui/api/EsqExplorerCallApi';
import {EsqDictionaryApi} from 'src/esquire.ui/api/EsqDictionaryApi';
import {EsqEntityLayer} from 'src/esquire.ui/api/EsqEntityDictionary';

import {EsqTabFieldComponent} from "./EsqTabFieldComponent";
import {EsqUtils} from "./EsqUtils";
import {EsqValidationError} from "./EsqValidationError";

  @Component({
  selector: 'details-dialog',
  templateUrl: './EsqEntityDetailsDialog.html',
  styleUrl: './EsqDetailsDialog.scss',
      imports: [
          MatDialogModule,
          MatButtonModule,
          MatTooltipModule,
          DragDropModule,
          MatIcon,
          MatToolbarModule,
          MatTabsModule,
          MatDividerModule,
          CommonModule,
          MatTableModule,
          EsqTabFieldComponent
      ],
  encapsulation: ViewEncapsulation.None,
})

export class EsqEntityDetailsDialog implements OnInit,  AfterViewInit, OnDestroy {
   @ViewChild('btnClose') btnClose! : MatButton;
   @ViewChild('btnSave') btnSave! : MatButton;
   @ViewChild(MatTabGroup) tabGroup! : MatTabGroup;
   private dialogRef: MatDialogRef<EsqEntityDetailsDialog>;

   private restApi: EsqRestApi;
   private dictionaryApi: EsqDictionaryApi;
   public callApi: EsqExplorerCallApi;

   public readOnly: boolean = false;
   public userId:string = "";
   public details: any = null;
   public details$: Observable<any> | undefined;
   public dictionary$: Observable<EsqEntityLayer[]> | undefined;
   private dictionary: EsqEntityLayer[] = [];
   readonly detailsDialog:MatDialog = inject(MatDialog);
   private givenEntityId:string = "";
   private givenEntityKind:number = -1;
   public headerIcon:string = "";
   public headerName:string = "";
   private originalDetails: any = null;

  constructor(
      dialogRef: MatDialogRef<EsqEntityDetailsDialog>,
      @Inject(MAT_DIALOG_DATA) data: any,
      private cdr: ChangeDetectorRef
    ) {
      this.dialogRef = dialogRef;

      this.givenEntityId = data.id;
      this.givenEntityKind = data.kind;
      this.restApi = data.restApi;
      this.dictionaryApi = data.dictionaryApi;
      this.callApi = data.callApi;
      this.readOnly = data.readOnly;
      this.userId = data.userId;

      this.dialogRef.disableClose = true;
      this.dialogRef.addPanelClass('esq-dialog');
      this.dialogRef.updateSize('60vw', '60vh');
    }

  closeDialog(): void {
    this.dialogRef.close();
  }

  hasChanges(): boolean {
    return EsqUtils.getChangedFields(this.originalDetails, this.details) !== null;
  }

  onClose(): void {
    if (this.hasChanges()) {
      if (confirm('You have unsaved changes. Press OK to save, or Cancel to discard.')) {
        this.btnSave?.focus();
        return;
      }
    }
    this.dialogRef.close();
  }

  onSave(): void {
    var error: EsqValidationError | null = EsqUtils.validateFields(this.details, this.dictionary);
    if (error) {
      alert(error.message);
      this.focusField(error);
      return;
    }
    var changes = EsqUtils.getChangedFields(this.originalDetails, this.details);
    if (changes) {
      EsqUtils.log('Save changes:', changes);
      var body = { id: this.givenEntityId, kind: this.givenEntityKind, ...changes };
      this.restApi.esquireCmdSave(this.givenEntityKind, this.givenEntityId, body).subscribe({
        next: () => {
          this.originalDetails = EsqUtils.deepCopy(this.details);
        },
        error: (err: any) => {
          alert('Save failed: ' + (err.detail || err.title || err));
        }
      });
    }
  }

  private focusField(error: EsqValidationError): void {
    if (this.tabGroup) {
      this.tabGroup.selectedIndex = error.tabIndex;
    }
    setTimeout(() => {
      var el = document.querySelector('[data-field="' + error.fieldName + '"]') as HTMLElement;
      if (el) {
        el.focus();
      }
    }, 100);
  }

  onRefresh(): void {
    this.loadData();
  }

  ngOnInit() {
    this.dictionary$ = this.dictionaryApi.dictionary(this.givenEntityKind).pipe(
      tap(dict => { this.dictionary = dict; })
    );
    this.loadData();
  }

  private loadData(): void {
    this.details$ = this.restApi.esquireCmd(this.givenEntityKind, this.givenEntityId).pipe(
      tap(details => {
        this.details = details;
        this.originalDetails = EsqUtils.deepCopy(details);
        this.headerIcon = EsqObjectKindFactory.instanceOf(details.kind).icon;
        this.headerName = details.name || 'No defined';
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    this.details = null;
    this.details$ = undefined;
    this.dictionary$ = undefined;
  }

  ngAfterViewInit() {
    if (this.btnClose)  {
       this.btnClose.focus();
    }
  }

  tabContent (index:number):string {
    return index == 0 ? "esq-first-tab-content" :  "esq-other-tab-content";
  }
}
