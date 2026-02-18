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
* 02/04/2024 miron renamed with EsqNodeDetailsDialog (was EsqNodeEntityDetailsDialog)
* 02/05/2026 mir0n use EsqTabFieldComponent
* 02/12/2026 mir0n  EsqNodeType in explicit file
* 02/13/2026 mir0n  EsqNodeType renamed with EsqObjectKind
* 02/17/2026 mir0n  added fieldReadOnly method with personal flag support
*                   added userId field
* 02/18/2026 mir0n  added Save/Refresh buttons with change tracking
*                   wired onSave() to restApi.esquireCmdSave()
*/
import {AfterViewInit,
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
import { firstValueFrom, from, lastValueFrom, Observable, tap } from 'rxjs';
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
import {EsqObjectKind} from 'src/esquire.ui/api/EsqObjectKind';
import {EsqObjectKindFactory} from 'src/esquire.ui/api/EsqObjectKindFactory';
import {EsqRestApi} from 'src/esquire.ui/api/EsqRestApi';
import {EsqTreeNode} from 'src/esquire.ui/api/EsqTreeNode';
import {EsqNodeStatusFactory} from 'src/esquire.ui/api/EsqNodeStatusFactory';
import {EsqExplorerCallApi} from 'src/esquire.ui/api/EsqExplorerCallApi';
import {EsqDictionaryApi} from 'src/esquire.ui/api/EsqDictionaryApi';
import {EsqEntityLayer} from 'src/esquire.ui/api/EsqEntityDictionary';
import {EsqTabFieldComponent} from "./EsqTabFieldComponent";
import {FormsModule} from "@angular/forms";
import {EsqUtils} from "./EsqUtils";
import {EsqValidationError} from "./EsqValidationError";

  @Component({
  selector: 'details-dialog',
  templateUrl: './EsqNodeDetailsDialog.html',
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
          EsqTabFieldComponent,
          FormsModule
      ],
  encapsulation: ViewEncapsulation.None,
})

export class EsqNodeDetailsDialog implements OnInit,  AfterViewInit, OnDestroy {
   @ViewChild('btnClose') btnClose! : MatButton;
   @ViewChild('btnSave') btnSave! : MatButton;
   @ViewChild(MatTabGroup) tabGroup! : MatTabGroup;
   private dialogRef: MatDialogRef<EsqNodeDetailsDialog>;
   public node : EsqTreeNode;
   private restApi: EsqRestApi;
   private dictionaryApi: EsqDictionaryApi;
   public callApi: EsqExplorerCallApi;

   public readOnly: boolean = false;
   public userId:string = "";
   public dictionary$: Observable<EsqEntityLayer[]> | undefined;
   private dictionary: EsqEntityLayer[] = [];
   readonly detailsDialog:MatDialog = inject(MatDialog);
   private originalDetails: any = null;
   public details: any = null;
   public details$: Observable<any> | undefined;

  constructor(
      dialogRef: MatDialogRef<EsqNodeDetailsDialog>,
      @Inject(MAT_DIALOG_DATA) data: any
    ) {
      this.dialogRef = dialogRef;

      this.node = data.node;
      this.restApi = data.restApi;
      this.dictionaryApi = data.dictionaryApi;
      this.callApi = data.callApi;
      this.readOnly = data.readOnly;
      this.userId = data.userId;

      this.dialogRef.disableClose = true;
      this.dialogRef.addPanelClass('esq-dialog');
      this.dialogRef.updateSize('60vw', '60vh');
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
      var body = { id: this.node.entityId, kind: this.node.kind.id, ...changes };
      this.restApi.esquireCmdSave(this.node.kind.id, this.node.entityId, body).subscribe({
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
    if (this.node.kind.detailed) {
      this.dictionary$ = this.dictionaryApi.dictionary(this.node.kind.id).pipe(
        tap(dict => { this.dictionary = dict; })
      );
      this.loadData();
    }
  }

  private loadData(): void {
    this.details$ = this.restApi.esquireCmd(this.node.kind.id, this.node.entityId).pipe(
      tap(details => {
        this.details = details;
        this.originalDetails = EsqUtils.deepCopy(details);
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

  nodeStatusIcon() {
    return EsqNodeStatusFactory.instanceOf(this.node.statusCode).icon;
  }

  nodeTypeName():string {
    return this.node.kind.name + (this.node.linkId?" (shortcut)" : "");
  }

  nodeTypeFromFormat(format:string) : EsqObjectKind {
    var id:number = -1; //unknown
    if (format) {
      var ftype:string[] = format.split('=');
      if (ftype.length > 1 && ftype[0] == 'kind') {
        id = Number(ftype[1]);
      }
    }
    return EsqObjectKindFactory.instanceOf(id);
  }

  fieldReadOnly(readwrite: number, personal?: string): boolean {
      var ret:boolean = true;
      if (String(this.node.entityId) === String(this.userId)) {
          // "personal" mode: only applicable fields
          ret = !("Y" === personal && readwrite == 3);
      } else {
          ret = this.readOnly || readwrite < 3;
      }    return ret;
  }

  tabContent (index:number):string {
    return index == 0 ? "esq-first-tab-content" :  "esq-other-tab-content";
  }
}
