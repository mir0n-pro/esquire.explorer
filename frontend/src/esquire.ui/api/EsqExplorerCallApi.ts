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
*/
import {  EsqTreeNode} from './EsqTreeNode';
import {EsqAccessProfile} from "./EsqAccessProfile";
import {EsqObjectKind} from './EsqObjectKind';

export interface EsqExplorerHost {
  onTreeRefresh(): void;
  onTreeRefreshSelect(entityId: string): void;
  setErrorMessage(msg: string, err?: any): void;
}

export interface EsqExplorerCallApi {
  call: (cmd: string, node: EsqTreeNode, accessProfile:EsqAccessProfile|null) => Promise<void>;
  calle: (cmd: string, entity_id: string, entity_name: string, entity_kind: number, accessProfile:EsqAccessProfile|null) => Promise<void>;
  create: (parent_node: EsqTreeNode, typeId?: number) => Promise<void>;
  registerHost: (host: EsqExplorerHost) => void;
  confirmDlg: (kind: EsqObjectKind | null, header: string, text: string, flag: EsqExplorerCallApi.ConfirmFlag, focus?: number) => Promise<number>;
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
