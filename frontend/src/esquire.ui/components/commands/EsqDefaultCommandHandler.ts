/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/01/2026 mir0n  initial: default entity details command handler extracted from EsqExplorerCallApiMill
* 04/07/2026 mir0n  use context.nodeKind / context.entityKind; thread nodeKind into EsqNodeDetailsDialog data
*/
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { EsqEntityCommandHandler, EsqEntityCommandContext, EsqNodeCommandContext } from '../../api/EsqEntityCommandHandler';
import { EsqExplorerCallApi, EsqExplorerHost } from '../../api/EsqExplorerCallApi';
import { EsqTreeNode } from '../../api/EsqTreeNode';
import { EsqEntityDetailsDialog } from '../EsqEntityDetailsDialog';
import { EsqNodeDialog } from '../EsqNodeDialog';
import { EsqNodeDetailsDialog } from '../EsqNodeDetailsDialog';
import { EsqUtils } from '../EsqUtils';
import { EsqDictionaryApi } from '../../api/EsqDictionaryApi';
import { EsqRestApi } from '../../api/EsqRestApi';

/**
 * Handler for default entity details commands
 * Handles all commands not explicitly handled by other handlers
 */
export class EsqDefaultCommandHandler implements EsqEntityCommandHandler {
  canHandle(cmd: string): boolean {
    // Handle CMD_DEFAULT and any unhandled commands (fallback)
    return (cmd === EsqExplorerCallApi.CMD_DEFAULT);
  }

  async executeWithNode(context: EsqNodeCommandContext): Promise<void> {
    var readOnly = !context.accessProfile?.isCommandAllowed(
      context.cmd,
      context.node.entityId,
      context.nodeKind
    );

    setTimeout(() => {
      void this.runDetailsAsync(context.cmd, context.node, context.nodeKind, readOnly, context.dialog, context.dictionaryApi, context.restApi, context.callApi, context.host, context.userId).catch(console.error);
    }, 0);
  }

  async executeWithEntity(context: EsqEntityCommandContext): Promise<void> {
    if (context.entityId.length > 0) {
      // Direct entity details
      var readOnly = !context.accessProfile?.isCommandAllowed(
        context.cmd,
        context.entityId,
        context.entityKind
      );
      setTimeout(() => {
        void this.runEntityDetailsAsync(context.entityId, context.entityKind, readOnly, context.dialog, context.dictionaryApi, context.restApi, context.callApi, context.userId).catch(console.error);
      }, 0);
    } else {
      // Fetch node first
      var _enode_ = await firstValueFrom(
        context.restApi.esquireEntityNode(context.entityKind, "", context.entityName)
      ).catch(console.error);

      if (_enode_) {
        var enode = new EsqTreeNode(_enode_, undefined);
        var readOnly = !context.accessProfile?.isCommandAllowed(
          context.cmd,
          enode.entityId,
          context.entityKind
        );
        setTimeout(() => {
          void this.runDetailsAsync(context.cmd, enode, context.entityKind, readOnly, context.dialog, context.dictionaryApi, context.restApi, context.callApi, context.host, context.userId).catch(console.error);
        }, 0);
      }
    }
  }

  private async runEntityDetailsAsync(
    id: string,
    entityKind: number,
    readOnly: boolean,
    dialog: MatDialog,
    dictionaryApi: EsqDictionaryApi,
    restApi: EsqRestApi,
    callApi: EsqExplorerCallApi,
    userId: string
  ): Promise<void> {
    var dialogRef: MatDialogRef<any> = dialog.open(EsqEntityDetailsDialog, {
      autoFocus: false,
      data: {
        id,
        kind: entityKind,
        restApi,
        dictionaryApi,
        callApi,
        readOnly,
        userId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      EsqUtils.log(`Dialog result: ${result}`);
    });

    return new Promise<void>((resolve) => resolve());
  }

  private async runDetailsAsync(
    cmd: string,
    node: EsqTreeNode,
    nodeKind: number,
    readOnly: boolean,
    dialog: MatDialog,
    dictionaryApi: EsqDictionaryApi,
    restApi: EsqRestApi,
    callApi: EsqExplorerCallApi,
    host: EsqExplorerHost | undefined,
    userId: string
  ): Promise<void> {
    var dialogRef: MatDialogRef<any>;
    if (node.kind.detailed) {
      dialogRef = dialog.open(EsqNodeDetailsDialog, {
        autoFocus: false,
        data: {
          node,
          nodeKind,
          restApi,
          callApi,
          dictionaryApi,
          readOnly,
          userId
        }
      });
    } else {
      dialogRef = dialog.open(EsqNodeDialog, {
        autoFocus: false,
        data: {
          node,
          readOnly,
          userId
        }
      });
    }

    dialogRef.afterClosed().subscribe(result => {
      EsqUtils.log(`Dialog result: ${result}`);
      if (result === 'treeRefresh' && host) {
        setTimeout(() => host!.onTreeRefresh(), 250);
      }
    });

    return new Promise<void>((resolve) => resolve());
  }
}
