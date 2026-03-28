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
*/
import { firstValueFrom } from "rxjs";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { EsqNodeDialog }  from "./EsqNodeDialog";
import { EsqEntityDetailsDialog } from "./EsqEntityDetailsDialog";
import { EsqNodeDetailsDialog } from "./EsqNodeDetailsDialog";
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
import {EsqAccessProfileDialog} from "./EsqAccessProfileDialog";
import {EsqAccessProfile} from "src/esquire.ui/api/EsqAccessProfile";
import {EsqUtils} from "./EsqUtils";

export class EsqExplorerCallApiMill {
  dialog:MatDialog;
  dictionaryApi:EsqDictionaryApi;
  restApi:EsqRestApi;
  private host?: EsqExplorerHost;
  protected lastUserId: string = "";

  public constructor (dialog:MatDialog, dictionaryApi:EsqDictionaryApi, restApi:EsqRestApi) {
    this.dialog = dialog;
    this.dictionaryApi = dictionaryApi;
    this.restApi = restApi;
  }
  public instance():EsqExplorerCallApi {
    return this.esqExplorerCallApi();
  }

  public setUserId(userId: string): void {
    this.lastUserId = userId;
  }

  protected async runDetailsAsync(cmd:string, node : EsqTreeNode, readOnly:boolean, userId:string) : Promise<void> {
    var dialogRef:MatDialogRef<any>;
    if (node.kind.detailed) {
      dialogRef = this.dialog.open(EsqNodeDetailsDialog, {
        autoFocus: false,
        data: {
          node: node,
          restApi: this.restApi,
          callApi : this.esqExplorerCallApi(),
          dictionaryApi: this.dictionaryApi,
          readOnly: readOnly,
          userId: userId,
        }
      });
    } else {
      dialogRef = this.dialog.open(EsqNodeDialog, {
        autoFocus: false,
        data : {
          node : node,
          readOnly: readOnly,
          userId: userId,
        }
      });
    }

    dialogRef.afterClosed().subscribe(result => {
      EsqUtils.log(`Dialog result: ${result}`);
      if (result === 'treeRefresh' && this.host) {
        setTimeout(() => this.host!.onTreeRefresh(), 250);
      }
    });
    return new Promise<void>((resolve)=>resolve());
  }

    protected async runAccessProfileAsync(id:string, readOnly:boolean, userId:string) : Promise<void> {
        var dialogRef:MatDialogRef<any>;

        dialogRef = this.dialog.open(EsqAccessProfileDialog, {
            autoFocus: false,
            data: {
                id: id,
                restApi: this.restApi,
                dictionaryApi: this.dictionaryApi,
                callApi: this.esqExplorerCallApi(),
                readOnly: readOnly,
                userId: userId
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            EsqUtils.log(`Dialog result: ${result}`);
        });
        return new Promise<void>((resolve)=>resolve());
    }

    protected async runEntityDetailsAsync(id:string, kind:number, readOnly:boolean, userId:string) : Promise<void> {
        var dialogRef:MatDialogRef<any>;

        dialogRef = this.dialog.open(EsqEntityDetailsDialog, {
            autoFocus: false,
            data: {
                id: id,
                kind: kind,
                restApi: this.restApi,
                dictionaryApi: this.dictionaryApi,
                callApi: this.esqExplorerCallApi(),
                readOnly: readOnly,
                userId: userId,
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            EsqUtils.log(`Dialog result: ${result}`);
        });
        return new Promise<void>((resolve)=>resolve());
    }

  protected async doExplorerCommand2(cmd: string, entity_id: string, entity_name: string, entity_kind:number, accessProfile:EsqAccessProfile|null) {
      entity_kind = Math.floor(entity_kind / 2) * 2;
      if (cmd == EsqExplorerCallApi.CMD_KEY) {
          var readOnly:boolean = !accessProfile?.isCommandAllowed(cmd, entity_id, entity_kind);
          setTimeout(() => {
              void this.runAccessProfileAsync(entity_id, readOnly, accessProfile?.id || '').catch(console.error);
          }, 0);
      } else if (entity_id.length>0) {
          var readOnly:boolean = !accessProfile?.isCommandAllowed(cmd, entity_id, entity_kind);
          setTimeout(() => {
              void this.runEntityDetailsAsync(entity_id, entity_kind, readOnly, accessProfile?.id || '').catch(console.error);
          }, 0);
      } else {
          var _enode_ = await firstValueFrom(this.restApi.esquireEntityNode(entity_kind, "", entity_name))
              .catch((error) => console.error(error));
          if (_enode_) {
              let enode: EsqTreeNode = new EsqTreeNode(_enode_, undefined);
              var readOnly:boolean = !accessProfile?.isCommandAllowed(cmd, enode.entityId, entity_kind);
              setTimeout(() => {
                  void this.runDetailsAsync(cmd, enode as EsqTreeNode, readOnly, accessProfile?.id || '').catch(console.error);
              }, 0);
          }
      }
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

  protected async doExplorerCreate(node : EsqTreeNode, typeId?: number) {
    var kind: number = Math.floor((typeId ?? node.kind.id) / 2) * 2;
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

  protected async doExplorerDelete(node: EsqTreeNode): Promise<void> {
    var result = await this.confirmDlg(
        node.kind,
        node.name + ' Delete',
        'You about to delete ' + node.name + '. Are you sure to continue?',
        EsqExplorerCallApi.ConfirmFlag.YesNo
    );
    if (result === 0) {
        var kind: number = Math.floor(node.kind.id / 2) * 2;
        try {
            await firstValueFrom(this.restApi.esquireCmdDel(kind, node.entityId));
            if (this.host) {
                var parentId = node.parent ? node.parent.id : "";
                if (parentId) {
                    setTimeout(() => this.host!.onTreeRefresh(parentId, true), 250);
                } else {
                    setTimeout(() => this.host!.onTreeRefresh(), 250);
                }
            }
        } catch (err: any) {
            await this.confirmDlg(node.kind,
                node.name + ' Delete Error',
                'Delete failed: ' + (err.detail || err.title || err),
                EsqExplorerCallApi.ConfirmFlag.Ok);
        }
    }
  }

  protected async doExplorerCommand(cmd:string, node : EsqTreeNode, accessProfile:EsqAccessProfile|null) {
    var readOnly:boolean = !accessProfile?.isCommandAllowed(cmd, node.entityId, node.kind.id);
    if (cmd == EsqExplorerCallApi.CMD_DELETE) {
        setTimeout(() => {
            void this.doExplorerDelete(node).catch(console.error);
        }, 0);
    } else if (cmd == EsqExplorerCallApi.CMD_KEY) {
        setTimeout(() => {
            void this.runAccessProfileAsync(node.entityId, readOnly, accessProfile?.id || '').catch(console.error);
        }, 0);

    }  else {
        setTimeout(() => {
            void this.runDetailsAsync(cmd, node, readOnly, accessProfile?.id || '').catch(console.error);
        }, 0);
    }
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

  protected esqExplorerCallApi(): EsqExplorerCallApi {
    return {
      call : (cmd: string, node :EsqTreeNode, accessProfile:EsqAccessProfile|null) => {
        return this.doExplorerCommand(cmd, node, accessProfile);
      },
      calle: (cmd: string, entity_id: string, entity_name: string, entity_kind: number, accessProfile:EsqAccessProfile|null) => {
        return this.doExplorerCommand2(cmd, entity_id, entity_name, entity_kind, accessProfile);
      },
      create: (parent_node: EsqTreeNode, typeId?: number) => {
       return this.doExplorerCreate(parent_node, typeId);
      },
      registerHost: (host: EsqExplorerHost) => {
        this.host = host;
      },
      confirmDlg: (kind: EsqObjectKind | null, header: string, text: string, flag: EsqExplorerCallApi.ConfirmFlag, focus?: number) => {
        return this.confirmDlg(kind, header, text, flag, focus);
      }
    }
  };
}

