/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/01/2026 mir0n  initial: delete command handler extracted from EsqExplorerCallApiMill
* 04/07/2026 mir0n  use context.nodeKind / context.entityKind
*/
import { firstValueFrom } from 'rxjs';
import { EsqEntityCommandHandler, EsqEntityCommandContext, EsqNodeCommandContext } from '../../api/EsqEntityCommandHandler';
import { EsqExplorerCallApi } from '../../api/EsqExplorerCallApi';
import { EsqTreeNode } from '../../api/EsqTreeNode';
import { EsqRestApi } from '../../api/EsqRestApi';
import { EsqUtils } from '../EsqUtils';

/**
 * Handler for CMD_DELETE command
 * Confirms deletion and executes delete operation
 */
export class EsqDeleteCommandHandler implements EsqEntityCommandHandler {
  canHandle(cmd: string): boolean {
    return cmd === EsqExplorerCallApi.CMD_DELETE;
  }

  async executeWithNode(context: EsqNodeCommandContext): Promise<void> {
    setTimeout(() => {
      void this.doDelete(context.node, context.nodeKind, context.callApi, context.restApi, context.host).catch(console.error);
    }, 0);
  }

  async executeWithEntity(context: EsqEntityCommandContext): Promise<void> {
    // Fetch node first (entityKind already normalized by doEntityCommand)
    var node = await this.fetchNode(context.restApi, context.entityKind, context.entityId, context.entityName);
    if (!node) {
      return;
    }
    var nodeRef = node;
    setTimeout(() => {
      void this.doDelete(nodeRef, context.entityKind, context.callApi, context.restApi, context.host).catch(console.error);
    }, 0);
  }

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

  private async doDelete(node: EsqTreeNode, kind: number, callApi: EsqExplorerCallApi, restApi: EsqRestApi, host: any): Promise<void> {
    var result = await callApi.confirmDlg(
      node.kind,
      node.name + ' Delete',
      'You about to delete ' + node.name + '. Are you sure to continue?',
      EsqExplorerCallApi.ConfirmFlag.YesNo
    );
    if (result === 0) {
      try {
        await firstValueFrom(restApi.esquireCmdDel(kind, node.entityId));
        if (host) {
          var parentId = node.parent ? node.parent.id : "";
          if (parentId) {
            setTimeout(() => host.onTreeRefresh(parentId, true), 250);
          } else {
            setTimeout(() => host.onTreeRefresh(), 250);
          }
        }
      } catch (err: any) {
        var errMsg = EsqUtils.errorMessage(err);
        await callApi.confirmDlg(node.kind,
          node.name + ' Delete Error',
          'Delete failed: ' + errMsg,
          EsqExplorerCallApi.ConfirmFlag.Ok);
      }
    }
  }
}
