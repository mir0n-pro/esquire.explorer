/*
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 03/26/2026 mir0n  initial: two-phase Create→Edit dialog extending EsqEntityDetailsDialog
*                   subentity validation in onCreate(); closeConfirmMessage() override
* 03/26/2026 mir0n  confirmDlg() replaces alert()/confirm(); callApi added
* 03/27/2026 mir0n  EsqDialogResizeDirective added to imports
* 03/28/2026 mir0n  inject dictionary defaults for main entity and subentities in ngOnInit()
*/

import {
  Component,
  Inject,
  ViewEncapsulation
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {EsqDialogResizeDirective} from './EsqDialogResizeDirective';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { catchError, firstValueFrom, of, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';

import {EsqObjectKindFactory} from 'src/esquire.ui/api/EsqObjectKindFactory';
import {EsqTabFieldComponent} from './EsqTabFieldComponent';
import {EsqUtils} from './EsqUtils';
import {EsqValidationError} from './EsqValidationError';
import {EsqEntityDetailsDialog} from './EsqEntityDetailsDialog';
import {EsqExplorerCallApi} from 'src/esquire.ui/api/EsqExplorerCallApi';
import {EsqEntityField, EsqEntityLayer} from 'src/esquire.ui/api/EsqEntityDictionary';

@Component({
  selector: 'create-entity-dialog',
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
export class EsqCreateEntityDialog extends EsqEntityDetailsDialog {

  private _isCreating: boolean = true;
  protected parentId: string = "";
  private onError?: (msg: string, err?: any) => void;

  constructor(
    dialogRef: MatDialogRef<EsqCreateEntityDialog>,
    @Inject(MAT_DIALOG_DATA) data: any
  ) {
    super(dialogRef as any, data);
    this.parentId = data.parentId || "";
    this.onError = data.onError;
  }

  public override isCreating(): boolean {
    return this._isCreating;
  }

  protected override treeRefreshResult(): string {
    return !this._isCreating ? ('treeRefreshSelect:' + this.givenEntityId) : 'treeRefresh';
  }

  override ngOnInit(): void {
    var kindObj = EsqObjectKindFactory.instanceOf(this.givenEntityKind);
    this.details = { kind: this.givenEntityKind };
    this.details$ = of(this.details);
    this.headerIcon = kindObj.icon;
    this.headerName = "New " + kindObj.name;
    this.dictionary$ = this.dictionaryApi.dictionary(this.givenEntityKind).pipe(
      tap(dict => {
        this.dictionary = dict;
        for (var tab of dict) {
          for (var field of tab.fields) {
            if (field.type === 'subentity' && !this.details[field.name]) {
              var subKind: number = this.esqSubKind(field);
              if (subKind > 0) {
                this.details[field.name] = { kind: subKind };
              }
            }
          }
        }
        for (var dtab of dict) {
          for (var dfield of dtab.fields) {
            if (dfield.type !== 'subentity' && dfield.nullable !== 'Y'
                && dfield.default && !(dfield.name in this.details)) {
              this.details[dfield.name] = dfield.default;
            }
          }
        }
        void this.injectSubentityDefaults(dict);
      })
    );
  }

  protected esqSubKind(field: EsqEntityField): number {
    var ret: number = 0;
    if (field.format) {
      ret = Number(field.format);
    }
    return ret;
  }

  protected async injectSubentityDefaults(dict: EsqEntityLayer[]): Promise<void> {
    var subs: {name: string, kind: number}[] = [];
    for (var tab of dict) {
      for (var field of tab.fields) {
        if (field.type === 'subentity' && this.details[field.name]) {
          subs.push({name: field.name, kind: this.details[field.name].kind});
        }
      }
    }
    await Promise.all(subs.map(async (sub) => {
      var subDict = await firstValueFrom(this.dictionaryApi.dictionary(sub.kind));
      for (var stab of subDict) {
        for (var sfield of stab.fields) {
          if (sfield.nullable !== 'Y' && sfield.default && !(sfield.name in this.details[sub.name])) {
            this.details[sub.name][sfield.name] = sfield.default;
          }
        }
      }
    }));
    this.originalDetails = EsqUtils.deepCopy(this.details);
    this.details$ = of(this.details);
  }

  public override async onCreate(): Promise<void> {
    var error: EsqValidationError | null = EsqUtils.validateFields(this.details, this.dictionary);
    if (!error) {
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
          }
        }
      }
    }
    if (error) {
      await this.callApi.confirmDlg(null, 'Validation Error', error.message, EsqExplorerCallApi.ConfirmFlag.Ok);
      this.focusField(error);
    } else {
      var body = { ...this.details, kind: this.givenEntityKind };
      var snapshot = this.details;
      this.saving = true;
      var encodedParentId = this.parentId ? encodeURIComponent(this.parentId) : "";
      this.details$ = this.restApi.esquireCmdNew(this.givenEntityKind, encodedParentId, body).pipe(
        tap(details => {
          this.saving = false;
          this.details = details;
          this.originalDetails = EsqUtils.deepCopy(details);
          this.givenEntityId = details.id;
          this._isCreating = false;
          this.needsTreeRefresh = true;
          this.headerName = details.name || "New entity";
        }),
        catchError(err => {
          this.saving = false;
          var errorMsg: string = "";
          if (err.errors && err.errors.length > 0) {
            var apiErr = err.errors[0];
            var valError: EsqValidationError = {
              fieldName: apiErr.fieldName,
              fieldLabel: apiErr.fieldLabel,
              message: apiErr.message,
              tabIndex: parseInt(apiErr.tabIndex, 10) || 0
            };
            errorMsg = 'Create failed: ' + (err.detail || valError.message);
            void this.callApi?.confirmDlg(null, 'Create Error', errorMsg, EsqExplorerCallApi.ConfirmFlag.Ok).then(() => this.focusField(valError));
          } else {
            errorMsg = 'Create failed: ' + (err.detail || err.title || err);
            void this.callApi?.confirmDlg(null, 'Create Error', errorMsg, EsqExplorerCallApi.ConfirmFlag.Ok);
          }
          if (this.onError) {
            this.onError(errorMsg, err);
          }
          return of(snapshot);
        })
      );
    }
  }

}
