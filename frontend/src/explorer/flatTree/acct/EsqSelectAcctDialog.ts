/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/11/2026 mir0n  initial: account picker dialog
* 04/14/2026 mir0n  isSelectable() blocks re-selection of pre-selected entity
* 04/19/2026 mir0n  import paths migrated to @mir0n-pro/esquire.ui library
*/
import {
    Component,
    Inject,
    ViewEncapsulation,
} from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
    MatTree,
    MatTreeNode,
    MatTreeNodeDef,
    MatTreeNodePadding,
} from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { EsqTreeNode } from '@mir0n-pro/esquire.ui/api';
import { EsqDialogResizeDirective } from '@mir0n-pro/esquire.ui/components';
import { EsqSelectEntityDialog, EsqFlatTreeSelectorFactory } from '@mir0n-pro/esquire.ui/explorer/flatTree';

export { EsqFlatTreeSelector, EsqFlatTreeSelectorFactory } from '@mir0n-pro/esquire.ui/explorer/flatTree';

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
    templateUrl: './EsqSelectEntityDialog.html',
    styleUrls: ['./EsqSelectAcctDialog.scss'],
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
        var ret: boolean = node.kind.acct;
        if (ret && this.preSelectedId  && node.entityId) {
            ret = String(node.entityId) !== String(this.preSelectedId);
        }  
        return ret;
    }
}
