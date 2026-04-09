/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 02/01/2026 mir0n  added create()
* 02/17/2026 mir0n  added CMD_ command constants
*                   use EsqAccessProfile from esquire.ui/api
* 03/20/2026 mir0n  EsqExplorerHost interface; registerHost added to EsqExplorerCallApi
* 03/26/2026 mir0n  onTreeRefreshSelect(), setErrorMessage() added to EsqExplorerHost
* 03/26/2026 mir0n  confirmDlg() added to interface; ConfirmFlag enum; focus param
* 03/28/2026 mir0n  EsqExplorerHost: onTreeRefresh(entityId?, asOwner?) consolidates onTreeRefresh + onTreeRefreshSelect
* 04/02/2026 mir0n  call(): added subCmd, selectMode
*                   calle(): added subCmd, selectMode
*                   added registerHandler()
* 04/07/2026 mir0n  calle() param renamed to entityKind
* 04/08/2028 mir0n  added EsqExplorerHost.setLoading()
*                   added EsqExplorerCallApi.unregisterHost()
*                   added EsqExplorerHostDummy
*/
import {  EsqTreeNode} from './EsqTreeNode';
import {EsqAccessProfile} from "./EsqAccessProfile";
import {EsqObjectKind} from './EsqObjectKind';
import {EsqEntityCommandHandler, SelectMode} from "./EsqEntityCommandHandler";

export interface EsqExplorerHost {
  onTreeRefresh(entityId?: string, asOwner?: boolean): void;
  setErrorMessage(msg: string, err?: any): void;
  setLoading(on: boolean): void;
}

export interface EsqExplorerCallApi {
  call: (cmd: string, subCmd: string|null, node: EsqTreeNode, accessProfile:EsqAccessProfile|null, selectMode?: SelectMode) => Promise<void>;
  calle: (cmd: string, subCmd: string|null, entity_id: string, entity_name: string, entityKind: number, accessProfile:EsqAccessProfile|null, selectMode?: SelectMode) => Promise<void>;
  create: (parent_node: EsqTreeNode, typeId?: number) => Promise<void>;
  registerHost: (host: EsqExplorerHost) => void;
  unregisterHost: (host: EsqExplorerHost) => void;
  registerHandler(handler: EsqEntityCommandHandler): void;
  confirmDlg: (kind: EsqObjectKind | null, header: string, text: string, flag: EsqExplorerCallApi.ConfirmFlag, focus?: number) => Promise<number>;
}

export class EsqExplorerHostDummy implements EsqExplorerHost {
    onTreeRefresh(entityId?: string, asOwner?: boolean) {}
    setErrorMessage(msg: string, err?: any) {}
    setLoading(on: boolean) {}
}

export namespace EsqExplorerCallApi {
  export const CMD_DEFAULT: string = "details";
  export const CMD_NEW: string = "new";
  export const CMD_MOVE: string = "move";
  export const CMD_DELETE: string = "delete";
  export const CMD_KEY: string = "key";
  export const CMD_ACCT: string = "acct";

  export enum ConfirmFlag {
    Ok       = 0,   // alert-style: single OK button, no X
    YesNo    = 1,   // Yes / No buttons
    OkCancel = 2,   // OK / Cancel buttons
  }
}
