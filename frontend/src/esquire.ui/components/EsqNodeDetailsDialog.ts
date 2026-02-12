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
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { firstValueFrom, from, lastValueFrom, Observable } from 'rxjs';
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
import {EsqNodeType} from 'src/esquire.ui/api/EsqNodeType';
import {EsqNodeTypeFactory} from 'src/esquire.ui/api/EsqNodeTypeFactory';
import {EsqRestApi} from 'src/esquire.ui/api/EsqRestApi';
import {EsqTreeNode} from 'src/esquire.ui/api/EsqTreeNode';
import {EsqNodeStatusFactory} from 'src/esquire.ui/api/EsqNodeStatusFactory';
import {EsqExplorerCallApi} from 'src/esquire.ui/api/EsqExplorerCallApi';
import {EsqDictionaryApi} from 'src/esquire.ui/api/EsqDictionaryApi';
import {EsqEntityLayer} from 'src/esquire.ui/api/EsqEntityDictionary';
import {EsqTabFieldComponent} from "./EsqTabFieldComponent";

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
          EsqTabFieldComponent
      ],
  encapsulation: ViewEncapsulation.None,
})

export class EsqNodeDetailsDialog implements OnInit,  AfterViewInit, OnDestroy {
   @ViewChild('btnClose') btnClose! : MatButton;
   private dialogRef: MatDialogRef<EsqNodeDetailsDialog>;
   public node : EsqTreeNode;
   private restApi: EsqRestApi;
   private dictionaryApi: EsqDictionaryApi;
   public callApi: EsqExplorerCallApi;

   public readOnly: boolean = false;
   public details$: Observable<any> | undefined;
   public dictionary$: Observable<EsqEntityLayer[]> | undefined;
   readonly detailsDialog:MatDialog = inject(MatDialog);   

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
      
      this.dialogRef.disableClose = true;
      this.dialogRef.addPanelClass('esq-dialog');
      this.dialogRef.updateSize('60vw', '60vh'); 
    }      

  closeDialog(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    if (this.node.type.detailed) {
      this.dictionary$ = this.dictionaryApi.dictionary(this.node.type.id);
      this.details$ = this.restApi.esquireCmd(this.node.type.id, this.node.entityId); //from (this.loadDetails());
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

  nodeStatusIcon() {
    return EsqNodeStatusFactory.instanceOf(this.node.statusCode).icon;
  }
  
  nodeTypeName():string {
    return this.node.type.name + (this.node.linkId?" (shortcut)" : "");
  }
  private async loadDetails(): Promise<any> {
    return await firstValueFrom(this.restApi.esquireCmd(this.node.kind, this.node.entityId));
  }
  nodeTypeFromFormat(format:string) : EsqNodeType {
    var id:number = -1; //unknown
    if (format) {
      var ftype:string[] = format.split('=');
      if (ftype.length > 1 && ftype[0] == 'kind') {
        id = Number(ftype[1]);
      }
    }
    return EsqNodeTypeFactory.instanceOf(id);
  }

  tabContent (index:number):string {
    return index == 0 ? "esq-first-tab-content" :  "esq-other-tab-content";
  }
}

