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
* 03/03/2026 mir0n  added esqListElementsChange output; esqAddMenuElements, readonly inputs
*                   addIknElements built from esqAddMenuElements in ngOnInit
*                   canAddBtn(): enabled when esqAddMenuElements has items (not index-based)
*                   canAddMenuItem(): filters already-present and kind-exclusive items
*                   doAddMenuItem(): appends item, emits change, refreshes view, re-focuses
*                   doRemoveBtn(): filter by focused item id (not by index)
*                   canDetailsBtn(): checks kind.detailed flag
*                   Add button wired to MatMenu; all buttons use [disabled] binding
*/
import {
    AfterViewInit,
    Component,
    ElementRef, EventEmitter,
    Input,
    OnDestroy,
    OnInit, Output,
    QueryList,
    ViewChildren,
    ViewEncapsulation
} from '@angular/core';
import { MatButtonModule} from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common'
import {MatTableModule, MatTableDataSource, MatRow } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { DataSource } from '@angular/cdk/collections';
/*  
import { EsqNodeType, EsqExplorerCallApi } from '@mir0n-pro/esquire.ui/api';
*/
import {EsqObjectKind} from 'src/esquire.ui/api/EsqObjectKind';
import {EsqExplorerCallApi} from 'src/esquire.ui/api/EsqExplorerCallApi';
import {EsqObjectKindFactory} from "src/esquire.ui/api/EsqObjectKindFactory";
import {EsqNewMenuItem} from "../api/EsqContextMenuBuilder";

  @Component({
  selector: 'esq-tab-ikn-list',
  templateUrl: './EsqTabIknListComponent.html',
  styleUrl: './EsqTabListComponent.scss',
  imports: [
    MatButtonModule,
    MatTooltipModule,
    MatIcon,
    CommonModule,
    MatTableModule,
    MatMenuModule,
  ],
  encapsulation: ViewEncapsulation.None,
})

export class EsqTabIknListComponent implements OnInit,  AfterViewInit, OnDestroy {

  public displayedColumns: string[] = ['name']; 
  public listElementHoveredIndex:number = -1;
  public listElementFocusedIndex:number = -1;
  @ViewChildren(MatRow, { read: ElementRef }) matRows!: QueryList<ElementRef>; // Assuming MatRow is a directive applied to your rows

  @Input() public esqListElements!: any[];
  @Output() public esqListElementsChange = new EventEmitter<any[]>();
  @Input() public esqAddMenuElements!: any[];
  @Input() public esqListHeader:string = '';
  @Input() public readonly :boolean = false;
  @Input() public esqEnableAdd:boolean = false;
  @Input() public esqEnableRemove:boolean = false;
  @Input() public esqEnableSort:boolean = false;
  @Input() public esqEnableDetails:boolean = false;
  @Input() public esqExplorerCallApi!:EsqExplorerCallApi;

  public tabIknElements: TabIknElement[] = [];
  public tabListDataSource!:DataSource<TabIknElement>;
  public addIknElements: TabIknElement[] = [];


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

      if (this.esqAddMenuElements && this.esqAddMenuElements.length > 0) {
        //TODO: create menu items for add button based on esqAddMenuElements
        this.esqAddMenuElements.forEach ((x: any) => {
            var eok: EsqObjectKind = EsqObjectKindFactory.instanceOf(x.kind);
            this.addIknElements[this.addIknElements.length] = ({
                sort : 0,
                id : x.id,
                name : x.name,
                kind : x.kind,
                icon : eok.icon
            });
        });
        if (!this.readonly) {
            this.esqEnableAdd = true;
            this.esqEnableRemove = true;
            //this.esqEnableSort = false;
            //this.esqEnableDetails = false;
        }
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
    var ret :boolean = this.esqEnableDetails
      && this.esqExplorerCallApi
      && this.tabIknElements.length > 0
      && this.listElementFocusedIndex >=0;
      if (ret) {
          var el: TabIknElement = this.tabIknElements[this.listElementFocusedIndex];
          var kind: EsqObjectKind = EsqObjectKindFactory.instanceOf(el.kind);
          ret = kind.detailed;
      }
    return ret;
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
    return this.esqEnableAdd && this.esqAddMenuElements?.length > 0;
  }
  canAddMenuItem(item: TabIknElement):boolean {
    var ret:boolean = this.esqEnableAdd && this.esqAddMenuElements?.length > 0;
    if (ret) {
        for (var i = 0; i < this.tabIknElements.length; i++) {
            if (this.tabIknElements[i].name == item.name) {
                ret = false;
                break;
            }
            //xxx: only one admin role possible : TODO: make is generic
            if (item.kind == 980 && this.tabIknElements[i].kind == 980) {
                ret = false;
                break;
            }
        }
    }
    return ret;
  }

  doAddMenuItem(item: TabIknElement): void {
    var tie: TabIknElement = {
      sort: this.tabIknElements.length + 1,
      id: item.id,
      name: item.name,
      kind: item.kind,
      icon: item.icon
    };
    var element: any = {
        id: item.id,
        name: item.name,
        kind: item.kind
    };
    var next = [...(this.esqListElements ?? []), element];
    this.esqListElementsChange.emit(next);

    this.tabIknElements.push(tie);
    this.tabListDataSource = new MatTableDataSource(this.tabIknElements);
    this.listElementFocusedIndex = this.tabIknElements.length - 1;
      // Re-focus the new line (optional)
      setTimeout(() => {
          const rows = this.matRows?.toArray?.() ?? [];
          const row = rows[this.listElementFocusedIndex];
          row?.nativeElement?.focus?.();
      }, 0);

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
        const index = this.listElementFocusedIndex;
        var focused: TabIknElement = this.tabIknElements[index];

        // Create a NEW array matched by focused item identity, not by index
        const next = (this.esqListElements ?? []).filter(x => !(x.id === focused.id));

        // Notify parent: this is what usually enables "Save"
        this.esqListElementsChange.emit(next);
        // Update local view model
        this.tabIknElements.splice(index, 1);
        // Refresh datasource
        this.tabListDataSource = new MatTableDataSource(this.tabIknElements);
        // Fix focus index
        if (this.tabIknElements.length === 0) {
            this.listElementFocusedIndex = -1;
        } else {
            this.listElementFocusedIndex = Math.min(index, this.tabIknElements.length - 1);
            // 5) Re-focus the next row (optional)
            setTimeout(() => {
                const rows = this.matRows?.toArray?.() ?? [];
                const row = rows[this.listElementFocusedIndex];
                row?.nativeElement?.focus?.();
            }, 0);
        }
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
