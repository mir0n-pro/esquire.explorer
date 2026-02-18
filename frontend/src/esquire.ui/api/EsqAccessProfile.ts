/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 02/17/2026 mir0n  isolated from generated rest api
*                   isCommandAllowed() with entity_id param, personal mode, kind rounding
*/
import {EsqExplorerCallApi} from './EsqExplorerCallApi';
export class EsqRole {
  id:number;
  name:string;
  adminFlg:string;
  constructor(jsn : any) {
      this.id = jsn.id || 0;
      this.name = jsn.name || '';
      this.adminFlg = jsn.adminFlg || 'N';
  }
}

export class EsqPermission {
  id:string;
  kind:number;
  name:string;
  type:string;
  flags:string[];
  constructor(jsn : any) {
      this.id = jsn.id || '';
      this.kind = jsn.kind || 0;
      this.name = jsn.name || '';
      this.type = jsn.type || '';
      this.flags = jsn.flags || [];
  }
}

//export class EsqAccessProfilePermissions {
//  admin:EsqPermission[];
//  tools:EsqPermission[];
//  constructor(jsn : any) {
//      this.admin = (jsn.admin || []).map((x: any) => new EsqPermission(x));
//      this.tools = (jsn.tools || []).map((x: any) => new EsqPermission(x));
//  }
//}

export class EsqAccessProfile {
    id: string;
    kind: number;
    name: string;
    loginId: string;
    email: string;
    pwdChangeForced: string;
    tfaMethod: string;
    roles: EsqRole[];
    admin:EsqPermission[];
    tools:EsqPermission[];
    //permissions: EsqAccessProfilePermissions;

    constructor(jsn: any) {
        this.id = jsn.id || '';
        this.kind = jsn.kind || 0;
        this.name = jsn.name || '';
        this.loginId = jsn.loginId || '';
        this.email = jsn.email || '';
        this.pwdChangeForced = jsn.pwdChangeForced || 'N';
        this.tfaMethod = jsn.tfaMethod || 'N';
        this.roles = (jsn.roles || []).map((x: any) => new EsqRole(x));
        this.admin = (jsn.admin || []).map((x: any) => new EsqPermission(x));
        this.tools = (jsn.tools || []).map((x: any) => new EsqPermission(x));
    }

    private static readonly FLAG_INDEX: Record<string, number> = {
        [EsqExplorerCallApi.CMD_NEW]: 0,
        [EsqExplorerCallApi.CMD_DEFAULT]: 1,
        [EsqExplorerCallApi.CMD_MOVE]: 1,
        [EsqExplorerCallApi.CMD_DELETE]: 2,
        [EsqExplorerCallApi.CMD_KEY]: 3,
        [EsqExplorerCallApi.CMD_ACCT]: 4
    };

    public isCommandAllowed(cmd: string, entity_id: string, kind: number): boolean {
        var ret: boolean = String(this.id) === String(entity_id); // xxx: "personal" mode
        if (!ret) {
            var knd: number =  Math.floor(kind / 2) * 2;
            var effectiveCmd: string = cmd || EsqExplorerCallApi.CMD_DEFAULT;
            var perm: EsqPermission | undefined = this.admin.find(p => p.kind === knd);
            if (perm) {
                var flagIndex: number = EsqAccessProfile.FLAG_INDEX[effectiveCmd];
                if (flagIndex !== undefined && flagIndex < perm.flags.length) {
                    ret = perm.flags[flagIndex] === 'Y';
                }
            }
        }
        return ret;
    }
}