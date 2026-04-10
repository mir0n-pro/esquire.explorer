/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/09/2026 mir0n  initial: acct deposit command handler
*/
import { MatDialog } from '@angular/material/dialog';
import { EsqEntityCommandHandler, EsqEntityCommandContext, EsqNodeCommandContext, SelectMode } from 'src/esquire.ui/api/EsqEntityCommandHandler';
import { EsqExplorerCallApi } from 'src/esquire.ui/api/EsqExplorerCallApi';
import { EsqRestApi } from 'src/esquire.ui/api/EsqRestApi';
import { EsqDictionaryApi } from 'src/esquire.ui/api/EsqDictionaryApi';
import { EsqAcctDialog } from './EsqAcctDialog';

/**
 * Handler for CMD_ACCT command
 * Opens deposit dialog and refreshes tree on success
 */
export class EsqAcctCommandHandler implements EsqEntityCommandHandler {

    canHandle(cmd: string): boolean {
        return cmd === EsqExplorerCallApi.CMD_ACCT;
    }

    async executeWithNode(context: EsqNodeCommandContext): Promise<void> {
        var asOwner = context.selectMode === SelectMode.SelectTree;
        return this.openAcctDialog(
            context.nodeKind,
            context.node.entityId,
            context.node.name,
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
            data: { entityKind, entityId, entityName, restApi, dictionaryApi, callApi, userId }
        });
        dialogRef.updateSize('360px', 'auto');

        await new Promise<void>(resolve =>
            dialogRef.afterClosed().subscribe(() => resolve())
        );
    }
}
