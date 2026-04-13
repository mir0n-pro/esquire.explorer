/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/12/2026 mir0n  initial: generic tree-selector datasource; wraps EsqTreeViewDatasource;
*/
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { EsqTreeNode } from 'src/esquire.ui/api/EsqTreeNode';
import { EsqRestApi } from 'src/esquire.ui/api/EsqRestApi';
import { EsqTreeViewDatasource } from './EsqTreeViewDatasource';
import { EsqFlatTreeSelector } from './EsqFlatTreeSelector';

export { EsqFlatTreeSelector, EsqFlatTreeSelectorFactory } from './EsqFlatTreeSelector';

/**
 * Generic datasource for a filtered tree-picker dialog.
 * Created by EsqFlatTreeDatasource.createFlatTreeSelector(kinds).
 * Wraps the shared EsqTreeViewDatasource; non-expandable nodes fetched via REST into extraNodes[].
 * Expandable nodes (with 'B' treeFlag) delegate to treeDs.toggleNode().
 */
export class EsqSelectEntityDatasource implements EsqFlatTreeSelector {
    private loaded = false;
    private extraNodes: EsqTreeNode[] = [];
    private treeSubj = new BehaviorSubject<EsqTreeNode[]>([]);

    public selectDs = {
        connect: () => this.treeSubj.asObservable(),
        disconnect: () => {}
    };
    public levelAccessor = (node: EsqTreeNode) => node.level;

    constructor(
        private treeDs: EsqTreeViewDatasource,
        private restApi: EsqRestApi,
        private kinds: Set<number>,
        private isLeaf: (node: EsqTreeNode) => boolean = () => false
    ) {}

    async ensureLoaded(): Promise<void> {
        if (!this.loaded) {
            if (this.treeDs.getAll().length === 0) {
                await this.treeDs.loadInitialData();
            }
            this.treeDs.getAll()
                .filter(n => this.isInKinds(n) && !n.expandable() && n.expanded())
                .forEach(n => n.expanded.set(false));
            this.extraNodes = [];
            this.loaded = true;
        }
        this.publishVisible();
    }

    reset(): void {
        this.loaded = false;
        this.extraNodes = [];
    }

    async toggleNode(node: EsqTreeNode): Promise<void> {
        if (!this.isExpandable(node)) return;
        if (!node.expanded()) {
            var hasChildren = this.allNodes().some(n => n.parentId === node.id);
            if (!hasChildren) {
                if (node.expandable()) {
                    await this.treeDs.toggleNode(node);
                } else {
                    await node.setLoading(true);
                    try {
                        var raw = await firstValueFrom(this.restApi.esquire(node.id, 0, 200)) as any[];
                        var children = raw.map((x: any) => new EsqTreeNode(x, node)).filter(n => this.isInKinds(n));
                        this.extraNodes.push(...children);
                    } finally {
                        await node.setLoading(false);
                    }
                    node.expanded.set(true);
                }
            } else {
                if (node.expandable()) {
                    await this.treeDs.toggleNode(node);
                } else {
                    node.expanded.set(true);
                }
            }
        } else {
            this.collapseSubtree(node);
            if (node.expandable()) {
                await this.treeDs.toggleNode(node);
            } else {
                node.expanded.set(false);
            }
        }
        this.publishVisible();
    }

    isExpandable(node: EsqTreeNode): boolean {
        return !this.isLeaf(node);
    }

    findById(id: string): EsqTreeNode | null {
        return this.allNodes().find(n => n.entityId === id) ?? null;
    }

    async expandToNode(entityId: string): Promise<EsqTreeNode | null> {
        var path = await this.treeDs.getPath(entityId);
        if (!path || path.length === 0) return null;
        for (var pathId of path) {
            var ancestor = this.allNodes().find(n => n.id === pathId);
            if (ancestor && this.isExpandable(ancestor) && !ancestor.expanded()) {
                await this.toggleNode(ancestor);
            }
        }
        return this.findById(entityId);
    }

    private allNodes(): EsqTreeNode[] {
        return [
            ...this.treeDs.getAll().filter(n => this.isInKinds(n)),
            ...this.extraNodes,
        ];
    }

    private isInKinds(node: EsqTreeNode): boolean {
        return this.kinds.has(node.kind.id);
    }

    private collapseSubtree(node: EsqTreeNode): void {
        this.allNodes().forEach(n => {
            if (this.isDescendantOf(n, node)) n.expanded.set(false);
        });
    }

    private isDescendantOf(n: EsqTreeNode, ancestor: EsqTreeNode): boolean {
        var cur = n.parent;
        while (cur) {
            if (cur === ancestor) return true;
            cur = cur.parent;
        }
        return false;
    }

    private isVisible(node: EsqTreeNode): boolean {
        var cur: EsqTreeNode | undefined = node.parent;
        while (cur) {
            if (!cur.expanded()) return false;
            cur = cur.parent;
        }
        return true;
    }

    private publishVisible(): void {
        this.treeSubj.next(this.allNodes().filter(n => this.isVisible(n)));
    }
}
