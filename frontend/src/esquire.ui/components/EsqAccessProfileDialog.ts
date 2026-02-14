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
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { firstValueFrom,Observable } from 'rxjs';
import { CommonModule } from '@angular/common'
import {MatTableModule } from '@angular/material/table';
import {EsqTabFieldComponent} from "./EsqTabFieldComponent";

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

export class EsqAccessProfileDialog implements OnInit,  AfterViewInit, OnDestroy {
   @ViewChild('btnClose') btnClose! : MatButton;
   private dialogRef: MatDialogRef<EsqAccessProfileDialog>;
   private restApi: EsqRestApi;
   private dictionaryApi: EsqDictionaryApi;

   public readOnly: boolean = false;
   public details$: Observable<any> | undefined;
   public dictionary$: Observable<EsqEntityLayer[]> | undefined;
   public id:string = "";
   public headerIcon:string = "";
   public headerName:string = "";

  constructor(
      dialogRef: MatDialogRef<EsqAccessProfileDialog>,
      @Inject(MAT_DIALOG_DATA) data: any,
      private cdr: ChangeDetectorRef
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
//    if (this.node.kind.detailed) {
      this.dictionary$ = this.dictionaryApi.dictionary(EsqObjectKindFactory.ACCESSPROFILE.id);
      this.details$ = this.restApi.esquireKey(this.id);

      // Subscribe to details$ and update header values
      if (this.details$) {
          this.details$.subscribe(details => {
              this.headerIcon = EsqObjectKindFactory.instanceOf(details.kind).icon;
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

  private async loadDetails(): Promise<any> {
    return await firstValueFrom(this.restApi.esquireKey(this.id));
  }

  tabContent (index:number):string {
    return index == 0 ? "esq-first-tab-content" :  "esq-other-tab-content";
  }
}

