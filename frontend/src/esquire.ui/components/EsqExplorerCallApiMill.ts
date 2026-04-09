/*
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 12/24/2025 mir0n kind parameter is requried for esq-cmd, esq-enode
* 02/01/2026 mir0n added EsqExplorerCallApi:create()
*                  all method made protected, to let class extendable
*                  added AccessProfile dialog via command "key"
* 02/13/2026 mir0n EsqNodeType renamed with EsqObjectKind
* 02/17/2026 mir0n readOnly flag based on access profile permissions
*                  isCommandAllowed with entity_id param
*                  use EsqAccessProfile from esquire.ui/api
*                  use CMD_ constants from EsqExplorerCallApi
*                  console.log replaced with EsqUtils.log
* 03/19/2026 mir0n entity_kind normalized to even in doExplorerCommand2()
* 03/20/2026 mir0n  EsqExplorerHost registration; delayed onTreeRefresh() on 'treeRefresh' dialog result
* 03/26/2026 mir0n  doExplorerCreate(): opens EsqCreateEntityDialog; getParentEntityId()
*                   treeRefreshSelect result → host.onTreeRefreshSelect(); lastUserId tracking
* 03/26/2026 mir0n  confirmDlg() added
* 03/27/2026 mir0n  setUserId() from logon profile; userId propagated to all dialogs; removed lazy lastUserId workaround
* 03/28/2026 mir0n  doExplorerDelete(): confirm → esquireCmdDel → onTreeRefresh(parentId,true); CMD_DELETE handling
* 04/02/2026 mir0n  Refactored with EsqEntityCommandHandler implemenations
*                   call(): added subCmd, selectMode
*                   calle(): added subCmd, selectMode
*                   added registerHandler()
* 04/07/2026 mir0n  kind normalization centralized: doNodeCommand() → context.nodeKind,
*                   doEntityCommand() → context.entityKind, doCreate(); use EsqObjectKindFactory.normalize()
* 04/08/2026 mir0n  ExplorerHost registration redesigned : fanout host events to any number of registered hosts 
*/
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { EsqCreateEntityDialog } from "./EsqCreateEntityDialog";
import { EsqConfirmDialog } from "./EsqConfirmDialog";
import {EsqObjectKind} from 'src/esquire.ui/api/EsqObjectKind';

/*
import { EsqDictionaryApi
  , EsqExplorerCallApi
  , EsqRestApi
  , EsqTreeNode 
} from "@mir0n-pro/esquire.ui/api";
*/
import {EsqDictionaryApi} from 'src/esquire.ui/api/EsqDictionaryApi';
import {EsqExplorerCallApi, EsqExplorerHost} from 'src/esquire.ui/api/EsqExplorerCallApi';
import {EsqRestApi} from 'src/esquire.ui/api/EsqRestApi';
import {EsqTreeNode} from 'src/esquire.ui/api/EsqTreeNode';
import {EsqAccessProfile} from "src/esquire.ui/api/EsqAccessProfile";
import {EsqUtils} from "./EsqUtils";
import {EsqObjectKindFactory} from 'src/esquire.ui/api/EsqObjectKindFactory';
import {EsqCommandHandlerRegistry} from "./commands/EsqCommandHandlerRegistry";
import {
    EsqEntityCommandHandler,
    EsqEntityCommandContext,
    EsqNodeCommandContext,
    SelectMode
} from "src/esquire.ui/api/EsqEntityCommandHandler";
import {EsqKeyCommandHandler} from "./commands/EsqKeyCommandHandler";
import {EsqDefaultCommandHandler} from "./commands/EsqDefaultCommandHandler";
import {EsqDeleteCommandHandler} from "./commands/EsqDeleteCommandHandler";

export class EsqExplorerCallApiMill {
  dialog:MatDialog;
  dictionaryApi:EsqDictionaryApi;
  restApi:EsqRestApi;
  private host: EsqExplorerHostMill;
  protected lastUserId: string = "";
  private commandRegistry: EsqCommandHandlerRegistry = new EsqCommandHandlerRegistry();

  public constructor (dialog:MatDialog, dictionaryApi:EsqDictionaryApi, restApi:EsqRestApi) {
    this.dialog = dialog;
    this.dictionaryApi = dictionaryApi;
    this.restApi = restApi;
    this.host = new EsqExplorerHostMill();

    // Set handler for unregistered commands
    this.commandRegistry.setNotImplementedHandler(async (cmd: string) => {
      await this.confirmDlg(
        null,
        'Command Not Implemented',
        `Command "${cmd}" is not implemented yet.`,
        EsqExplorerCallApi.ConfirmFlag.Ok
      );
    });

    // Register built-in command handlers
    // Specific handlers must be registered before default to take precedence
    this.commandRegistry.register(new EsqDefaultCommandHandler());
    this.commandRegistry.register(new EsqKeyCommandHandler());
    this.commandRegistry.register(new EsqDeleteCommandHandler());
  }

  public instance():EsqExplorerCallApi {
    return this.esqExplorerCallApi();
  }

  public setUserId(userId: string): void {
    this.lastUserId = userId;
  }

  protected async doEntityCommand(cmd: string, subCmd: string|null, entity_id: string, entity_name: string, entityKind:number, accessProfile:EsqAccessProfile|null, selectMode: SelectMode = SelectMode.None) {
      entityKind = EsqObjectKindFactory.normalize(entityKind);

      // Build command context
      var context: EsqEntityCommandContext = {
          cmd: !cmd ? EsqExplorerCallApi.CMD_DEFAULT : cmd,
          subCmd,
          entityId: entity_id,
          entityName: entity_name,
          entityKind,
          accessProfile,
          selectMode,
          dialog: this.dialog,
          restApi: this.restApi,
          dictionaryApi: this.dictionaryApi,
          callApi: this.esqExplorerCallApi(),
          host: this.host,
          userId: this.lastUserId
      };

      // Dispatch through registry
      return this.commandRegistry.executeWithEntity(context.cmd, context);
  }

  protected getParentEntityId(node: EsqTreeNode): string {
    var ret: string = "";
    if (node.entityId) {
      ret = node.entityId;
    } else if (node.parent) {
      ret = this.getParentEntityId(node.parent);
    }
    return ret;
  }

  protected async doCreate(node : EsqTreeNode, typeId?: number) {
    var kind: number = EsqObjectKindFactory.normalize(typeId ?? node.kind.id);
    var parentId = this.getParentEntityId(node);
    var dialogRef: MatDialogRef<any> = this.dialog.open(EsqCreateEntityDialog, {
      autoFocus: false,
      data: {
        id: "",
        kind: kind,
        parentId: parentId,
        restApi: this.restApi,
        dictionaryApi: this.dictionaryApi,
        callApi: this.esqExplorerCallApi(),
        readOnly: false,
        userId: this.lastUserId,
        onError: (msg: string, err?: any) => {
          // EsqUtils.log('[2/4] EsqExplorerCallApiMill.onError: received error, calling host.setErrorMessage. Host exists: ' + (this.host ? 'YES' : 'NO'));
          if (this.host) {
            this.host.setErrorMessage(msg, err);
          } // else {
            // EsqUtils.log('[2/4] EsqExplorerCallApiMill.onError: host is NOT available!');
          // }
        }
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      EsqUtils.log(`Create dialog result: ${result}`);
      if (result && typeof result === 'string' && result.startsWith('treeRefreshSelect:') && this.host) {
        var entityId = result.substring('treeRefreshSelect:'.length);
        setTimeout(() => this.host!.onTreeRefresh(entityId), 250);
      } else if (result === 'treeRefresh' && this.host) {
        setTimeout(() => this.host!.onTreeRefresh(), 250);
      }
    });
    return new Promise<void>((resolve)=>resolve());
  }

  protected async doNodeCommand(cmd:string, subCmd: string|null, node : EsqTreeNode, accessProfile:EsqAccessProfile|null, selectMode: SelectMode = SelectMode.None) {
    // Build node command context
    var context: EsqNodeCommandContext = {
        cmd: !cmd ? EsqExplorerCallApi.CMD_DEFAULT : cmd,
        subCmd,
        node,
        nodeKind: EsqObjectKindFactory.normalize(node.kind.id),
        accessProfile,
        selectMode,
        dialog: this.dialog,
        restApi: this.restApi,
        dictionaryApi: this.dictionaryApi,
        callApi: this.esqExplorerCallApi(),
        host: this.host,
        userId: this.lastUserId
    };
    // Dispatch all commands through registry
    return this.commandRegistry.executeWithNode(context.cmd, context);
  }

  async confirmDlg(kind: EsqObjectKind | null, header: string, text: string, flag: EsqExplorerCallApi.ConfirmFlag, focus: number = 0): Promise<number> {
    var dialogRef = this.dialog.open(EsqConfirmDialog, {
      autoFocus: false,
      data: { kind, header, text, flag, focus, userId: this.lastUserId }
    });
    dialogRef.updateSize('28vw');
    return new Promise<number>((resolve) => {
      dialogRef.afterClosed().subscribe((result: number | undefined) => {
        resolve(result ?? 1);
      });
    });
  }

  public getHost(): EsqExplorerHost {
     return this.host;
  }

  protected esqExplorerCallApi(): EsqExplorerCallApi {
    return {
      call : (cmd: string, subCmd: string|null, node :EsqTreeNode, accessProfile:EsqAccessProfile|null, selectMode?: SelectMode) => {
        return this.doNodeCommand(cmd, subCmd, node, accessProfile, selectMode);
      },
      calle: (cmd: string, subCmd: string|null, entity_id: string, entity_name: string, entityKind: number, accessProfile:EsqAccessProfile|null, selectMode?: SelectMode) => {
        return this.doEntityCommand(cmd, subCmd, entity_id, entity_name, entityKind, accessProfile, selectMode);
      },
      create: (parent_node: EsqTreeNode, typeId?: number) => {
       return this.doCreate(parent_node, typeId);
      },
      registerHost: (host: EsqExplorerHost) => {
        this.host.addHost(host);
      },
      unregisterHost: (host: EsqExplorerHost) => {
          this.host.removeHost(host);
      },
      registerHandler: (handler: EsqEntityCommandHandler): void => {
          this.commandRegistry.register(handler);
      },
      confirmDlg: (kind: EsqObjectKind | null, header: string, text: string, flag: EsqExplorerCallApi.ConfirmFlag, focus?: number) => {
        return this.confirmDlg(kind, header, text, flag, focus);
      }
    }
  };
}

class EsqExplorerHostMill implements EsqExplorerHost {
    private hosts: EsqExplorerHost[] = [];
    public onTreeRefresh(entityId?: string, asOwner?: boolean): void {
        this.hosts.forEach(host => {
            host.onTreeRefresh(entityId, asOwner);
        });
    }
    public setErrorMessage(msg: string, err?: any): void {
        this.hosts.forEach(host => {
            host.setErrorMessage(msg,err);
        });
    }
    public setLoading(on: boolean): void {
        this.hosts.forEach(host => {
            host.setLoading(on);
        });
    }

    addHost(host: EsqExplorerHost): void {
        if (!this.hosts.includes(host)) {
            this.hosts.push(host);
        }
    }
    removeHost(host: EsqExplorerHost): void {
        var i = this.hosts.indexOf(host);
        if (i >= 0) {
            this.hosts.splice(i, 1);
        }
    }
}


