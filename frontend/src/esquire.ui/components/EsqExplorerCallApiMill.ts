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
*/
import { firstValueFrom } from "rxjs";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { EsqNodeDialog }  from "./EsqNodeDialog";
import { EsqEntityDetailsDialog } from "./EsqEntityDetailsDialog";
import { EsqNodeDetailsDialog } from "./EsqNodeDetailsDialog";

/*
import { EsqDictionaryApi
  , EsqExplorerCallApi
  , EsqRestApi
  , EsqTreeNode 
} from "@mir0n-pro/esquire.ui/api";
*/
import {EsqDictionaryApi} from 'src/esquire.ui/api/EsqDictionaryApi';
import {EsqExplorerCallApi} from 'src/esquire.ui/api/EsqExplorerCallApi';
import {EsqRestApi} from 'src/esquire.ui/api/EsqRestApi';
import {EsqTreeNode} from 'src/esquire.ui/api/EsqTreeNode';
import {EsqAccessProfileDialog} from "./EsqAccessProfileDialog";

export class EsqExplorerCallApiMill {
  dialog:MatDialog;
  dictionaryApi:EsqDictionaryApi;
  restApi:EsqRestApi;
  
  public constructor (dialog:MatDialog, dictionaryApi:EsqDictionaryApi, restApi:EsqRestApi) {
    this.dialog = dialog;
    this.dictionaryApi = dictionaryApi;
    this.restApi = restApi;
  }
  public instance():EsqExplorerCallApi {
    return this.esqExplorerCallApi(); 
  }

  protected async runDetailsAsync(cmd:string, node : EsqTreeNode, readOnly:boolean) : Promise<void> {
    var dialogRef:MatDialogRef<any>;
    if (node.type.detailed) {
      dialogRef = this.dialog.open(EsqNodeDetailsDialog, {
        autoFocus: false,
        data: {
          node: node,
          restApi: this.restApi,
          callApi : this.esqExplorerCallApi(),
          dictionaryApi: this.dictionaryApi,
          readOnly: readOnly,
        }
      });
    } else {
      dialogRef = this.dialog.open(EsqNodeDialog, {
        autoFocus: false,
        data : {
          node : node,
          readOnly: readOnly,
        }
      });
    }

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
    return new Promise<void>((resolve)=>resolve());
  }

    protected async runAccessProfileAsync(id:string, readOnly:boolean) : Promise<void> {
        var dialogRef:MatDialogRef<any>;

        dialogRef = this.dialog.open(EsqAccessProfileDialog, {
            autoFocus: false,
            data: {
                id: id,
                restApi: this.restApi,
                dictionaryApi: this.dictionaryApi,
                readOnly: readOnly,
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            console.log(`Dialog result: ${result}`);
        });
        return new Promise<void>((resolve)=>resolve());
    }

    protected async runEntityDetailsAsync(id:string, kind:number, readOnly:boolean) : Promise<void> {
        var dialogRef:MatDialogRef<any>;

        dialogRef = this.dialog.open(EsqEntityDetailsDialog, {
            autoFocus: false,
            data: {
                id: id,
                kind: kind,
                restApi: this.restApi,
                dictionaryApi: this.dictionaryApi,
                readOnly: readOnly,
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            console.log(`Dialog result: ${result}`);
        });
        return new Promise<void>((resolve)=>resolve());
    }

  protected async doExplorerCommand2(cmd: string, entity_id: string, entity_name: string, entity_kind:number) {
      if (cmd == "key") {
          setTimeout(() => {
              void this.runAccessProfileAsync(entity_id,true).catch(console.error);
          }, 0);
      } else if (entity_id.length>0) {
          setTimeout(() => {
              void this.runEntityDetailsAsync(entity_id, entity_kind, true).catch(console.error);
          }, 0);
      } else {
          var _enode_ = await firstValueFrom(this.restApi.esquireEntityNode(entity_kind, "", entity_name))
              .catch((error) => console.error(error));
          if (_enode_) {
              let enode: EsqTreeNode = new EsqTreeNode(_enode_, undefined);
              setTimeout(() => {
                  void this.runDetailsAsync(cmd, enode as EsqTreeNode, true).catch(console.error);
              }, 0);
          }
      }
  }

  protected async doExplorerCreate(node : EsqTreeNode, typeId?: number) {
    return new Promise<void>((resolve)=>resolve());
  }

  protected async doExplorerCommand(cmd:string, node : EsqTreeNode) {
    //readOnly for now
    if (cmd == "key") {
        setTimeout(() => {
            void this.runAccessProfileAsync(node.entityId,true).catch(console.error);
        }, 0);

    }  else {
        setTimeout(() => {
            void this.runDetailsAsync(cmd, node, true).catch(console.error);
        }, 0);
    }
  }

  protected esqExplorerCallApi(): EsqExplorerCallApi {
    return {
      call : (cmd: string, node :EsqTreeNode) => {
        return this.doExplorerCommand(cmd, node);
      },
      calle: (cmd: string, entity_id: string, entity_name: string, entity_kind: number) => {
        return this.doExplorerCommand2(cmd, entity_id, entity_name, entity_kind);
      },
      create: (parent_node: EsqTreeNode, typeId?: number) => {
       return this.doExplorerCreate(parent_node, typeId);
      }
    }
  };
}

