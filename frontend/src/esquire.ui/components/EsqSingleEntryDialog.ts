/*
*  Esquire frameworks (tm)
* 
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
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
import { EsqEntityLayer } from '@mir0n-pro/esquire.ui/api';
*/
import {EsqEntityLayer} from 'src/esquire.ui/api/EsqEntityDictionary';

import { EsqTabLStringComponent} from './EsqTabStringComponent';

@Component({
  selector: 'details-dialog',
  templateUrl: './EsqSingleEntryDialog.html',
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
    EsqTabLStringComponent
],
  encapsulation: ViewEncapsulation.None,
})


//Note: tablist filed type is not supported!!!
export class EsqSingleEntryDialog implements OnInit,  AfterViewInit, OnDestroy {
   @ViewChild('btnClose') btnClose! : MatButton;
  
   private dialogRef: MatDialogRef<EsqSingleEntryDialog>;
   public readOnly: boolean = false;
   public details: any;
   public dictionary: EsqEntityLayer[];
   public title: string;
   public titleIcon: string;
//   readonly detailsDialog:MatDialog = inject(MatDialog);   

  constructor(
      dialogRef: MatDialogRef<EsqSingleEntryDialog>, 
      @Inject(MAT_DIALOG_DATA) data: any
    ) {
      this.dialogRef = dialogRef; 

      this.dictionary = data.dictionary;
      this.readOnly = data.readOnly;
      this.details = data.details;
      this.title= data.title || "Properties";
      this.titleIcon = data.titleIcon || "./main.ico";

      this.dialogRef.disableClose = true;
      this.dialogRef.addPanelClass('esq-dialog');
      this.dialogRef.updateSize('60vw', '60vh'); 
    }      

  closeDialog(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
  }

  ngOnDestroy() {
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

