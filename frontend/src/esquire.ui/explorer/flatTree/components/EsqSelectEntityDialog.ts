/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/12/2026 mir0n  initial: generic entity picker dialog;
* 04/14/2026 mir0n  onSelect() normalizes kind via EsqObjectKindFactory.normalize(); preSelectedId protected; canSelect() cleanup
*/
import {
    AfterViewInit,
    Component,
    HostListener,
    Inject,
    OnDestroy,
    OnInit,
    signal,
    ViewEncapsulation,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { EsqExplorerCallApi, EsqExplorerHostDummy } from 'src/esquire.ui/api/EsqExplorerCallApi';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MatTree, MatTreeNode, MatTreeNodeDef, MatTreeNodePadding } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { EsqTreeNode } from 'src/esquire.ui/api/EsqTreeNode';
import { EsqDialogResizeDirective } from 'src/esquire.ui/components/EsqDialogResizeDirective';
import { EsqFlatTreeSelector } from '../EsqFlatTreeSelector';
import { EsqObjectKindFactory } from 'src/esquire.ui/api/EsqObjectKindFactory';

export { EsqFlatTreeSelector } from '../EsqFlatTreeSelector';

@Component({
    selector: 'esq-select-entity-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatToolbarModule,
        MatButtonModule,
        MatDialogModule,
        DragDropModule,
        MatTree,
        MatTreeNode,
        MatTreeNodeDef,
        MatTreeNodePadding,
        MatIconModule,
        EsqDialogResizeDirective,
    ],
    templateUrl: './EsqSelectEntityDialog.html',
    styleUrls: ['../../../components/EsqDetailsDialog.scss', './EsqSelectEntityDialog.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class EsqSelectEntityDialog extends EsqExplorerHostDummy implements AfterViewInit, OnInit, OnDestroy {

    protected userId: string;
    protected dialogTitle: string;
    protected resizeKey: string;
    protected headerIcon: string;
    protected selectedNode: EsqTreeNode | null = null;
    protected hoveredNode: EsqTreeNode | null = null;
    public loading = signal(false);
    protected treeDs!: EsqFlatTreeSelector;
    protected preSelectedId: string = '';
    //private postFocusNodeId: string | null = null;
    protected callApi?: EsqExplorerCallApi;

    constructor(
        protected dialogRef: MatDialogRef<EsqSelectEntityDialog>,
        @Inject(MAT_DIALOG_DATA) data: any
    ) {
        super();
        this.userId        = data.userId || '';
        this.preSelectedId = data.entityId ? String(data.entityId) : '';
        this.treeDs        = data.treeDs;
        this.dialogTitle   = data.title || 'Select';
        this.resizeKey     = data.resizeKey || ('select-entity:' + this.userId);
        this.headerIcon    = data.headerIcon || '';
        this.callApi       = data.callApi;
    }

    ngOnInit(): void {
        this.callApi?.registerHost(this);
    }

    ngOnDestroy(): void {
        this.callApi?.unregisterHost(this);
    }

    override setLoading(on: boolean): void {
        this.loading.set(on);
    }

    ngAfterViewInit(): void {
        this.loading.set(true);
        this.treeDs.ensureLoaded()
            .then(() => {
                if (!this.preSelectedId)  return Promise.resolve();
            return this.treeDs.expandToNode(this.preSelectedId)
                .then(node => {
                    if (node) {
                        this.selectedNode = node;
                        // this.postFocusNodeId = node.id;
                        // trick: give the DOM time to render the node: max 0.5sec
                        //for (var i = 0; i < 50; i++) {
                            var el = document.getElementById('select-entity-node-' + node.id);
                            if (el) {
                                setTimeout(() => {
                                    (el as HTMLElement).focus()
                                }, 10);
                        //        break;
                            }
                        //}
                    }
                });
            })
            .finally(() => this.loading.set(false));
    }

    private async toggleSelectNode(node: EsqTreeNode): Promise<void> {
        await this.treeDs.toggleNode(node);
    }

    protected onToggleClick(node: EsqTreeNode, event: MouseEvent): void {
        event.stopPropagation();
        void this.toggleSelectNode(node);
    }

    protected async onToggleDblClick(node: EsqTreeNode, event: MouseEvent): Promise<void> {
        event.stopPropagation();
        await this.toggleSelectNode(node);
    }

    protected onNodeClick(node: EsqTreeNode): void {
        this.selectedNode = node;
    }

    protected async onNodeDblClick(node: EsqTreeNode): Promise<void> {
        this.selectedNode = node;
        if (this.canSelect()) {
            this.onSelect();
        } else if (this.treeDs.isExpandable(node)) {
            await this.toggleSelectNode(node);
        }
    }

    protected async onNodeKeydown(event: KeyboardEvent, node: EsqTreeNode): Promise<void> {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                this.selectedNode = node;
                if (this.canSelect()) this.onSelect();
                break;
            case ' ':
                event.preventDefault();
                this.selectedNode = node;
                break;
            case 'ArrowLeft':
                event.preventDefault();
                if (node.expanded()) {
                    await this.toggleSelectNode(node);
                }
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (this.treeDs.isExpandable(node) && !node.expanded()) {
                    await this.toggleSelectNode(node);
                }
                break;
        }
    }

    protected isSelectable(node: EsqTreeNode): boolean {
        return true;
    }

    protected canSelect(): boolean {
        var ret = false;
        if (this.selectedNode) {
            ret = this.isSelectable(this.selectedNode);
        }
        return ret;
    }

    protected async onSelect(): Promise<void> {
        if (!this.canSelect() || !this.selectedNode) return;
        this.dialogRef.close({
            entityId:   String(this.selectedNode.entityId),
            entityKind: EsqObjectKindFactory.normalize(this.selectedNode.kind.id),
            entityName: this.selectedNode.name,
        });
    }

    @HostListener('keydown.escape')
    protected onCancel(): void {
        this.dialogRef.close(null);
    }
}
