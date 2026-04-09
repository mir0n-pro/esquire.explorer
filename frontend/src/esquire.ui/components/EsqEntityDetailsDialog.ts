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
* 02/28/2026 mir0n  fields made protected to enable inheritance
*                   added subdictionary() for sync sub-entity kind lookup
*                   hasChanges() and onSave() extended for sub-entity fields
*                   saveData()/loadData() refactored: Observable-based, tab restore, catchError
*                   added ngAfterViewChecked() with pendingTabRestore
*                   tabContent() switched from index to tab.title
*                   removed ChangeDetectorRef dependency
* 03/06/2026 mir0n  saveData catchError: RFC 7807 errors[] — alert + focusField on server validation error
*                   focusField call wrapped in setTimeout to defer after snapshot re-render
* 03/16/2026 mir0n  saving flag: Save button disabled while save is in progress
* 03/20/2026 mir0n  tree refresh on affects3 save: needsTreeRefresh flag, treeRefresh param on saveData()
* 03/26/2026 mir0n  isCreating()/onCreate() hooks for EsqCreateEntityDialog subclass
*                   treeRefreshResult() virtual method; closeConfirmMessage() hook
* 03/26/2026 mir0n  confirmDlg() replaces alert()/confirm(); callApi added
* 03/27/2026 mir0n  EsqDialogResizeDirective added to imports
* 03/31/2026 mir0n  ESC key closes dialog (prompts if unsaved changes)
* 04/08/2026 mir0n  EsqEntityDetailsDialog extends EsqExplorerHostDummy
*                   handle EsqExplorerHost.setLoading()
*                   saving() sygnal cleanup
*/

import {AfterViewChecked,
  AfterViewInit,
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  signal
} from '@angular/core';
import {MatButton, MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {EsqDialogResizeDirective} from './EsqDialogResizeDirective';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { catchError, EMPTY, finalize, Observable, of, tap } from 'rxjs';
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
import {EsqExplorerCallApi, EsqExplorerHost, EsqExplorerHostDummy} from 'src/esquire.ui/api/EsqExplorerCallApi';
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
          EsqDialogResizeDirective,
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

export class EsqEntityDetailsDialog extends EsqExplorerHostDummy implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
   @ViewChild('btnClose') btnClose! : MatButton;
   @ViewChild('btnSave') btnSave! : MatButton;
   @ViewChild(MatTabGroup) tabGroup! : MatTabGroup;
   protected dialogRef: MatDialogRef<EsqEntityDetailsDialog>;

   protected restApi: EsqRestApi;
   protected dictionaryApi: EsqDictionaryApi;
   public callApi: EsqExplorerCallApi;

   public readOnly: boolean = false;
   public userId:string = "";
   public details: any = null;
   public details$: Observable<any> | undefined;
   public dictionary$: Observable<EsqEntityLayer[]> | undefined;
   protected dictionary: EsqEntityLayer[] = [];
   protected pendingTabRestore: number | null = null;
   public saving: boolean = false;
   public loading = signal(false);
   protected originalDetails: any = null;
   protected needsTreeRefresh: boolean = false;

   protected givenEntityId:string = "";
   protected givenEntityKind:number = -1;
   public headerIcon:string = "";
   public headerName:string = "";

  constructor(
      dialogRef: MatDialogRef<EsqEntityDetailsDialog>,
      @Inject(MAT_DIALOG_DATA) data: any
    ) {
      super();
      this.dialogRef = dialogRef;
      this.restApi = data.restApi;
      this.dictionaryApi = data.dictionaryApi;
      this.callApi = data.callApi;
      this.readOnly = data.readOnly;
      this.userId = data.userId;

      this.givenEntityId = data.id;
      this.givenEntityKind = data.kind;

      this.dialogRef.disableClose = true;
      this.dialogRef.addPanelClass('esq-dialog');
      this.dialogRef.updateSize('60vw', '60vh');
    }

  //closeDialog(): void {
  //  this.dialogRef.close();
  //}

  hasChanges(): boolean {
    var ret: boolean =  (EsqUtils.getChangedFields(this.originalDetails, this.details) !== null);
    if (!ret) {
        for (var tab of this.dictionary) {
            for (var field of tab.fields) {
                if (field.type === 'subentity' && !ret) {
                    ret = EsqUtils.getChangedFields(this.originalDetails?.[field.name], this.details?.[field.name]) !== null;
                    if (ret) {
                        break;
                    }
                }
            }
        }
    }
    return ret;
  }

  @HostListener('keydown.escape')
  async onClose(): Promise<void> {
    if (this.hasChanges()) {
      var result = await this.callApi.confirmDlg(EsqObjectKindFactory.instanceOf(this.givenEntityKind),
          (this.headerName ?? '')  + ' Unsaved Changes',
          'You have made changes. Do you want to save them?',
          EsqExplorerCallApi.ConfirmFlag.YesNo,
          0);
      if (result === 0) {
        this.btnSave?.focus();
        return;
      }
    }
    this.dialogRef.close(this.needsTreeRefresh ? this.treeRefreshResult() : undefined);
  }

  protected treeRefreshResult(): string {
    return 'treeRefresh';
  }

  async onSave(): Promise<void> {
    var savedTab: number = this.tabGroup?.selectedIndex ?? 0;
    var changes: Record<string, any>|null = null;
    var error: EsqValidationError | null = EsqUtils.validateFields(this.details, this.dictionary);
    if (!error) {
      changes = EsqUtils.getChangedFields(this.originalDetails, this.details) ?? {};
      for (var tabIndex = 0; tabIndex < this.dictionary.length && !error; tabIndex++) {
        for (var field of this.dictionary[tabIndex].fields) {
          if (field.type === 'subentity') {
            var subDict = this.subdictionary(this.details?.[field.name]?.kind);
            var subError = EsqUtils.validateFields(this.details?.[field.name], subDict);
            if (subError) {
                        error = {
                            fieldName: subError.fieldName,
                            fieldLabel: subError.fieldLabel,
                            message: subError.message,
                            tabIndex: tabIndex
                        };
              break;
            }
            var subChanges = EsqUtils.getChangedFields(this.originalDetails?.[field.name], this.details?.[field.name]);
            if (subChanges) {
              var subData = this.details[field.name];
                        changes[field.name] = {id: subData.id, kind: subData.kind, ...subChanges};
            }
          }
        }
      }
    }
    if (error) {
      await this.callApi.confirmDlg(EsqObjectKindFactory.instanceOf(this.givenEntityKind),
          (this.headerName ?? '')  + ' Validation Error',
          error.message,
          EsqExplorerCallApi.ConfirmFlag.Ok);
      this.focusField(error);
    } else if (changes && Object.keys(changes).length > 0) {
      EsqUtils.log('Save changes:', changes);
      var treeRefresh = this.dictionary.some(tab =>
        tab.fields.some(f => {
          if (f.affects3 === 'Y' && Object.prototype.hasOwnProperty.call(changes, f.name)) {
            return true;
          }
          if (f.type === 'subentity' && Object.prototype.hasOwnProperty.call(changes, f.name)) {
            var subDict = this.subdictionary(this.details?.[f.name]?.kind);
            return subDict.some(subTab =>
              subTab.fields.some(sf => sf.affects3 === 'Y' && Object.prototype.hasOwnProperty.call(changes![f.name], sf.name))
            );
          }
          return false;
        })
      );
      var body = { id: this.givenEntityId, kind: this.givenEntityKind, ...changes };
      this.saveData(body, savedTab, treeRefresh);
    }
  }

  public subdictionary(kindId: any): EsqEntityLayer[] {
    var ret: EsqEntityLayer[] = [];
    if (kindId) {
      ret = this.dictionaryApi.dictionaryFromCache(kindId as number);
    }
    return ret;
  }

  focusField(error: EsqValidationError): void {
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
      this.dictionary$ = this.dictionaryApi.dictionary(this.givenEntityKind).pipe(
        tap(dict => { this.dictionary = dict; })
      );
      this.callApi?.registerHost(this);
      this.loadData();
  }

  override setLoading(loading: boolean): void {
    this.loading.set(loading);
  }

  loadData(restoreTab?: number): void {
    this.details$ = this.restApi.esquireCmd(this.givenEntityKind, this.givenEntityId).pipe(
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
        void this.callApi?.confirmDlg(EsqObjectKindFactory.instanceOf(this.givenEntityKind),
            (this.headerName ?? '')  + ' Load Error',
            'Load failed: ' + (err.detail || err.title || err),
            EsqExplorerCallApi.ConfirmFlag.Ok);
        return EMPTY;
      })
    );
  }

  saveData(body: any, restoreTab?: number, treeRefresh?: boolean): void {
    var snapshot = this.details;
    this.saving = true;
    this.details$ = this.restApi.esquireCmdSave(this.givenEntityKind, this.givenEntityId, body).pipe(
      tap(details => {
        this.details = details;
        this.originalDetails = EsqUtils.deepCopy(details);
        if (treeRefresh) {
          this.needsTreeRefresh = true;
        }
        if (restoreTab) {
          this.pendingTabRestore = restoreTab;
        }
      }),
      catchError(err => {
        if (err.errors && err.errors.length > 0) {
          var apiErr = err.errors[0];
          var valError: EsqValidationError = {
            fieldName: apiErr.fieldName,
            fieldLabel: apiErr.fieldLabel,
            message: apiErr.message,
            tabIndex: parseInt(apiErr.tabIndex, 10) || 0
          };
          void this.callApi?.confirmDlg(EsqObjectKindFactory.instanceOf(this.givenEntityKind),
              (this.headerName ?? '')  + ' Save Error',
              'Save failed: ' + (err.detail || valError.message),
              EsqExplorerCallApi.ConfirmFlag.Ok).then(() => this.focusField(valError));
        } else {
          void this.callApi?.confirmDlg(EsqObjectKindFactory.instanceOf(this.givenEntityKind),
              (this.headerName ?? '')  + ' disaSave Error',
              'Save failed: ' + (err.detail || err.title || err),
              EsqExplorerCallApi.ConfirmFlag.Ok);
        }
        return of(snapshot);
      }),
      finalize(() => { this.saving = false; })
    );
  }


ngOnDestroy() {
    this.callApi?.unregisterHost(this);
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

  tabContent (title:string):string {
    return title == "Description" ? "esq-other-tab-content" : "esq-first-tab-content";
  }

  public isCreating(): boolean {
    return false;
  }

  public onCreate(): void {
    // overridden in EsqCreateEntityDialog
  }

}
