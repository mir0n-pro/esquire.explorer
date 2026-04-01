/*
*  Esquire frameworks (tm)
* 
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 03/20/2026 mir0n  gotoTreeNode(): navigate to tree node by id; expands ancestors
* 03/31/2026 mir0n  getOrgNodes(): filter loaded nodes to org kind
*/
import {EsqTreeViewDatasource} from './EsqTreeViewDatasource';
import {EsqListViewDatasource} from './EsqListViewDatasource';
/*
import {EsqRestApi, EsqTreeNode} from '@mir0n-pro/esquire.ui/api';
import {EsqUtils} from '@mir0n-pro/esquire.ui/components';
*/
import {EsqRestApi} from 'src/esquire.ui/api/EsqRestApi';
import {EsqTreeNode} from 'src/esquire.ui/api/EsqTreeNode';
import {EsqUtils} from 'src/esquire.ui/components/EsqUtils';

import { Observable } from 'rxjs';
export class EsqFlatTreeDatasource {
    public tree: EsqTreeViewDatasource;
    public list: EsqListViewDatasource;

    public constructor(api:EsqRestApi) {
        //this.api = api;
        this.tree = new EsqTreeViewDatasource(api);
        this.list = new EsqListViewDatasource(this.tree);
    }

    public  async loadInitialData() {
        await EsqUtils.logDelay(1000, 'delay loadInitialData 1s...');
        return this.tree.loadInitialData();
    }

    public get data4tree(): EsqTreeNode[] {
        return this.tree.data;
    }
    public get data4list(): EsqTreeNode[] {
        return this.list.data;
    }

    public async loadChildren(node: EsqTreeNode) {
        await EsqUtils.logDelay(1000, 'delay loadChildren 1s...');
        return this.list.loadChildren(node);
    }

    public async toggleOnTree(node: EsqTreeNode) {
        await EsqUtils.logDelay(1000, 'delay loadChildren 1s...');
        return this.tree.toggleNode(node);
    }

    public isVisibleOnTree(node: EsqTreeNode):boolean {
        return this.tree.isVisible(node);
    }

    public toggleTreeSelection(node: EsqTreeNode):void{
       this.tree.toggleSelection(node);
    }
    public selectOnTree(node: EsqTreeNode):void{
       this.tree.select(node);
    }

   public clear () {
        this.list.clear();
        this.tree.clear();
    }

    public getById (id: string) : EsqTreeNode|undefined{
        return this.tree.getById(id);
    }

    public async loadNodesPath(path : string[]) {//{ : EsqTreeNode|undefined {
        EsqUtils.log('loadNodesPath[', path);  
        var lev:number = 0;
        var ret: EsqTreeNode |undefined =undefined;
        if (path && path.length > 0) {
            const root:EsqTreeNode|undefined =  this.tree.getById(path[0]);
            ret = root;
            if (root) {
                for(let i = 1 ; ret && i < path.length ; i++) {
                    let n:any = await this.tree.findInSublings(path[i], ret as EsqTreeNode);
                    if (n instanceof EsqTreeNode) {
                        ret = n;
                    }
                }
            }
        }
        EsqUtils.log(']loadNodesPath', ret);  
        return ret;
    }

    public async gotoListNode(id: string) {
        await EsqUtils.logDelay(1000,'delay gotoListNode 1s...');
        EsqUtils.log('gotoListNode[');
        const path: string[] = await this.tree.getPath(id);
        var treeNode: EsqTreeNode |undefined =undefined;
        var listNode: EsqTreeNode |undefined =undefined;
        if (path && path.length > 0) {
            path[path.length] = id;
            let res:any = await this.loadNodesPath(path);
            if (res instanceof EsqTreeNode) {
                listNode = res as EsqTreeNode;
                treeNode = listNode.parent;
            }
        }
        if (treeNode) {
            var treeNodes:EsqTreeNode[] =[];
            for (let i=0; i < path.length -1; i++) {
                treeNodes[i] = this.tree.getById(path[i]) as EsqTreeNode;
            }
            for (let i=0; i < treeNodes.length; i++) {
                if (treeNodes[i].expandable() && !treeNodes[i].expanded()) {
                    await this.tree.toggleNode(treeNodes[i]);
                }
            }
            await  this.list.loadChildren(treeNode);
        }
        EsqUtils.log(']gotoListNode');
        return listNode;
    }

    public async gotoTreeNode(id: string): Promise<EsqTreeNode|undefined> {
        await EsqUtils.logDelay(1000, 'delay gotoTreeNode 1s...');
        EsqUtils.log('gotoTreeNode[');
        const path: string[] = await this.tree.getPath(id);
        var treeNode: EsqTreeNode|undefined = undefined;
        if (path && path.length > 0) {
            path[path.length] = id;
            let res: any = await this.loadNodesPath(path);
            if (res instanceof EsqTreeNode) {
                treeNode = res as EsqTreeNode;
                for (let i = 0; i < path.length - 1; i++) {
                    let ancestor = this.tree.getById(path[i]);
                    if (ancestor && ancestor.expandable() && !ancestor.expanded()) {
                        await this.tree.toggleNode(ancestor);
                    }
                }
            }
        }
        EsqUtils.log(']gotoTreeNode');
        return treeNode;
    }

    public hasMoreChildren(parent:EsqTreeNode): boolean {
        return this.tree.hasMoreChildren(parent);
    }

    public getOrgNodes(): EsqTreeNode[] {
        return this.tree.getAll().filter((n: EsqTreeNode) => n.kind.org);
    }


    public async loadMoreChildren(parent: EsqTreeNode) {
        var collapse:boolean = parent.expandable() && !parent.expanded();
        if (collapse) {
            await this.tree.toggleNode(parent);
        }
        await  this.tree.loadMoreChildren(parent);
        await  this.list.loadChildren(parent);
        if (collapse) {
            await this.tree.toggleNode(parent);
        }
    }

}
