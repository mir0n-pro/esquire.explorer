/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/09/2026 mir0n  initial: acct deposit command handler
* 04/10/2026 mir0n  use EsqShellConstants.CMD_ACCT
*                   accept external defined REST command submitter
* 04/12/2026 mir0n  selectorFactory param; pass to EsqAcctDialog; dialog size 480px
* 04/13/2026 mir0n  pass dictKind (parsed from subCmd) to EsqAcctDialog
*/
import { MatDialog } from '@angular/material/dialog';
import { EsqEntityCommandHandler, EsqEntityCommandContext, EsqNodeCommandContext, EsqCommandSubmitter, SelectMode } from 'src/esquire.ui/api/EsqEntityCommandHandler';
import { EsqExplorerCallApi } from 'src/esquire.ui/api/EsqExplorerCallApi';
import { EsqRestApi } from 'src/esquire.ui/api/EsqRestApi';
import { EsqDictionaryApi } from 'src/esquire.ui/api/EsqDictionaryApi';
import { EsqAcctDialog } from './EsqAcctDialog';
import { EsqFlatTreeSelectorFactory } from 'src/esquire.ui/explorer/flatTree/EsqFlatTreeSelector';
import {EsqShellConstants} from "../app-shell.contants";

/**
 * Handler for CMD_ACCT command
 * Opens deposit dialog and refreshes tree on success
 */
export class EsqAcctCommandHandler implements EsqEntityCommandHandler {

    constructor(
        private submitter?: EsqCommandSubmitter,
        private selectorFactory?: EsqFlatTreeSelectorFactory
    ) {}

    canHandle(cmd: string): boolean {
        return cmd === EsqShellConstants.CMD_ACCT;
    }

    async executeWithNode(context: EsqNodeCommandContext): Promise<void> {
        var asOwner = context.selectMode === SelectMode.SelectTree;
        return this.openAcctDialog(
            context.nodeKind,
            context.node.entityId,
            context.node.name,
            Number(context.subCmd),
            context.dialog,
            context.restApi,
            context.dictionaryApi,
            context.callApi,
            context.userId,
            (entityId: string) => context.host?.onTreeRefresh(entityId, asOwner)
        );
    }

    async executeWithEntity(context: EsqEntityCommandContext): Promise<void> {
        var asOwner = context.selectMode === SelectMode.SelectTree;
        return this.openAcctDialog(
            context.entityKind,
            context.entityId,
            context.entityName,
            Number(context.subCmd),
            context.dialog,
            context.restApi,
            context.dictionaryApi,
            context.callApi,
            context.userId,
            (entityId: string) => context.host?.onTreeRefresh(entityId, asOwner)
        );
    }

    private async openAcctDialog(
        entityKind: number,
        entityId: string,
        entityName: string,
        dictKind: number,
        dialog: MatDialog,
        restApi: EsqRestApi,
        dictionaryApi: EsqDictionaryApi,
        callApi: EsqExplorerCallApi,
        userId: string,
        onRefresh: (entityId: string) => void
    ): Promise<void> {
        var dialogRef = dialog.open(EsqAcctDialog, {
            autoFocus: false,
            panelClass: 'esq-dialog',
            data: { entityKind, entityId, entityName, dictKind, restApi, dictionaryApi, callApi, userId, submitter: this.submitter, selectorFactory: this.selectorFactory }
        });
        dialogRef.updateSize('480px', 'auto');

        await new Promise<void>(resolve =>
            dialogRef.afterClosed().subscribe(() => resolve())
        );
    }
}
