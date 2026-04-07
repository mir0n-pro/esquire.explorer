/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 02/01/2026 mir0n  added childTypes array
*                   added commands array
*                   added isCommandAllowed()
*                   added isNewAllowed()
*                   added ACCESSPROFILE virtual note type
* 02/12/2026 mir0n  EsqNodeType in explicit file
*                   init() loading from server and keeps ability to be defined locally
* 02/13/2026 mir0n EsqNodeType renamed with EsqObjectKind
* 02/28/2026 mir0n  added static kinds: PERSON_PRIMARY (992), ADDRESS_POSTAL (988), ADDRESS_BIZ (990)
* 04/07/2026 mir0n  added static normalize(kind): number
*/

import {EsqTreeNode} from "./EsqTreeNode";
import {EsqObjectKind} from "./EsqObjectKind";
import {EsqRestApi} from "./EsqRestApi";
import {firstValueFrom} from "rxjs";

export class EsqObjectKindFactory {
  private static kinds:EsqObjectKind[] = [];
  public static UNKNOWN:EsqObjectKind = new EsqObjectKind({
        id: -1,
        name: "unknown"
    });

  public static MORE:EsqObjectKind = new EsqObjectKind({
      id: 999,
      name: "more",
      title: "..."
  });

  public static ACCESSPROFILE:EsqObjectKind =  new EsqObjectKind({
      id: 998,
      name: "accessprofile",
      title: "Access Profile"
  });
  public static PERSON_PRIMARY:EsqObjectKind =  new EsqObjectKind({
      id: 992,
      name: "person_primary",
      title: "Details"
  });
  public static ADDRESS_POSTAL:EsqObjectKind =  new EsqObjectKind({
      id: 988,
      name: "address_postal",
      title: "Address"
  });
    public static ADDRESS_BIZ:EsqObjectKind =  new EsqObjectKind({
        id: 990,
        name: "address_postal",
        title: "Address"
    });

  private constructor () {
  }

    private static update(kind: EsqObjectKind, kinds: readonly EsqObjectKind[]) {
        var given:EsqObjectKind|null = null;
        for (const k of kinds) {
            if (k.id == kind.id) {
                given = k;
                break;
            }
        }
        if (given) {
            if (given.icon && given.icon.length > 0) {
                kind.icon = given.icon;
            }
            if (given.listHeaders && given.listHeaders.length > 0) {
                kind.listHeaders = given.listHeaders;
            }
        }
    }
  public static async init(api: EsqRestApi | null | undefined, kinds: readonly EsqObjectKind[] | null | undefined){

      if (this.kinds.length == 0 ) {
          if (api) {
              const data = await firstValueFrom(api.esquireKinds());
              const src: any[] = (data as any[]) ?? [];
              src.forEach(k => {
                  let kind: EsqObjectKind = new EsqObjectKind(k);
                  if (kinds) {
                      this.update(kind, kinds);
                  }
                  this.kinds.push(kind);
              });
          } else if (kinds) {
              this.kinds = kinds.map(k => k);
          }
          //await api.esquireKinds().subscribe(kinds => {
          //    const src: any[] = (kinds as any[]) ?? [];
          //    this.kinds = src.map(k => (k instanceof EsqObjectKind) ? k : new EsqObjectKind(k));
          //});
      }
  }

  public static normalize(kind: number): number {
    return Math.floor(kind / 2) * 2;
  }

  public static instanceOf(kind: number): EsqObjectKind {
    var ret:EsqObjectKind = EsqObjectKindFactory.UNKNOWN;
    if (kind == 999) {
      ret = EsqObjectKindFactory.MORE;
    } else {
      if (this.kinds.length > 0 ){
        const res:EsqObjectKind[] = this.kinds.filter((x) => x.id == kind) as EsqObjectKind[];
        if (res && res.length > 0) {
            ret = res[0];
        }
      }
    }
    return ret;
  } ;

  public static getAllowedChildTypes(parent: EsqTreeNode | null | undefined): EsqObjectKind[] {
    if (!parent) {
        return [];
    }
    const allowedTypeIds= parent.kind.childKinds || [];
    return allowedTypeIds
        .map(id => this.instanceOf(id))
        .filter(type => type.id !== EsqObjectKindFactory.UNKNOWN.id);
  }

}

