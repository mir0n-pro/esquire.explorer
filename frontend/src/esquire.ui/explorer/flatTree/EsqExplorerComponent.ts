/*
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 02/01/2026 mir0n  dynamic toolbar
*                   context menu added
*                   toolbar is in synch with context menu
*                   normalized keyboard actions
* 02/12/2026 mir0n  EsqNodeType in explicit file
* 02/13/2026 mir0n  EsqNodeType renamed with EsqObjectKind
* 02/17/2026 mir0n  use CMD_DEFAULT constant from EsqExplorerCallApi
*                   use EsqAccessProfile from esquire.ui/api
* 03/20/2026 mir0n  implements EsqExplorerHost; self-registers via registerHost in ngOnInit()
*                   onBtnRefreshClick: gotoTreeNode fallback for link-variant node restore
* 03/26/2026 mir0n  canCreateKind(); onTreeRefreshSelect(); setErrorMessage() delegation
*                   onBtnRefreshClickAndSelect(); esqExplorerHost input; errorMessage signal
* 03/28/2026 mir0n  onTreeRefresh() consolidated: entityId/asOwner optional params; onBtnRefreshClickAndSelectOwner() added
* 03/31/2026 mir0n  CMD_MOVE: doMoveCommand() opens EsqMoveDialog; canCmdClick() refactored; cannot move yourself
* 04/02/2026 mir0n  registration of Move command handler
*                   onCmdClick() : bypass location for refresh selection
*                   api.call(): added subCmd, selectMode
* 04/08/2026 mir0n  ExplorerHost registration redesigned : fanout host events to any number of registered hosts 
*                   handle EsqExplorerHost.setLoading()
*/
import {Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  signal,
  ViewChild,
  AfterViewInit,
  afterEveryRender,
  Inject,
  Input,
  ViewEncapsulation,
} from '@angular/core';

import { MatTree, MatTreeNode, MatTreeNodeDef, MatTreeNodePadding } from '@angular/material/tree';
import { MatRow, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
/*
import { EsqRestApi
  , AsEsqTreeNodePipe
  , EsqTreeNode
  , EsqExplorerCallApi
  , EsqColumnHeaderDef
  , EsqNodeStatusFactory 
} from '@mir0n-pro/esquire.ui/api';
import { EsqResizeDirective, EsqUtils} from '@mir0n-pro/esquire.ui/components';
*/
import {EsqRestApi} from 'src/esquire.ui/api/EsqRestApi';
import {AsEsqTreeNodePipe}  from 'src/esquire.ui/api/AsEsqTreeNodePipe';
import {EsqTreeNode}  from 'src/esquire.ui/api/EsqTreeNode';
import {EsqExplorerCallApi, EsqExplorerHost} from 'src/esquire.ui/api/EsqExplorerCallApi';
import {EsqColumnHeaderDef} from 'src/esquire.ui/api/EsqObjectKind';
import {EsqNodeStatusFactory} from 'src/esquire.ui/api/EsqNodeStatusFactory';
import {EsqResizeDirective} from 'src/esquire.ui/components/EsqResizeDirective';
import {EsqUtils} from 'src/esquire.ui/components/EsqUtils';
import {
    EsqCommandMenuItem,
    EsqContextMenuBuilder,
    EsqNewMenuItem,
} from 'src/esquire.ui/api/EsqContextMenuBuilder';


import { EsqFlatTreeDatasource } from './EsqFlatTreeDatasource';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import {EsquireService} from "../../../rest";
import {EsqAccessProfile} from "src/esquire.ui/api/EsqAccessProfile";
import {EsqMoveCommandHandler} from "./components/EsqMoveCommandHandler";
import {SelectMode} from "../../api/EsqEntityCommandHandler";
import {EsqExplorerHostDummy} from "../../api/EsqExplorerCallApi";


@Component({
  selector: 'esqExplorer',
  standalone: true,
  imports: [
    MatIcon,
    MatButtonModule,
    MatButtonToggleModule,
    MatToolbarModule,
    CommonModule,
    MatSidenavModule,
    MatTooltipModule,
    MatTableModule,
    AsEsqTreeNodePipe,
    MatTree,
    MatTreeNode,
    MatTreeNodeDef,
    MatTreeNodePadding,
    EsqResizeDirective,
    MatMenuModule,
    MatDividerModule,
],
  templateUrl: './EsqExplorerComponent.html',
  styleUrl: './EsqExplorerComponent.scss',
  encapsulation: ViewEncapsulation.None ,
  host: { 'class': 'esq-explorer'}
})

export class EsqExplorerComponent extends EsqExplorerHostDummy implements OnInit, OnDestroy, AfterViewInit{
  @Input() public esqRestApi: EsqRestApi | null = null;
  @Input() public esqExplorerCallApi: EsqExplorerCallApi | null = null;
  @Input() public esqCommandMenuItems:EsqCommandMenuItem[] = [];
  @Input() public esqAccessProfile:EsqAccessProfile | null = null;

  treeLevelAccessor = (dataNode: EsqTreeNode)  => dataNode.level;
  datasource!: EsqFlatTreeDatasource;

  listColumns:EsqColumnHeaderDef[] = [];
  listColumnsDisplayed:string[] = [];

  listNodeFocused: EsqTreeNode | null = null;
  listNodeOwner:EsqTreeNode | null = null;
  listNodeExecuted:EsqTreeNode | null = null;
  listNodeHoveredIndex = -1;
  listNodeOwnerPath = signal("");
  errorMessage = signal('');
  errorReport: any = undefined;

  listNodeHistoryStack:EsqTreeNode[] = [];
  listNodeHistoryIndex:number = -1; 

  treeNodePostFocus:EsqTreeNode | null = null; 
  treeNodeActive: EsqTreeNode | null = null;
  treeNodeEntered: EsqTreeNode | null = null;
  treeNodeLastFocus: EsqTreeNode | null = null;

  @ViewChild('EsqExplTree') _tree!: MatTree<EsqTreeNode>;
  @ViewChild('EsqSidenav') sidenav!: MatSidenav;

  @ViewChild('contextMenuTrigger', { read: MatMenuTrigger }) private contextMenuTrigger!: MatMenuTrigger;
  @ViewChild('menuItemOpen', { read: ElementRef }) menuItemOpen!: ElementRef;
  @ViewChild('menuItemDetails', { read: ElementRef }) menuItemDetails!: ElementRef;
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuNode: EsqTreeNode | null = null;
  contextMenuInList: boolean = false; // true when right-clicking on list item
  contextMenuParent: EsqTreeNode | null = null;
  contextNewMenuItems:EsqNewMenuItem[] = [];
  toolbarNewMenuItems: EsqNewMenuItem[] = [];

  treeItself!:MatTree<EsqTreeNode>;
  @ViewChildren(MatRow, { read: ElementRef }) matRows!: QueryList<ElementRef>; // Assuming MatRow is a directive applied to your rows
    
  initialDataLoading = signal(true);
  dataLoading = signal(false);
  treeOnFocus:boolean = false;

  constructor(private dialog: MatDialog) {
    super();
    afterEveryRender(() => {
      if (this.treeNodePostFocus) {
        this.setFocusTreeNode(this.treeNodePostFocus);
        this.treeNodePostFocus = null;
      }     
    });    
  }

  async ngAfterViewInit() {
    this.treeItself = this._tree;
  }

  override onTreeRefresh(entityId?: string, asOwner?: boolean): void {
    if (entityId && asOwner) {
      void this.onBtnRefreshClickAndSelectOwner(entityId);
    } else if (entityId) {
      void this.onBtnRefreshClickAndSelect(entityId);
    } else {
      void this.onBtnRefreshClick();
    }
  }

  override setLoading(on: boolean): void {
    this.dataLoading.set(on);
  }

  async onBtnRefreshClickAndSelect(entityId: string): Promise<void> {
    await this.onBtnRefreshClick();
    var n: any = await this.datasource.gotoListNode(entityId);
    if (n && n instanceof EsqTreeNode) {
      var found = n as EsqTreeNode;
      this.listNodeOwner = found.parent as EsqTreeNode;
      this.updatePath();
      this.updateToolbarNewMenuItems();
      this.toggleTreeSelect(found.parent as EsqTreeNode);
      this.doSelectListNode(found, true);
    }
  }

  async onBtnRefreshClickAndSelectOwner(entityId: string): Promise<void> {
    await this.onBtnRefreshClick();
    var ownerResult: any = await this.datasource.gotoTreeNode(entityId);
    if (ownerResult && ownerResult instanceof EsqTreeNode) {
      var ownerNode = ownerResult as EsqTreeNode;
      if (ownerNode.expandable()) {
        this.treeItself.expand(ownerNode);
        this.datasource.selectOnTree(ownerNode);
        this.treeNodeActive = ownerNode;
        await this.doActivateListNode(ownerNode, false);
      }
    }
  }

  async ngOnInit() {
    if (!this.esqRestApi) {
      console.error("No esqRestApi defined");
    }
    this.esqExplorerCallApi?.registerHost(this);
    const moveHandler = new EsqMoveCommandHandler(() => this.getDatasource());
    this.esqExplorerCallApi?.registerHandler(moveHandler);

    this.datasource = new EsqFlatTreeDatasource(this.esqRestApi as EsqRestApi);
    await this.datasource.loadInitialData();
    this.listNodeOwner = this.datasource.data4tree[0];
    if (this.listNodeOwner) {
      this.updatePath();
      this.updateToolbarNewMenuItems();
      this.treeNodeActive = this.listNodeOwner;
      await this.datasource.loadChildren(this.listNodeOwner as EsqTreeNode);
      if (this.datasource.data4list.length>0) {
        this.listNodeFocused = this.datasource.data4list[0];
        this.listNodeHistoryStack[0] = this.listNodeOwner;
        this.listNodeHistoryIndex = 0;
      }
      this.listColumns = (this.listNodeOwner as EsqTreeNode).kind.listHeaders;
      this.listColumnsDisplayed = this.listColumns.map((x)=>x.columnDef!);
      this.treeNodePostFocus = this.treeNodeActive;
      this.initialDataLoading.set(false);
    }
  }

  public toggleSideNav(): void {
    if (this.sidenav) {
      this.sidenav!.toggle();
    }
  }

  /**
   * Get datasource for external command handler registration
   */
  public getDatasource(): EsqFlatTreeDatasource {
    return this.datasource;
  }

  ngOnDestroy(): void {
    this.esqExplorerCallApi?.unregisterHost(this);
  }

  hasIcon(node : EsqTreeNode ) : boolean {
    return (node.kind.icon.length>0);
  }

  nodeIcon(node : EsqTreeNode ) {
    return node.kind.icon;
  }
  
  nodeStatusIcon(node : EsqTreeNode) {
    return EsqNodeStatusFactory.instanceOf(node.statusCode).icon;
  }

  updatePath() {
    var path:string = "";
    if (this.listNodeOwner) {
      let node:EsqTreeNode|undefined = this.listNodeOwner;
      var first:boolean = true;
      do {
        path = node.name + (first? "" : "/") + path;
        node = node?.parent;
        first = false;
      } while (node);

    }
    this.listNodeOwnerPath.update(()=>path);
  }

 // Number of buttons on the right side of the toolbar (for grid layout)
    public rightButtonsCount(): number {
        return this.esqCommandMenuItems.length + 3;
    };

    // ==== context menu generic behavior =====
    private findDefaultMenuItem(): ElementRef | null {
        if (this.contextMenuNode?.expandable()) {
            return this.menuItemOpen;
        } else {
            return this.menuItemDetails;
        }
    }

    private openContextMenu(event: MouseEvent,
            node: EsqTreeNode | null,
            parent: EsqTreeNode | null) {
        this.contextMenuNode = node;
        this.contextMenuParent = parent;

        if (this.contextMenuInList && node) {
            this.contextNewMenuItems = [];
        } else {
            this.contextNewMenuItems = EsqContextMenuBuilder.buildNewMenuItems(parent);
        }

        this.contextMenuPosition.x = event.clientX;
        this.contextMenuPosition.y = event.clientY;

        this.contextMenuTrigger.openMenu();

        // Focus the default menu item after menu opens
        setTimeout(() => {
            const defaultMenuItem = this.findDefaultMenuItem();
            if (defaultMenuItem?.nativeElement) {
                defaultMenuItem.nativeElement.focus();
            }
        }, 0);
    }

    onListContextMenu(event: MouseEvent, node: EsqTreeNode) {
        event.preventDefault();
        event.stopPropagation();
        this.contextMenuInList = true; // Clicking on list item - disable "New..."
        this.openContextMenu(event, node, node.parent ?? this.listNodeOwner ?? null);
    }
    onTreeContextMenu(event: MouseEvent, node: EsqTreeNode) {
        event.preventDefault();
        event.stopPropagation();
        this.contextMenuInList = false; // Tree nodes can be containers
        // For tree nodes, the parent for "New..." should be the node itself (create children under it)
        this.openContextMenu(event, node, node);
    }

    onEmptyListContextMenu(event: MouseEvent) {
        const target = event.target as HTMLElement | null;
        if (target?.closest('tr.mat-row')) {
            return; // row will handle its own context menu
        }
        event.preventDefault();
        event.stopPropagation();
        this.contextMenuInList = false; // Empty space - enable "New..."
        this.openContextMenu(event, null, this.listNodeOwner ?? null);
    }

    onEmptyTreeContextMenu(event: MouseEvent) {
        const target = event.target as HTMLElement | null;
        if (target?.closest('.esq-tree-node')) {
            return; // node will handle its own context menu
        }
        event.preventDefault();
        event.stopPropagation();
        this.contextMenuInList = false; // Empty space - enable "New..."
        this.openContextMenu(event, null, this.treeNodeActive ?? this.listNodeOwner ?? null);
    }

    updateToolbarNewMenuItems() {
        // Build menu items for toolbar "New" button based on current selection
        this.toolbarNewMenuItems = EsqContextMenuBuilder.buildNewMenuItems(this.listNodeOwner);
    }

    // ===== optional external commands on the context menu and toolbar =====
    private getSelectedNode(menu:boolean):EsqTreeNode|null {
        var ret :EsqTreeNode|null = null;
        if (menu) {
            ret = this.contextMenuNode;
        } else {
            if (this.treeOnFocus) {
                ret = this.treeNodeActive;
            } else {
                ret = this.listNodeFocused;
            }
        }
        return ret;
    }

    canCmdClick(cmd: string, menu:boolean) : boolean {
        var ret : boolean = false;
        var node :EsqTreeNode|null = this.getSelectedNode(menu);
        if (node && this.esqAccessProfile) {
            ret = node.kind.isCommandAllowed(cmd);
            if (ret) {
                if (cmd == EsqExplorerCallApi.CMD_MOVE &&
                  node.entityId === this.esqAccessProfile?.id) {
                    // you cannot move yourself
                    ret = false;
                } else {
                    ret = this.esqAccessProfile.isCommandAllowed(cmd, node.entityId, node.kind.id);
                }
            }
        }
        return ret;
    }

    canCreateKind(kindId: number): boolean {
        var ret: boolean = !this.esqAccessProfile ||
            this.esqAccessProfile.isCommandAllowed(EsqExplorerCallApi.CMD_NEW, "", kindId);
        return ret;
    }

    async onCmdClick(cmd: string, menu:boolean) {
        if (this.canCmdClick(cmd, menu)) {
            var selectMode = this.treeOnFocus
                ? SelectMode.SelectTree
                : SelectMode.SelectList;
            await this.doExplorerCommand(cmd, null, this.getSelectedNode(menu), selectMode);
        }
    }

    // ===== optional "New" command on the context menu and toolbar =====
    canCmdNewClick(menu:boolean):boolean {
        if (menu) {
            return this.contextNewMenuItems.length > 0;
        }
        return this.toolbarNewMenuItems.length > 0;
    }

    async onCmdNewClick(typeId: number, menu: boolean ): Promise<void> {
        if (this.canCmdNewClick(menu)) {
            var node = menu ? this.contextMenuParent : this.listNodeOwner
            if (node) {
                EsqUtils.log("onCmdDetailsClick[");
                await this.doExplorerCreate(node, typeId);
                EsqUtils.log("]onCmdDetailsClick");
            }
        }
    }

   // ===== default actions : Open and Details =====
    canMenuOpenClick():boolean {
        var ret : boolean = false;
        var node= this.contextMenuNode;
        if (node) {
            ret = node.expandable();
        }
        return ret;
    }
    async onMenuOpenClick(): Promise<void> {
        if (!this.contextMenuNode) return;
        // Open means navigate into the node (select it and load its children)
        if (this.contextMenuInList) {
            // For list items, select and execute the default action
            this.doSelectListNode(this.contextMenuNode, true);
            await this.doDefaultListNode();
        } else {
            // For tree nodes, expand/activate them
            await this.toggleTreeActivate(this.contextMenuNode, true);
        }
    }

    canCmdDetailsClick(menu: boolean) : boolean {
        return this.getSelectedNode(menu) != null;
    }

    async onCmdDetailsClick(menu: boolean): Promise<void> {
        EsqUtils.log("onCmdDetailsClick[");
        await this.doExplorerCommand(EsqExplorerCallApi.CMD_DEFAULT, null, this.getSelectedNode(menu));
        EsqUtils.log("]onCmdDetailsClick");
    }

    // ===== Goto command =====

    canCmdGotoClick(menu: boolean): boolean {
        var node = this.getSelectedNode(menu)
        return !!node && (node.linkId ?? '') !== '';
    }
    async onCmdGotoClick(menu: boolean): Promise<void> {
        if (this.canCmdGotoClick(menu)) {
            var node = this.getSelectedNode(menu);
            if (node) {
                const id: string = node.linkId;
                this.dataLoading.set(true);
                let n: any = await this.datasource.gotoListNode(id);
                if (n && n instanceof EsqTreeNode) {
                    const node: EsqTreeNode = n as EsqTreeNode;
                    this.toggleTreeSelect(node.parent as EsqTreeNode);
                    this.doSelectListNode(node, true);
                }
                this.dataLoading.set(false);
            }
        }
    }

    // ===== Navigation section  =====
    canCmdBackClick() : boolean {
        return this.listNodeHistoryIndex > 0
            && this.listNodeHistoryStack.length > this.listNodeHistoryIndex;
    }
    async onCmdBackClick() {
        if (this.canCmdBackClick()) {
            this.listNodeHistoryIndex--;
            let node:EsqTreeNode = this.listNodeHistoryStack[this.listNodeHistoryIndex];
            this.doTreeExpandSelect(node);
        }
    }

    canCmdForwardClick() : boolean {
        return this.listNodeHistoryStack.length > 0
            && this.listNodeHistoryIndex >= 0
            && this.listNodeHistoryIndex+1 < this.listNodeHistoryStack.length;
    }
    async onCmdForwardClick() {
        if (this.canCmdForwardClick()) {
            this.listNodeHistoryIndex++;
            let node:EsqTreeNode = this.listNodeHistoryStack[this.listNodeHistoryIndex];
            this.doTreeExpandSelect(node);
        }
    }

    canCmdUpClick() : boolean {
        var ret:boolean = false;
        if (this.listNodeOwner && this.listNodeOwner.parent) {
            ret = true;
        }
        return ret;
    }
    async onCmdUpClick() {
        if (this.canCmdUpClick()) {
            if (this.listNodeOwner && this.listNodeOwner.parent) {
                if (this.listNodeHistoryIndex > 0
                    && this.listNodeHistoryIndex+1 < this.listNodeHistoryStack.length) {
                    this.listNodeHistoryStack = this.listNodeHistoryStack.slice(0, this.listNodeHistoryIndex+1);
                }
                this.doTreeExpandSelect(this.listNodeOwner.parent);
            }
        }
    }
   // ==== rest but only Button commands =====

  async onBtnRefreshClick() {
    EsqUtils.log('onBtnRefreshClick[');
    this.initialDataLoading.set(true);
    var savedFocused: EsqTreeNode|null = null;
    var savedOwner: EsqTreeNode|null = null;
    if (this.listNodeFocused) {
      savedFocused = this.listNodeFocused;
      this.listNodeFocused = null;
    }
    if (this.listNodeOwner) {
      savedOwner = this.listNodeOwner;
    }
    this.datasource.clear();
    this.listNodeHistoryIndex = -1;
    this.listNodeHistoryStack = [];
    await this.datasource.loadInitialData();
    var restored = false;
    if (savedFocused) {
      var n: any = await this.datasource.gotoListNode(savedFocused.id);
      if (n && n instanceof EsqTreeNode) {
        var found = n as EsqTreeNode;
        this.listNodeOwner = found.parent as EsqTreeNode;
        this.updatePath();
        this.updateToolbarNewMenuItems();
        this.toggleTreeSelect(found.parent as EsqTreeNode);
        this.doSelectListNode(found, true);
        restored = true;
      }
    }
    if (!restored && savedOwner) {
      var ownerResult: any = await this.datasource.gotoTreeNode(savedOwner.id);
      if (ownerResult && ownerResult instanceof EsqTreeNode) {
        var ownerNode = ownerResult as EsqTreeNode;
        if (ownerNode.expandable()) {
          this.treeItself.expand(ownerNode);
          this.datasource.selectOnTree(ownerNode);
          this.treeNodeActive = ownerNode;
          await this.doActivateListNode(ownerNode, false);
        }
      }
    }
    this.initialDataLoading.set(false);
    EsqUtils.log(']onBtnRefreshClick');
  }

    canBtnMoreClick() : boolean {
        var ret:boolean = false;
        if (this.listNodeOwner) {
            ret = this.datasource.hasMoreChildren(this.listNodeOwner);
        }
        return ret;
    }
    async onBtnMoreClick() {
        if (this.canBtnMoreClick()) {
            this.dataLoading.set(true);
            await this.datasource.loadMoreChildren(this.listNodeOwner as EsqTreeNode);
            this.dataLoading.set(false);
        }
    }
//  end of UI commands


    async doExplorerCommand(cmd:string, subCmd: string|null, node : EsqTreeNode | undefined | null, selectMode: SelectMode = SelectMode.None) {
    var ret = new Promise<void>((resolve) => resolve());
    if (node && this.esqExplorerCallApi) {
      const api:EsqExplorerCallApi = this.esqExplorerCallApi as EsqExplorerCallApi;
      ret = api.call(cmd, subCmd, node as EsqTreeNode, this.esqAccessProfile, selectMode);
    }
    return ret;
  }
  async doExplorerCreate(node: EsqTreeNode | null, typeId?: number) {
    if (node && this.esqExplorerCallApi) {
      const api:EsqExplorerCallApi = this.esqExplorerCallApi as EsqExplorerCallApi;
      return api.create(node as EsqTreeNode, typeId);
    } else {
      return new Promise<void>((resolve)=>resolve());
    }
  }

// ------------list view  events -----  
  onListFocus(node: EsqTreeNode){
    this.treeOnFocus = false;
    this.treeNodeEntered=null; 
    if (this.treeNodeLastFocus) {
      this.treeNodeLastFocus = null;
    }
  }

  onListFocusOut(node: EsqTreeNode){
  }

  onListClick(node: any) {
    this.doSelectListNode(node, true);
   }

   onListDoubleClick(node: any) {
      this.doSelectListNode(node, true);
      this.doDefaultListNode();
   }

  private isKeyPlain(event: KeyboardEvent): boolean {
    return !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey;
  }

  private isOnlyCtrl(event: KeyboardEvent): boolean {
    return event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey;
  }

  private isOnlyAlt(event: KeyboardEvent): boolean {
    return !event.ctrlKey && event.altKey && !event.shiftKey && !event.metaKey;
  }

  async onListKeydown(event: KeyboardEvent, node: EsqTreeNode, index: number) {
    switch (event.key) {
      case 'ArrowUp':
        if (this.isOnlyCtrl(event)) {
          event.preventDefault();
          await this.onCmdUpClick();
          // Restore focus to first item in new list
          if (this.datasource.data4list.length > 0) {
            this.doSelectListNode(this.datasource.data4list[0], true);
          }
        } else if (this.isKeyPlain(event)) {
          event.preventDefault();
          this.onListArrowup(node, index);
        }
        break;
      case 'ArrowDown':
        if (this.isKeyPlain(event)) {
          event.preventDefault();
          this.onListArrowdown(node, index);
        }
        break;
      case 'ArrowLeft':
        if (this.isOnlyCtrl(event)) {
          event.preventDefault();
          await this.onCmdBackClick();
          // Restore focus to first item in new list
          if (this.datasource.data4list.length > 0) {
            this.doSelectListNode(this.datasource.data4list[0], true);
          }
        }
        break;
      case 'ArrowRight':
        if (this.isOnlyCtrl(event)) {
          event.preventDefault();
          await this.onCmdForwardClick();
          // Restore focus to first item in new list
          if (this.datasource.data4list.length > 0) {
            this.doSelectListNode(this.datasource.data4list[0], true);
          }
        }
        break;
      case 'Enter':
        if (this.isOnlyAlt(event)) {
          event.preventDefault();
          if (this.listNodeFocused) {
            this.doExplorerCommand(EsqExplorerCallApi.CMD_DEFAULT, null, this.listNodeFocused);
          }
        } else if (this.isKeyPlain(event)) {
          event.preventDefault();
          if (this.listNodeFocused) {
            this.doSelectListNode(this.listNodeFocused, true);
            this.doDefaultListNode();
          }
        }
        break;
      case ' ': // Spacebar
        if (this.isKeyPlain(event)) {
          event.preventDefault();
          if (this.listNodeFocused) {
            this.doSelectListNode(this.listNodeFocused, true);
          }
        }
        break;
    }
  }

  onListArrowdown(node: EsqTreeNode, index : number) {
    var nextRow! : EsqTreeNode ;
    if (index < this.datasource.data4list.length - 1) {
        nextRow = this.datasource.data4list[index + 1];
    }
    if (nextRow) {
      this.doSelectListNode(nextRow, true);
    }
  }
  onListArrowup(node: EsqTreeNode, index : number) {
    var nextRow! : EsqTreeNode ;
    if (index > 0) {
        nextRow = this.datasource.data4list[index - 1];
    }
    if (nextRow) {
      this.doSelectListNode(nextRow, true);
    }
  }

  //----- tree view events ---------
  onTreeClick(node: any) {
    this.toggleTreeActivate(node, false);
  }

   onTreeDoubleClick(node: any) {
      this.toggleTreeExpandSelect(node);
   }

  onTreeNodeEnter (node: EsqTreeNode){
    this.treeNodeEntered = node;
  }

  onTreeNodeLeave () {
    this.treeNodeEntered = null;
  }  
  
  async onTreeNodeExpansion($event: boolean, node: EsqTreeNode) {
    EsqUtils.log("handleNodeExpansion[");
    this.dataLoading.set(true);
    await this.datasource.toggleOnTree(node);
    this.doActivateListExecuted();
    this.dataLoading.set(false);
    EsqUtils.log("]handleNodeExpansion");
  }

   onTreeFocus(node: EsqTreeNode){
    this.treeOnFocus = true;
  }

  onTreeFocusOut(node: EsqTreeNode){
    this.treeNodeLastFocus = node;
  }

  async onTreeKeydown(event: KeyboardEvent, node: EsqTreeNode) {
    switch (event.key) {
      case 'ArrowUp':
        if (this.isOnlyCtrl(event)) {
          event.preventDefault();
          await this.onCmdUpClick();
          // Restore focus to the active tree node
          if (this.treeNodeActive) {
            this.setFocusTreeNode(this.treeNodeActive);
          }
        } else if (this.isKeyPlain(event)) {
          event.preventDefault();
          this.onTreeNodeEnter(node);
        }
        break;
      case 'ArrowDown':
        if (this.isKeyPlain(event)) {
          event.preventDefault();
          this.onTreeNodeEnter(node);
        }
         break;
      case 'ArrowLeft':
        if (this.isOnlyCtrl(event)) {
          event.preventDefault();
          await this.onCmdBackClick();
          // Restore focus to active tree node
          if (this.treeNodeActive) {
            this.setFocusTreeNode(this.treeNodeActive);
          }
        } else if (this.isKeyPlain(event)) {
          event.preventDefault();
          this.onTreeLeft(node);
        }
         break;
      case 'ArrowRight':
        if (this.isOnlyCtrl(event)) {
          event.preventDefault();
          await this.onCmdForwardClick();
          // Restore focus to active tree node
          if (this.treeNodeActive) {
            this.setFocusTreeNode(this.treeNodeActive);
          }
        } else if (this.isKeyPlain(event)) {
          event.preventDefault();
          this.onTreeRight(node);
        }
         break;
      case 'Enter':
        if (this.isOnlyAlt(event)) {
          event.preventDefault();
          this.doExplorerCommand(EsqExplorerCallApi.CMD_DEFAULT, null, node);
        } else if (this.isKeyPlain(event)) {
          event.preventDefault();
          this.toggleTreeActivate(node, false);
          this.treeItself.toggle(node);
        }
        break;
      case ' ': // Spacebar
        if (this.isKeyPlain(event)) {
          event.preventDefault();
          this.toggleTreeActivate(node, false);
        }
        break;
//      case 'Back':
//        if (this.isKeyPlain(event)) {
//          event.preventDefault();
//          this.onCmdBackClick();
//        }
//        break;
    }
  }

  onTreeLeft(node: EsqTreeNode) {
    //xxx: sometimes tree getting late
    if (this.treeItself.isExpanded(node) || node.expanded()) {
      this.treeItself.toggle(node);
      this.toggleTreeSelect(node);
    }
    this.onTreeNodeEnter(node);
  }
  onTreeRight(node: EsqTreeNode) {
    //xxx: sometimes tree getting late
    if (node.expandable() && !(this.treeItself.isExpanded(node) && node.expanded())) {
      this.treeItself.toggle(node);
      this.toggleTreeSelect(node);
    }
    this.onTreeNodeEnter(node);
  }  
  
// -- actions --- 

  doSelectListNode(node: EsqTreeNode, focused:boolean) {
    if (node) {
      EsqUtils.log("select[",focused);
      this.dataLoading.set(true);
      const index = this.datasource.data4list.indexOf(node!);
      this.listNodeFocused = node;
      if  (focused) {
        setTimeout(() => {
          const nextRows = this.matRows.toArray();  
          const nextRowElement = nextRows[index].nativeElement;
          nextRowElement.focus();
        }, 0);
      }
      this.dataLoading.set(false);
      EsqUtils.log("]select");
    }
  }

  async doDefaultListNode() {
    EsqUtils.log('runDefault[', this.listNodeFocused);
    this.dataLoading.set(true);
    let doDefault:boolean = false;
    let doActivate:boolean = false;
    if (this.listNodeFocused) {
      const node:EsqTreeNode = this.listNodeFocused as EsqTreeNode;  
      doActivate = true;
      if (!this.datasource.isVisibleOnTree(node)) {
        if (node.expandable()) {
          EsqUtils.log('toggle');
          this.treeItself.toggle(node.parent as EsqTreeNode);
          this.listNodeExecuted = node;
        } else {
          doActivate = false;;
          doDefault = true;
        }
      } 
    }
    if (doActivate) {
      this.toggleTreeActivate(this.listNodeFocused, true);
    }
    this.dataLoading.set(false);
    if (doDefault) {
      await this.doExplorerCommand(EsqExplorerCallApi.CMD_DEFAULT, null, this.listNodeFocused);
    }
    EsqUtils.log(']runDefault');
  }

  doActivateListExecuted(){
      const node:EsqTreeNode|null = this.listNodeExecuted;
      if (node) {
        this.listNodeExecuted = null;
        EsqUtils.log('doActivateListExecuted[', node);
        var i =0;
        for (;i<1000;i++) {
          setTimeout(() => {
            let g = 1;
          }, 10);
          if (this.datasource.isVisibleOnTree(node)) {
            break;
          }
        }
        if (this.datasource.isVisibleOnTree(node)){
          EsqUtils.log('Asyn activate list IS executed  at ', i * 10, 'ms');
          this.toggleTreeActivate(node, true);
        } else {
          EsqUtils.log('Asyn activivate list IS NOT executed');
        }
        EsqUtils.log(']doActivateNode');
      }
    }

  async doActivateListNode (node: EsqTreeNode, listFocused:boolean) {
    EsqUtils.log("doActivateListNode[" + listFocused);
    this.dataLoading.set(true);
      await this.datasource.loadChildren(node);
      if ((this.listNodeOwner as EsqTreeNode).kind  != node.kind) {
        this.listColumns = node.kind.listHeaders;
        this.listColumnsDisplayed = this.listColumns.map((x)=>x.columnDef!);
        this.listColumnsDisplayed = [...this.listColumnsDisplayed];
      }
      this.treeNodePostFocus = null;
      if (this.datasource.data4list.length>0) {
        this.doSelectListNode(this.datasource.data4list[0], listFocused);
      }
      if (this.listNodeOwner != node) {
        this.listNodeOwner = node;
        this.updatePath();
        this.updateToolbarNewMenuItems();
        if (this.listNodeHistoryIndex+1 == this.listNodeHistoryStack.length) { 
          if (this.listNodeHistoryStack[this.listNodeHistoryIndex] != node) {
            this.listNodeHistoryStack[this.listNodeHistoryStack.length] = node;
            if (this.listNodeHistoryStack.length > 5) {
              this.listNodeHistoryStack.shift();
            }
            this.listNodeHistoryIndex = this.listNodeHistoryStack.length -1;
          }
        }
      }
    this.dataLoading.set(false);
    EsqUtils.log("]doActivateListNode");
  }

  setFocusTreeNode(node: EsqTreeNode) {
    // Find the corresponding DOM element
    const element = document.getElementById('node-' + node.id);
    if (element) {
      // Use setTimeout to ensure the element is rendered and available in the DOM
      setTimeout(() => {
        element.focus();
      }, 0);
    }
  }

  toggleTreeSelect(node: EsqTreeNode){
    if (this.treeNodeActive != node) {  
      this.treeNodeActive = node;
      this.datasource.toggleTreeSelection(node);
    }
  }

  toggleTreeActivate(node: EsqTreeNode | undefined | null, listFocused:boolean){
    if (node && this.treeNodeActive != node) {  
      this.treeNodeActive = node;
      this.datasource.toggleTreeSelection(node);
      if(node.expandable()) { 
        this.doActivateListNode (node, listFocused);
      }
    }
  }
  toggleTreeExpandSelect(node: EsqTreeNode) {
    this.treeItself.toggle(node);
    if (node.expandable()) {
        this.doActivateListNode (node, false);
    }
  }
  
  doTreeExpandSelect(node: EsqTreeNode) {
    if (node && node.expandable()) {
      this.treeItself.expand(node);
      this.datasource.selectOnTree(node);
      this.treeNodeActive = node;
      //this.toggleTreeSelect(node);      
      //this.treeNodeActive = node;
      this.doActivateListNode (node, false);
    }
  }

}
