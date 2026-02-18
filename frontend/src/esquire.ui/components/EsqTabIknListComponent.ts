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
* 02/17/2026 mir0n  use CMD_DEFAULT constant from EsqExplorerCallApi
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
import {EsqObjectKind} from 'src/esquire.ui/api/EsqObjectKind';
import {EsqExplorerCallApi} from 'src/esquire.ui/api/EsqExplorerCallApi';
import {EsqObjectKindFactory} from "src/esquire.ui/api/EsqObjectKindFactory";

  @Component({
  selector: 'esq-tab-ikn-list',
  templateUrl: './EsqTabIknListComponent.html',
  styleUrl: './EsqTabListComponent.scss',
  imports: [
    MatButtonModule,
    MatTooltipModule,
    MatIcon,
    CommonModule,
    MatTableModule
  ],
  encapsulation: ViewEncapsulation.None,
})

export class EsqTabIknListComponent implements OnInit,  AfterViewInit, OnDestroy {

  public displayedColumns: string[] = ['name']; 
  public listElementHoveredIndex:number = -1;
  public listElementFocusedIndex:number = -1;
  @ViewChildren(MatRow, { read: ElementRef }) matRows!: QueryList<ElementRef>; // Assuming MatRow is a directive applied to your rows

  @Input() public esqListElements!: any[];
  @Input() public esqListHeader:string = '';
  @Input() public esqEnableAdd:boolean = false;
  @Input() public esqEnableRemove:boolean = false;
  @Input() public esqEnableSort:boolean = false;
  @Input() public esqEnableDetails:boolean = false;
  @Input() public esqExplorerCallApi!:EsqExplorerCallApi;

  public tabIknElements: TabIknElement[] = [];
  public tabListDataSource!:DataSource<TabIknElement>;

  constructor() {
    this.tabListDataSource = new MatTableDataSource([]);
  }      

  ngOnInit() {
    if (this.esqListElements) {
        var i = 0;
        this.esqListElements.forEach((x: any) => {
            this.tabIknElements[this.tabIknElements.length] = {
              sort : ++i,
              id : x.id??i,
              name : x.name,
              kind : x.kind ?? -1,
              icon : ""
            };
        })
      if(  this.tabIknElements.length > 0) {
        this.tabIknElements.forEach((x: any) => {
          x.icon = (x.kind  < 0) ? "" : EsqObjectKindFactory.instanceOf(x.kind).icon
        })
        this.listElementFocusedIndex = 0;
        this.tabListDataSource = new MatTableDataSource(this.tabIknElements);
      }    
    }
  }

  ngOnDestroy() {
    this.tabListDataSource = new MatTableDataSource([]);
    this.tabIknElements = [];
  }

  ngAfterViewInit() {
  }    


  onListClick(index:number) {
    this.doSelectListElement(index);
  }
  onListDoubleClick(index:number){
    this.doSelectListElement(index);
    this.doDetailsBtn();
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
      case 'Enter':
      case ' ': // Spacebar
        event.preventDefault();
        if (this.listElementFocusedIndex >= 0) {
          this.doSelectListElement(this.listElementFocusedIndex);
        }
        break;
    }
  }

  onListArrowdown(index : number) {
    var nextIndex: number = -1;
    if (index < this.tabIknElements.length -1) {
        nextIndex = index + 1;
    }
    if (nextIndex >=0) {
      this.doSelectListElement(nextIndex);
    }
  }
  onListArrowup(index : number) {
    var nextIndex: number = -1;
    if (this.tabIknElements.length > 0 && index > 0) {
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
  
  canDetailsBtn():boolean {
    return this.esqEnableDetails
      && this.esqExplorerCallApi
      && this.tabIknElements.length > 0
      && this.listElementFocusedIndex >=0;

  }
  doDetailsBtn() {
      if (this.canDetailsBtn()) {
         var el:TabIknElement = this.tabIknElements[this.listElementFocusedIndex];
         if(el) {
           this.esqExplorerCallApi.calle(EsqExplorerCallApi.CMD_DEFAULT, String(el.id), '', el.kind, null);
         }
      }
  }

  canAddBtn():boolean {
    return this.esqEnableAdd && this.listElementFocusedIndex >=0; 
  }
  doAddBtn() {
    if (this.canAddBtn()) {
      //do nothing for now
    }
  }

  canUpBtn():boolean {
    return this.esqEnableSort && this.listElementFocusedIndex > 0 && this.tabIknElements.length > 1;
  }
  doUpBtn() {
    if (this.canUpBtn()) {
      //do nothing for now
    }
  }
  canDownBtn():boolean {
    return this.esqEnableSort 
      && this.listElementFocusedIndex >= 0  && this.tabIknElements.length > 1
      && this.listElementFocusedIndex < this.tabIknElements.length -1;
  }
  doDownBtn() {
    if (this.canDownBtn()) {
      //do noting for now
    }
  }
  canRemoveBtn():boolean {
    return this.esqEnableRemove && this.listElementFocusedIndex >=0; 
  }
  doRemoveBtn() {
    if (this.canRemoveBtn()) {
      //do noting for now
    }
  }
}

export interface TabIknElement {
  id: number;
  sort: number;
  name: string;
  kind: number;
  icon: string;
}
