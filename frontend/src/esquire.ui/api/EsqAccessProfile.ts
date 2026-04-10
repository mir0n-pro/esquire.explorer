/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 02/17/2026 mir0n  isolated from generated rest api
*                   isCommandAllowed() with entity_id param, personal mode, kind rounding
* 03/10/2026 mir0n  DEBUG_SKIP_PERMISSION: isCommandAllowed() returns true when flag is set
*                   import EsqUtils for debug flag access
* 04/07/2026 mir0n  isCommandAllowed(): use EsqObjectKindFactory.normalize()
* 04/10/2026 mir0n  static readonly FLAG_INDEX replaced with customizable flagIndexes
*                   added static addFlagIndex()
*/
import {EsqExplorerCallApi} from './EsqExplorerCallApi';
import {EsqUtils} from "../components/EsqUtils";
import {EsqObjectKindFactory} from './EsqObjectKindFactory';
import {EsqObjectKind} from "./EsqObjectKind";
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

    private static flagIndexes:Record<string, number>[] = [
        {[EsqExplorerCallApi.CMD_NEW]: 0},
        {[EsqExplorerCallApi.CMD_DEFAULT]: 1},
        {[EsqExplorerCallApi.CMD_MOVE]: 1},
        {[EsqExplorerCallApi.CMD_DELETE]: 2},
        {[EsqExplorerCallApi.CMD_KEY]: 3},
    ];

    public isCommandAllowed(cmd: string, entity_id: string, kind: number): boolean {
        if (EsqUtils.DEBUG_SKIP_PERMISSION) {
            return true;
        }
        var ret: boolean = String(this.id) === String(entity_id); // xxx: "personal" mode
        if (!ret) {
            var knd: number = EsqObjectKindFactory.normalize(kind);
            var effectiveCmd: string = cmd || EsqExplorerCallApi.CMD_DEFAULT;
            var perm: EsqPermission | undefined = this.admin.find(p => p.kind === knd);
            if (perm) {
                const entry = EsqAccessProfile.flagIndexes.find(item => item[effectiveCmd] !== undefined);
                const index = entry ? entry[effectiveCmd] : undefined;
                if (perm && index !== undefined && index < perm.flags.length) {
                    ret = perm.flags[index] === 'Y';
                }
            }
        }
        return ret;
    }

    public static addFlagIndex(flag: string, index: number): void {
        const existing = EsqAccessProfile.flagIndexes.find(obj => obj.hasOwnProperty(flag));
        if (!existing) {
            EsqAccessProfile.flagIndexes.push({ [flag]: index });
        } else {
            existing[flag] = index; // Update existing instead
        }
    }

}