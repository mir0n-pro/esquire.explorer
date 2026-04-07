/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/01/2026 mir0n  initial: move command handler extracted from EsqExplorerComponent
* 04/07/2026 mir0n  use context.nodeKind / context.entityKind; thread nodeKind to EsqMoveDialog
*/
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { EsqEntityCommandHandler, EsqEntityCommandContext, EsqNodeCommandContext, SelectMode } from 'src/esquire.ui/api/EsqEntityCommandHandler';
import { EsqExplorerCallApi } from 'src/esquire.ui/api/EsqExplorerCallApi';
import { EsqTreeNode } from 'src/esquire.ui/api/EsqTreeNode';
import { EsqMoveDialog } from './EsqMoveDialog';
import { EsqFlatTreeDatasource } from '../EsqFlatTreeDatasource';
import { EsqRestApi } from 'src/esquire.ui/api/EsqRestApi';

/**
 * Handler for CMD_MOVE command
 * Opens move dialog and refreshes tree on success
 */
export class EsqMoveCommandHandler implements EsqEntityCommandHandler {
    constructor(
        private getDatasource: () => EsqFlatTreeDatasource | undefined
    ) {}


  canHandle(cmd: string): boolean {
    return cmd === EsqExplorerCallApi.CMD_MOVE;
  }

  /**
   * Execute with node context (from call())
   */
  async executeWithNode(context: EsqNodeCommandContext): Promise<void> {
    var asOwner = context.selectMode === SelectMode.SelectTree;
    return this.openMoveDialog(context.node, context.nodeKind, context.dialog, context.restApi, context.userId,
      (entityId: string) => context.host?.onTreeRefresh(entityId, asOwner));
  }

  /**
   * Execute with entity context (from calle())
   * Fetches node first, then opens dialog
   */
  async executeWithEntity(context: EsqEntityCommandContext): Promise<void> {
    // Fetch entity node (entityKind already normalized by doEntityCommand)
    var node = await this.fetchNode(context.restApi, context.entityKind, context.entityId, context.entityName);
    if (!node) {
      return;
    }
    var asOwner = context.selectMode === SelectMode.SelectTree;
    return this.openMoveDialog(node, context.entityKind, context.dialog, context.restApi, context.userId,
      (entityId: string) => context.host?.onTreeRefresh(entityId, asOwner));
  }

  /**
   * Fetch node from entity parameters
   */
  private async fetchNode(restApi: EsqRestApi, entityKind: number, entityId: string, entityName: string): Promise<EsqTreeNode | undefined> {
    var _enode_;
    if (entityId.length > 0) {
      _enode_ = await firstValueFrom(
        restApi.esquireEntityNode(entityKind, entityId, "")
      ).catch(console.error);
    } else {
      _enode_ = await firstValueFrom(
        restApi.esquireEntityNode(entityKind, "", entityName)
      ).catch(console.error);
    }
    return _enode_ ? new EsqTreeNode(_enode_, undefined) : undefined;
  }

  /**
   * Open move dialog and handle result
   */
  private async openMoveDialog(node: EsqTreeNode, nodeKind: number, dialog: MatDialog, restApi: EsqRestApi, userId: string, onRefresh: (entityId: string) => void): Promise<void> {
    var dialogRef = dialog.open(EsqMoveDialog, {
      autoFocus: false,
      panelClass: 'esq-dialog',
      data: {
        node,
        nodeKind,
        getFlatDs: () => this.getDatasource(),
        restApi,
        userId
      }
    });
    dialogRef.updateSize('280px', '460px');

    // Wait for result
    var moved = await new Promise<boolean>(resolve =>
      dialogRef.afterClosed().subscribe((r: boolean | null | undefined) =>
        resolve(r === true)
      )
    );

    // Refresh on success
    if (moved) {
      setTimeout(() => onRefresh(node.entityId), 250);
    }
  }
}
