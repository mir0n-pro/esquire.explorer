/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/01/2026 mir0n  initial: access profile command handler extracted from EsqExplorerCallApiMill
* 04/07/2026 mir0n  use context.nodeKind / context.entityKind
*/
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EsqEntityCommandHandler, EsqEntityCommandContext, EsqNodeCommandContext } from '../../api/EsqEntityCommandHandler';
import { EsqExplorerCallApi } from '../../api/EsqExplorerCallApi';
import { EsqAccessProfileDialog } from '../EsqAccessProfileDialog';

/**
 * Handler for CMD_KEY command
 * Opens access profile dialog
 */
export class EsqKeyCommandHandler implements EsqEntityCommandHandler {
  canHandle(cmd: string): boolean {
    return cmd === EsqExplorerCallApi.CMD_KEY;
  }

  async executeWithNode(context: EsqNodeCommandContext): Promise<void> {
    var readOnly = !context.accessProfile?.isCommandAllowed(
      context.cmd,
      context.node.entityId,
      context.nodeKind
    );

    setTimeout(() => {
      void this.runAccessProfileAsync(context.node.entityId, readOnly, context.dialog, context).catch(console.error);
    }, 0);
  }

  async executeWithEntity(context: EsqEntityCommandContext): Promise<void> {
    var readOnly = !context.accessProfile?.isCommandAllowed(
      context.cmd,
      context.entityId,
      context.entityKind  // already normalized by doEntityCommand()
    );

    setTimeout(() => {
      void this.runAccessProfileAsync(context.entityId, readOnly, context.dialog, context).catch(console.error);
    }, 0);
  }

  private async runAccessProfileAsync(
    id: string,
    readOnly: boolean,
    dialog: MatDialog,
    context: EsqEntityCommandContext | EsqNodeCommandContext
  ): Promise<void> {
    var dialogRef: MatDialogRef<any> = dialog.open(EsqAccessProfileDialog, {
      autoFocus: false,
      data: {
        id,
        restApi: context.restApi,
        dictionaryApi: context.dictionaryApi,
        callApi: context.callApi,
        readOnly,
        userId: context.userId
      }
    });

    return new Promise<void>((resolve) => {
      dialogRef.afterClosed().subscribe(() => resolve());
    });
  }
}
