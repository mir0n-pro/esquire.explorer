/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/11/2026 mir0n  initial: account picker dialog
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
import { EsqTreeNode } from 'src/esquire.ui/api/EsqTreeNode';
import { EsqDialogResizeDirective } from 'src/esquire.ui/components/EsqDialogResizeDirective';
import { EsqSelectEntityDialog } from 'src/esquire.ui/explorer/flatTree/components/EsqSelectEntityDialog';
import { EsqFlatTreeSelectorFactory } from 'src/esquire.ui/explorer/flatTree/EsqFlatTreeSelector';

export { EsqFlatTreeSelector, EsqFlatTreeSelectorFactory } from 'src/esquire.ui/explorer/flatTree/EsqFlatTreeSelector';

@Component({
    selector: 'esq-select-acct-dialog',
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
    templateUrl: '../../../esquire.ui/explorer/flatTree/components/EsqSelectEntityDialog.html',
    styleUrls: [
        '../../../esquire.ui/components/EsqDetailsDialog.scss',
        '../../../esquire.ui/explorer/flatTree/components/EsqSelectEntityDialog.scss',
    ],
    encapsulation: ViewEncapsulation.None,
})
export class EsqSelectAcctDialog extends EsqSelectEntityDialog {

    private static readonly ACCT_TREE_KINDS = new Set([
        0,
        6,              // allaccounts folder
        8,              // allclients folder
        10,             // allmerchants folder
        20,             // organization
        34,             // client
        36,             // merchant
        50, 51,         // caccount, caccountlnk
        52, 53,         // maccount, maccountlnk
        54, 55,         // paccount, paccountlnk
    ]);

    constructor(
        dialogRef: MatDialogRef<EsqSelectEntityDialog>,
        @Inject(MAT_DIALOG_DATA) data: any
    ) {
        data.title      = data.title      || 'Select Account';
        data.resizeKey  = data.resizeKey  || ('select-acct:' + (data.userId || ''));
        data.headerIcon = 'img/$sign.ico';
        var factory: EsqFlatTreeSelectorFactory = data.selectorFactory;
        var kinds: Set<number> = data.treeKinds || EsqSelectAcctDialog.ACCT_TREE_KINDS;
        data.treeDs     = factory.createFlatTreeSelector(kinds, node => node.kind.acct);
        super(dialogRef, data);
    }

    protected override isSelectable(node: EsqTreeNode): boolean {
        return node.kind.acct;
    }
}
