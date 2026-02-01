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
import {EsqNodeType} from 'src/esquire.ui/api/EsqNodeTypeFactory';
import {EsqNodeTypeFactory} from 'src/esquire.ui/api/EsqNodeTypeFactory';
import {EsqRestApi} from 'src/esquire.ui/api/EsqRestApi';
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
        EsqTabIknListComponent,
        EsqTabIknfTableComponent,
        EsqTabStringComponent,
    ],
  encapsulation: ViewEncapsulation.None,
})

export class EsqAccessProfileDialog implements OnInit,  AfterViewInit, OnDestroy {
   @ViewChild('btnClose') btnClose! : MatButton;
   private dialogRef: MatDialogRef<EsqAccessProfileDialog>;
//   public node : EsqTreeNode;
   private restApi: EsqRestApi;
   private dictionaryApi: EsqDictionaryApi;
//   public callApi: EsqExplorerCallApi;

   public readOnly: boolean = false;
   public details$: Observable<any> | undefined;
   public dictionary$: Observable<EsqEntityLayer[]> | undefined;
//   readonly detailsDialog:MatDialog = inject(MatDialog);
   public id:string = "";
   public headerIconValue:string = "";
   public headerNameValue:string = "";

  constructor(
      dialogRef: MatDialogRef<EsqAccessProfileDialog>,
      @Inject(MAT_DIALOG_DATA) data: any
    ) {
      this.dialogRef = dialogRef;
      this.id = data.id;

      this.restApi = data.restApi;
      this.dictionaryApi = data.dictionaryApi;
      this.readOnly = data.readOnly;
      
      this.dialogRef.disableClose = true;
      this.dialogRef.addPanelClass('esq-dialog');
      this.dialogRef.updateSize('60vw', '60vh'); 
    }      

  closeDialog(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
//    if (this.node.type.detailed) {
      this.dictionary$ = this.dictionaryApi.dictionary(EsqNodeTypeFactory.ACCESSPROFILE.id);
      this.details$ = this.restApi.esquireKey(this.id); //from (this.loadDetails());

      // Subscribe to details$ and update header values
      if (this.details$) {
          this.details$.subscribe(details => {
              this.headerIconValue = EsqNodeTypeFactory.instanceOf(details.kind).icon;
              this.headerNameValue = details.loginId || 'No defined';
          });
      }
//    }
  }
/*
  async headerIcon(): Promise<string> {
      let ret: string = '';
      if (this.details$) {
          const details = await firstValueFrom(this.details$);
          ret = EsqNodeTypeFactory.instanceOf(details.kind).icon;
      }
      return ret;
  }
  async headerName():Promise<string> {
      let ret: string = '';
      if (this.details$) {
          const details = await firstValueFrom(this.details$);
          ret = details.loginId;
      }
      return ret;
  }
*/
    public headerIcon(details: any): string {
        const kind = details?.kind;
        return (typeof kind === 'number') ? EsqNodeTypeFactory.instanceOf(kind).icon : '';
    }

    public headerName(details: any): string {
        return details?.loginId || 'No defined';
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

  private async loadDetails(): Promise<any> {
    return await firstValueFrom(this.restApi.esquireKey(this.id));
  }

  tabContent (index:number):string {
    return index == 0 ? "esq-first-tab-content" :  "esq-other-tab-content";
  }
}

