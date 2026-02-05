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
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { Observable } from 'rxjs';
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

import {EsqNodeTypeFactory} from 'src/esquire.ui/api/EsqNodeTypeFactory';
import {EsqRestApi} from 'src/esquire.ui/api/EsqRestApi';
import {EsqExplorerCallApi} from 'src/esquire.ui/api/EsqExplorerCallApi';
import {EsqDictionaryApi} from 'src/esquire.ui/api/EsqDictionaryApi';
import {EsqEntityLayer} from 'src/esquire.ui/api/EsqEntityDictionary';

import {EsqTabFieldComponent} from "./EsqTabFieldComponent";

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
   private dialogRef: MatDialogRef<EsqEntityDetailsDialog>;

   private restApi: EsqRestApi;
   private dictionaryApi: EsqDictionaryApi;
   public callApi: EsqExplorerCallApi;

   public readOnly: boolean = false;
   public details$: Observable<any> | undefined;
   public dictionary$: Observable<EsqEntityLayer[]> | undefined;
   readonly detailsDialog:MatDialog = inject(MatDialog);
   private givenEntityId:string = "";
   private givenEntityKind:number = -1;
   public headerIcon:string = "";
   public headerName:string = "";

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

      this.dialogRef.disableClose = true;
      this.dialogRef.addPanelClass('esq-dialog');
      this.dialogRef.updateSize('60vw', '60vh');
    }      

  closeDialog(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.dictionary$ = this.dictionaryApi.dictionary(this.givenEntityKind);
    this.details$ = this.restApi.esquireCmd(this.givenEntityKind, this.givenEntityId);
      // Subscribe to details$ and update header values
      if (this.details$) {
          this.details$.subscribe(details => {
              this.headerIcon = EsqNodeTypeFactory.instanceOf(details.kind).icon;
              this.headerName = details.name || 'No defined';
              this.cdr.detectChanges();
          });
      }

  }

  ngOnDestroy() {
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

