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
* 02/04/2026 mir0n use ChangeDetectorRef to obntain dialog heading
* 02/05/2026 mir0n use EsqTabFieldComponent
* 02/12/2026 mir0n  EsqNodeType in explicit file
* 02/13/2026 mir0n  EsqNodeType renamed with EsqObjectKind
* 02/17/2026 mir0n  added userId field
* 02/18/2026 mir0n  added Save/Refresh buttons with change tracking
*                   wired onSave() to restApi.esquireKeySave()
*                   fixed change tracking: use component property instead of async alias
* 02/28/2026 mir0n  saveData()/loadData() refactored: Observable-based, tab restore, catchError
*                   added ngAfterViewChecked() with pendingTabRestore
*                   removed ChangeDetectorRef dependency; removed tabContent()
* 03/06/2026 mir0n  saveData catchError: RFC 7807 errors[] — alert + focusField on server validation error
*                   focusField call wrapped in setTimeout to defer after snapshot re-render
*                   fixed double details$ async subscription (second pipe replaced with details property)
* 03/16/2026 mir0n  saving flag: Save button disabled while save is in progress
* 03/26/2026 mir0n  confirmDlg() replaces alert()/confirm(); callApi added
*/
import {AfterViewChecked,
  AfterViewInit,
  Component,
  inject,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {MatButton, MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { catchError, EMPTY, Observable, of, tap } from 'rxjs';
import { CommonModule } from '@angular/common'
import {MatTableModule } from '@angular/material/table';
import {EsqTabFieldComponent} from "./EsqTabFieldComponent";
import {EsqUtils} from "./EsqUtils";
import {EsqValidationError} from "./EsqValidationError";

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
import {EsqExplorerCallApi} from 'src/esquire.ui/api/EsqExplorerCallApi';
import {EsqDictionaryApi} from 'src/esquire.ui/api/EsqDictionaryApi';
import {EsqEntityLayer} from 'src/esquire.ui/api/EsqEntityDictionary';
import { EsqTabIknListComponent } from "./EsqTabIknListComponent";
import { EsqTabIknfTableComponent } from "./EsqTabIknfTableComponent";
import { EsqTabStringComponent } from "./EsqTabStringComponent";

@Component({
  selector: 'details-dialog',
  templateUrl: './EsqAccessProfileDialog.html',
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
    ],
  encapsulation: ViewEncapsulation.None,
})

export class EsqAccessProfileDialog implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
   @ViewChild('btnClose') btnClose! : MatButton;
   @ViewChild('btnSave') btnSave! : MatButton;
   @ViewChild(MatTabGroup) tabGroup! : MatTabGroup;
   private dialogRef: MatDialogRef<EsqAccessProfileDialog>;
   private restApi: EsqRestApi;
   private dictionaryApi: EsqDictionaryApi;
   public callApi: EsqExplorerCallApi;

   public readOnly: boolean = false;
   public userId:string = "";
   public details: any = null;
   public details$: Observable<any> | undefined;
   public dictionary$: Observable<EsqEntityLayer[]> | undefined;
   private dictionary: EsqEntityLayer[] = [];
   public id:string = "";
   public headerIcon:string = "";
   public headerName:string = "";
   private originalDetails: any = null;
   private pendingTabRestore: number | null = null;
   public saving: boolean = false;

  constructor(
      dialogRef: MatDialogRef<EsqAccessProfileDialog>,
      @Inject(MAT_DIALOG_DATA) data: any
    ) {
      this.dialogRef = dialogRef;
      this.id = data.id;

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

  async onClose(): Promise<void> {
    if (this.hasChanges()) {
      var result = await this.callApi.confirmDlg(null,
          'Unsaved Changes',
          'You have unsaved changes. Do you want to save them?',
          EsqExplorerCallApi.ConfirmFlag.YesNo);
      if (result === 0) {
        this.btnSave?.focus();
        return;
      }
    }
    this.dialogRef.close();
  }

  async onSave(): Promise<void> {
    var savedTab: number = this.tabGroup?.selectedIndex ?? 0;
    var error: EsqValidationError | null = EsqUtils.validateFields(this.details, this.dictionary);
    if (error) {
      await this.callApi.confirmDlg(null, 'Validation Error', error.message, EsqExplorerCallApi.ConfirmFlag.Ok);
      this.focusField(error);
    } else {
      var changes = EsqUtils.getChangedFields(this.originalDetails, this.details);
      if (changes) {
        EsqUtils.log('Save changes:', changes);
        var body = { id: this.id, ...changes };
        this.saveData(body, savedTab);
      }
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
    var savedTab: number = this.tabGroup?.selectedIndex ?? 0;
    this.loadData(savedTab);
  }

  ngOnInit() {
      this.dictionary$ = this.dictionaryApi.dictionary(EsqObjectKindFactory.ACCESSPROFILE.id).pipe(
        tap(dict => { this.dictionary = dict; })
      );
      this.loadData();
  }

  private loadData(restoreTab?: number): void {
    this.details$ = this.restApi.esquireKey(this.id).pipe(
      tap(details => {
        this.details = details;
        this.originalDetails = EsqUtils.deepCopy(details);
        this.headerIcon = EsqObjectKindFactory.instanceOf(details.kind).icon;
        this.headerName = details.name || 'No defined';
        if (restoreTab) {
          this.pendingTabRestore = restoreTab;
        }
      }),
      catchError(err => {
        void this.callApi?.confirmDlg(null, 'Load Error', 'Load failed: ' + (err.detail || err.title || err), EsqExplorerCallApi.ConfirmFlag.Ok);
        return EMPTY;
      })
    );
  }

  private saveData(body: any, restoreTab?: number): void {
    var snapshot = this.details;
    this.saving = true;
    this.details$ = this.restApi.esquireKeySave(this.id, body).pipe(
      tap(details => {
        this.saving = false;
        this.details = details;
        this.originalDetails = EsqUtils.deepCopy(details);
        if (restoreTab) {
          this.pendingTabRestore = restoreTab;
        }
      }),
      catchError(err => {
        this.saving = false;
        if (err.errors && err.errors.length > 0) {
          var apiErr = err.errors[0];
          var valError: EsqValidationError = {
            fieldName: apiErr.fieldName,
            fieldLabel: apiErr.fieldLabel,
            message: apiErr.message,
            tabIndex: parseInt(apiErr.tabIndex, 10) || 0
          };
          void this.callApi?.confirmDlg(null, 'Save Error', 'Save failed: ' + (err.detail || valError.message), EsqExplorerCallApi.ConfirmFlag.Ok).then(() => this.focusField(valError));
        } else {
          void this.callApi?.confirmDlg(null, 'Save Error', 'Save failed: ' + (err.detail || err.title || err), EsqExplorerCallApi.ConfirmFlag.Ok);
        }
        return of(snapshot);
      })
    );
  }

  ngOnDestroy() {
    this.details = null;
    this.details$ = undefined;
    this.dictionary$ = undefined;
  }

  ngAfterViewChecked() {
    if (this.pendingTabRestore !== null) {
      this.tabGroup.selectedIndex = this.pendingTabRestore;
      this.pendingTabRestore = null;
    }
  }

  ngAfterViewInit() {
    if (this.btnClose)  {
       this.btnClose.focus();
    }
  }

}
