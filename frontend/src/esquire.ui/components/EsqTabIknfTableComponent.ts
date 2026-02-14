/*
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 02/04/2026 mir0n  no "entityKind" field anymore
* 02/12/2026 mir0n  EsqNodeType in explicit file
* 02/13/2026 mir0n  EsqNodeType renamed with EsqObjectKind
*/
import {AfterViewInit, 
  Component, 
  ElementRef, 
  Input, 
  OnDestroy,
  OnInit, 
  QueryList, 
  ViewChildren, 
  ViewEncapsulation
} from '@angular/core';
import { MatButtonModule} from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common'
import {MatTableModule, MatTableDataSource, MatRow } from '@angular/material/table';
import { DataSource } from '@angular/cdk/collections';
/*  
import { EsqNodeType, EsqExplorerCallApi } from '@mir0n-pro/esquire.ui/api';
*/
import {EsqColumnHeaderDef, EsqObjectKind} from 'src/esquire.ui/api/EsqObjectKind';
import {EsqExplorerCallApi} from 'src/esquire.ui/api/EsqExplorerCallApi';
import {EsqObjectKindFactory} from "src/esquire.ui/api/EsqObjectKindFactory";
import {EsqResizeDirective} from './EsqResizeDirective';

  @Component({
  selector: 'esq-tab-iknf-table',
  templateUrl: './EsqTabIknfTableComponent.html',
  styleUrl: './EsqTabListComponent.scss',
  imports: [
    MatButtonModule,
    MatTooltipModule,
    CommonModule,
    MatTableModule,
    EsqResizeDirective,
  ],
  encapsulation: ViewEncapsulation.None,
})

export class EsqTabIknfTableComponent implements OnInit,  AfterViewInit, OnDestroy {

  public displayedColumns: string[] = ['name']; 
  public listElementHoveredIndex:number = -1;
  public listElementFocusedIndex:number = -1;
  @ViewChildren(MatRow, { read: ElementRef }) matRows!: QueryList<ElementRef>; // Assuming MatRow is a directive applied to your rows

  @Input() public esqListElements!: any[];
  @Input() public esqListHeader:string = '';
  
  public tabIknfElements: TabIknfElement[] = [];
  public tabIknfDataSource!:DataSource<TabIknfElement>;

  listColumns:EsqColumnHeaderDef[] = [];
  listColumnsDisplayed:string[] = [];

  constructor() {
    this.tabIknfDataSource = new MatTableDataSource([]);
  }

  ngOnInit() {
    if (this.esqListElements) {
        var i = 0;
        this.esqListElements.forEach((x: any) => {
            this.tabIknfElements[this.tabIknfElements.length] = {
              sort : ++i,
              id : x.id??i,
              kind : x.kind ?? -1,
              icon : "",
              name : x.name,
              flag0 : (x.flags?.[0]?.trim() ? x.flags[0] : "N"),
              flag1 : (x.flags?.[1]?.trim() ? x.flags[1] : "N"),
              flag2 : (x.flags?.[2]?.trim() ? x.flags[2] : "N"),
              flag3 : (x.flags?.[3]?.trim() ? x.flags[3] : "N"),
              flag4 : (x.flags?.[4]?.trim() ? x.flags[4] : "N"),
              flag5 : (x.flags?.[5]?.trim() ? x.flags[5] : "N"),
              flag6 : (x.flags?.[6]?.trim() ? x.flags[6] : "N"),
              flag7 : (x.flags?.[7]?.trim() ? x.flags[7] : "N"),
            };
        })
      if(  this.tabIknfElements.length > 0) {
        this.tabIknfElements.forEach((x: any) => {
          x.icon = (x.kind  < 0) ? "" : EsqObjectKindFactory.instanceOf(x.kind).icon
        })
        this.listElementFocusedIndex = 0;
        this.tabIknfDataSource = new MatTableDataSource(this.tabIknfElements);
      }    
    }
    const headersArray = (this.esqListHeader ?? '')
          .split(/[,\n;]+/)
          .map(h => h.trim())
          .filter(Boolean);
    for(const header of headersArray) {
        var i = this.listColumns.length;
        if ( i == 0) {
            this.listColumns[i] = {columnDef:'name', header:header};
            this.listColumnsDisplayed[i] = 'name';
        } else {
            this.listColumns[i] = {columnDef:'flag' + (i - 1), header:header};
            this.listColumnsDisplayed[i] = 'flag' + (i - 1);
        }
    }
  }

  ngOnDestroy() {
    this.tabIknfDataSource = new MatTableDataSource([]);
    this.tabIknfElements = [];
  }

  ngAfterViewInit() {
  }    


  onListClick(index:number) {
    this.doSelectListElement(index);
  }

  onListKeydown(event: KeyboardEvent, index:number) {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.onListArrowup(index);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.onListArrowdown(index);
        break;
    }
  }

  onListArrowdown(index : number) {
    var nextIndex: number = -1;
    if (index < this.tabIknfElements.length -1) {
        nextIndex = index + 1;
    }
    if (nextIndex >=0) {
      this.doSelectListElement(nextIndex);
    }
  }
  onListArrowup(index : number) {
    var nextIndex: number = -1;
    if (this.tabIknfElements.length > 0 && index > 0) {
        nextIndex = index - 1;
    }
    if (nextIndex >=0) {
      this.doSelectListElement(nextIndex);
    }
  }

  doSelectListElement(index: number) {
    this.listElementFocusedIndex = index;
    if (index >= 0) {
      setTimeout(() => {
        const nextRows = this.matRows.toArray();  
        const nextRowElement = nextRows[index].nativeElement;
        nextRowElement.focus();
      }, 0);
    }
  }

}

export interface TabIknfElement {
  id: number;
  sort: number;
  kind: number;
  icon: string;
  name: string;
 flag0: string;
 flag1: string;
 flag2: string;
 flag3: string;
 flag4: string;
 flag5: string;
 flag6: string;
 flag7: string;
}
