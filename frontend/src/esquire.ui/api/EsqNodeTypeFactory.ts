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
*/

import {EsqTreeNode} from "./EsqTreeNode";
import {EsqNodeType} from "./EsqNodeType";
import {EsqRestApi} from "./EsqRestApi";
import {firstValueFrom} from "rxjs";

export class EsqNodeTypeFactory {
  private static kinds:EsqNodeType[] = [];
  public static UNKNOWN:EsqNodeType = new EsqNodeType({
        id: -1,
        name: "unknown"
    });

  public static MORE:EsqNodeType = new EsqNodeType({
      id: 999,
      name: "more",
      title: "..."
  });

  public static ACCESSPROFILE:EsqNodeType =  new EsqNodeType({
      id: 998,
      name: "accessprofile",
      title: "Access Profile"
  });

  private constructor () {
  }

    private static update(kind: EsqNodeType, kinds: readonly EsqNodeType[]) {
        var given:EsqNodeType|null = null;
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
  public static async init(api: EsqRestApi | null | undefined, kinds: readonly EsqNodeType[] | null | undefined){

      if (this.kinds.length == 0 ) {
          if (api) {
              const data = await firstValueFrom(api.esquireKinds());
              const src: any[] = (data as any[]) ?? [];
              src.forEach(k => {
                  let kind: EsqNodeType = new EsqNodeType(k);
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
          //    this.kinds = src.map(k => (k instanceof EsqNodeType) ? k : new EsqNodeType(k));
          //});
      }
  }

  public static instanceOf(kind: number): EsqNodeType {
    var ret:EsqNodeType = EsqNodeTypeFactory.UNKNOWN;
    if (kind == 999) {
      ret = EsqNodeTypeFactory.MORE;
    } else {
      if (this.kinds.length > 0 ){
        const res:EsqNodeType[] = this.kinds.filter((x) => x.id == kind) as EsqNodeType[];
        if (res && res.length > 0) {
            ret = res[0];
        } 
      }
    }
    return ret;
  } ;

  public static getAllowedChildTypes(parent: EsqTreeNode | null | undefined): EsqNodeType[] {
    if (!parent) {
        return [];
    }
    const allowedTypeIds= parent.type.childKinds || [];
    return allowedTypeIds
        .map(id => this.instanceOf(id))
        .filter(type => type !== EsqNodeTypeFactory.UNKNOWN);
  }

}

