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
* 04/07/2026 mir0n  movingNodeKind from data.nodeKind; use for esquireCmdMove
* 04/12/2026 mir0n  extend EsqSelectEntityDialog; MOVE_TREE_KINDS={0,20}; drop own tree/BehaviorSubject;
*                   callApi inherited from base (removed duplicate field)
*/
import {
    Component,
    Inject,
    ViewEncapsulation,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MatTree, MatTreeNode, MatTreeNodeDef, MatTreeNodePadding } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { EsqTreeNode } from 'src/esquire.ui/api/EsqTreeNode';
import { EsqRestApi } from 'src/esquire.ui/api/EsqRestApi';
import { EsqDialogResizeDirective } from 'src/esquire.ui/components/EsqDialogResizeDirective';
import { EsqExplorerCallApi } from 'src/esquire.ui/api/EsqExplorerCallApi';
import { EsqUtils } from 'src/esquire.ui/components/EsqUtils';
import { EsqSelectEntityDialog } from './EsqSelectEntityDialog';

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
    templateUrl: './EsqSelectEntityDialog.html',
    styleUrls: ['../../../components/EsqDetailsDialog.scss', './EsqSelectEntityDialog.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class EsqMoveDialog extends EsqSelectEntityDialog {

    private static readonly MOVE_TREE_KINDS = new Set([0, 20]);

    private movingNode: EsqTreeNode;
    private movingNodeKind: number;
    private restApi: EsqRestApi;

    constructor(
        dialogRef: MatDialogRef<EsqSelectEntityDialog>,
        @Inject(MAT_DIALOG_DATA) data: any
    ) {
        var movingNode: EsqTreeNode = data.node;
        var orgParent: EsqTreeNode | undefined = movingNode.parent;
        while (orgParent && !orgParent.kind.org) orgParent = orgParent.parent;

        data.title      = 'Move: ' + movingNode.name;
        data.resizeKey  = 'move:' + (data.userId || '');
        data.headerIcon = movingNode.kind.icon;
        data.entityId   = orgParent?.entityId || '';
        data.treeDs     = data.selectorFactory?.createFlatTreeSelector(EsqMoveDialog.MOVE_TREE_KINDS);
        super(dialogRef, data);

        this.movingNode     = movingNode;
        this.movingNodeKind = data.nodeKind;
        this.restApi        = data.restApi;
    }

    protected override isSelectable(node: EsqTreeNode): boolean {
        return node.kind.org;
    }

    protected override canSelect(): boolean {
        var ret = false;
        if (this.selectedNode) {
            var sameParent = this.selectedNode.entityId === this.orgParentEntityId();
            if (!sameParent) {
                if (this.movingNode.kind.org) {
                    ret = !this.isAncestorOrSelf(this.movingNode, this.selectedNode);
                } else {
                    ret = true;
                }
            }
        }
        return ret;
    }

    protected override async onSelect(): Promise<void> {
        if (!this.canSelect() || !this.selectedNode) return;
        var dest = this.selectedNode;
        var confirmed = await this.callApi!.confirmDlg(null, 'Move ' + this.movingNode.name,
            'Move "' + this.movingNode.name + '" to "' + dest.name + '". Are you sure?',
            EsqExplorerCallApi.ConfirmFlag.YesNo, 0);
        if (confirmed !== 0) {
            return;
        }
        try {
            await firstValueFrom(this.restApi.esquireCmdMove(this.movingNodeKind, this.movingNode.entityId, dest.entityId));
            this.dialogRef.close(true);
        } catch (err: any) {
            var errMsg = EsqUtils.errorMessage(err);
            await this.callApi!.confirmDlg(null, this.movingNode.name + ' Move Error',
                'Move failed: ' + errMsg, EsqExplorerCallApi.ConfirmFlag.Ok);
        }
    }

    private orgParentEntityId(): string {
        var node: EsqTreeNode | undefined = this.movingNode.parent;
        while (node && !node.kind.org) node = node.parent;
        return node?.entityId ?? '';
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
}
