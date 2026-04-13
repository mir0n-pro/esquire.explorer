/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/12/2026 mir0n  initial: account-picker tree datasource interface
*/
import { Observable } from 'rxjs';
import { EsqTreeNode } from 'src/esquire.ui/api/EsqTreeNode';

/**
 * Interface for the entity-picker tree datasource.
 * Implemented by EsqSelectEntityDatasource; returned by EsqFlatTreeDatasource.createFlatTreeSelector().
 */
export interface EsqFlatTreeSelector {
    selectDs: { connect: () => Observable<EsqTreeNode[]>; disconnect: () => void };
    levelAccessor: (node: EsqTreeNode) => number;
    ensureLoaded(): Promise<void>;
    toggleNode(node: EsqTreeNode): Promise<void>;
    isExpandable(node: EsqTreeNode): boolean;
    findById(id: string): EsqTreeNode | null;
    expandToNode(entityId: string): Promise<EsqTreeNode | null>;
    reset(): void;
}

export interface EsqFlatTreeSelectorFactory {
    createFlatTreeSelector(kinds: Set<number>, isLeaf?: (node: EsqTreeNode) => boolean): EsqFlatTreeSelector;
}
