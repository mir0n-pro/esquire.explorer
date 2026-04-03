/*
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 03/31/2026 mir0n  initial: org-only tree, confirm inside dialog, keyboard/mouse nav
* 04/02/2026 mir0n  lazy initialization of flatTreeDataSource
*                   message(s) text corrected
*/
import {
    Component,
    AfterViewInit,
    HostListener,
    Inject,
    ViewEncapsulation,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MatTree, MatTreeNode, MatTreeNodeDef, MatTreeNodePadding } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { EsqTreeNode } from 'src/esquire.ui/api/EsqTreeNode';
import { EsqRestApi } from 'src/esquire.ui/api/EsqRestApi';
import { EsqFlatTreeDatasource } from '../EsqFlatTreeDatasource';
import { EsqDialogResizeDirective } from 'src/esquire.ui/components/EsqDialogResizeDirective';
import { EsqConfirmDialog } from 'src/esquire.ui/components/EsqConfirmDialog';
import { EsqExplorerCallApi } from 'src/esquire.ui/api/EsqExplorerCallApi';
import { EsqUtils } from 'src/esquire.ui/components/EsqUtils';

@Component({
    selector: 'esq-move-dialog',
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
    templateUrl: './EsqMoveDialog.html',
    styleUrls: ['../../../components/EsqDetailsDialog.scss', './EsqMoveDialog.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class EsqMoveDialog implements AfterViewInit {
    protected movingNode: EsqTreeNode;
    private getFlatDs: (() => EsqFlatTreeDatasource | undefined) | undefined;
    private restApi: EsqRestApi;
    protected userId: string;
    protected selectedDest: EsqTreeNode | null = null;
    protected hoveredNode: EsqTreeNode | null = null;

    protected levelAccessor = (node: EsqTreeNode) => node.level;
    private treeNodes = new BehaviorSubject<EsqTreeNode[]>([]);
    protected moveDs = {
        connect: () => this.treeNodes.asObservable(),
        disconnect: () => {}
    };

    constructor(
        private dialogRef: MatDialogRef<EsqMoveDialog>,
        private dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) data: any
    ) {
        this.movingNode = data.node;
        this.getFlatDs = data.getFlatDs;
        this.restApi = data.restApi;
        this.userId = data.userId || '';
    }

    ngAfterViewInit(): void {
        const flatDs = this.getFlatDs ? this.getFlatDs() : undefined;
        if (!flatDs) {
            console.error('EsqMoveDialog: flatDs is undefined');
            this.dialogRef.close(null);
            return;
        }
        this.treeNodes.next(flatDs.getOrgNodes());
        var parent = this.movingNode.parent;
        while (parent && !parent.kind.org) {
            parent = parent.parent;
        }
        if (parent) {
            var found = flatDs.getOrgNodes().find(n => n.id === parent!.id);
            if (found) {
                setTimeout(() => {
                    this.selectedDest = found!;
                    var el = document.getElementById('move-node-' + found!.id);
                    if (el) el.focus();
                }, 0);
            }
        }
    }

    private orgParentEntityId(): string {
        var node: EsqTreeNode | undefined = this.movingNode.parent;
        while (node && !node.kind.org) {
            node = node.parent;
        }
        return node?.entityId ?? '';
    }

    protected canSelect(): boolean {
        var ret = false;
        if (this.selectedDest) {
            var sameParent = this.selectedDest.entityId === this.orgParentEntityId();
            if (!sameParent) {
                if (this.movingNode.kind.org) {
                    ret = !this.isAncestorOrSelf(this.movingNode, this.selectedDest);
                } else {
                    ret = true;
                }
            }
        }
        return ret;
    }

    private isAncestorOrSelf(moving: EsqTreeNode, dest: EsqTreeNode): boolean {
        var ret = dest.entityId === moving.entityId;
        var node: EsqTreeNode | undefined = dest.parent;
        while (!ret && node) {
            ret = node.entityId === moving.entityId;
            node = node.parent;
        }
        return ret;
    }

    private async toggleMoveNode(node: EsqTreeNode): Promise<void> {
        const flatDs = this.getFlatDs ? this.getFlatDs() : undefined;
        if (flatDs) {
            await flatDs.toggleOnTree(node);
            this.treeNodes.next(flatDs.getOrgNodes());
        }
    }

    protected onNodeClick(node: EsqTreeNode): void {
        this.selectedDest = node;
    }

    protected onToggleClick(node: EsqTreeNode, event: MouseEvent): void {
        event.stopPropagation();
        void this.toggleMoveNode(node);
    }

    protected async onToggleDblClick(node: EsqTreeNode, event: MouseEvent): Promise<void> {
        event.stopPropagation();
        await this.toggleMoveNode(node);
    }

    protected async onNodeDblClick(node: EsqTreeNode): Promise<void> {
        this.selectedDest = node;
        await this.onSelect();
    }

    protected async onNodeKeydown(event: KeyboardEvent, node: EsqTreeNode): Promise<void> {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                this.selectedDest = node;
                await this.onSelect();
                break;
            case ' ':
                event.preventDefault();
                this.selectedDest = node;
                break;
            case 'ArrowLeft':
                event.preventDefault();
                if (node.expanded()) {
                    await this.toggleMoveNode(node);
                }
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (node.expandable() && !node.expanded()) {
                    await this.toggleMoveNode(node);
                }
                break;
        }
    }

    protected async onSelect(): Promise<void> {
        if (!this.canSelect() || !this.selectedDest) {
            return;
        }
        var dest = this.selectedDest;
        var confirmRef = this.dialog.open(EsqConfirmDialog, {
            autoFocus: false,
            panelClass: 'esq-dialog',
            data: {
                kind: this.movingNode.kind,
                header: 'Move ' + this.movingNode.name,
                text: 'Move "' + this.movingNode.name + '" to "' + dest.name + '". Are you sure?',
                flag: EsqExplorerCallApi.ConfirmFlag.YesNo,
                focus: 0,
                userId: this.userId
            }
        });
        var confirmed = await new Promise<number>(resolve =>
            confirmRef.afterClosed().subscribe((r: number | undefined) => resolve(r ?? 1))
        );
        if (confirmed !== 0) {
            return;
        }
        var knd = Math.floor(this.movingNode.kind.id / 2) * 2;
        try {
            await firstValueFrom(this.restApi.esquireCmdMove(knd, this.movingNode.entityId, dest.entityId));
            this.dialogRef.close(true);
        } catch (err: any) {
            var errMsg = EsqUtils.errorMessage(err);
            var errRef = this.dialog.open(EsqConfirmDialog, {
                autoFocus: false,
                panelClass: 'esq-dialog',
                data: {
                    kind: this.movingNode.kind,
                    header: this.movingNode.name + ' Move Error',
                    text: 'Move failed: ' + errMsg,
                    flag: EsqExplorerCallApi.ConfirmFlag.Ok,
                    focus: 0,
                    userId: this.userId
                }
            });
            await new Promise<void>(resolve => errRef.afterClosed().subscribe(() => resolve()));
        }
    }

    @HostListener('keydown.escape')
    protected onCancel(): void {
        this.dialogRef.close(null);
    }
}
