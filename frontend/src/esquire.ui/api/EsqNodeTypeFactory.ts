import {EsqTreeNode} from "./EsqTreeNode";

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
*/
export interface EsqColumnHeaderDef {
  columnDef:string;
  header:string;
}

export class EsqNodeType {
  public id:number;
  public name:string;
  public icon:string;
  public detailed:boolean;
  public listHeaders: EsqColumnHeaderDef[];
  public childTypes: number[];
  public commands: string[];

  constructor (id:number, name:string, icon:string, detailed:boolean, childTypes?:number[], commands?:string[], listHeaders?: EsqColumnHeaderDef[]) {
    this.id = id;
    this.name = name;
    this.icon = icon;  
    this.detailed = detailed;  
    this.listHeaders = (listHeaders?listHeaders:[]);
    this.childTypes = (childTypes?childTypes:[]);
    this.commands =(commands?commands:[] );
  }

  public isCommandAllowed(cmd:string): boolean {
        if (!this.commands || this.commands.length == 0) {
            return false;
        }
        return this.commands.includes(cmd);
    }
    public isNewAllowed(): boolean {
        return this.childTypes.length > 0;
    }

}

export class EsqNodeTypeFactory {
  private static dictionary:EsqNodeType[] = [];
  public static UNKNOWN:EsqNodeType =  new EsqNodeType(0, "Unknown", "", false);
  public static MORE:EsqNodeType =  new EsqNodeType(999, "...", "", false);
  public static ACCESSPROFILE:EsqNodeType =  new EsqNodeType(998, "Access", "", false);

  private constructor (dictionary: EsqNodeType[]) {
  }

  static init(dictionary: EsqNodeType[]):void {
    this.dictionary = dictionary;
  }

  public static instanceOf(tipeId: number): EsqNodeType {
    var ret:EsqNodeType = EsqNodeTypeFactory.UNKNOWN;
    if (tipeId == 999) {
      ret = EsqNodeTypeFactory.MORE;
    } else {
      if (this.dictionary.length > 0 ){
        const res:EsqNodeType[] = this.dictionary.filter((x) => x.id == tipeId) as EsqNodeType[];
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
    const allowedTypeIds= parent.type.childTypes || [];
    return allowedTypeIds
        .map(id => this.instanceOf(id))
        .filter(type => type !== EsqNodeTypeFactory.UNKNOWN);
 }

}

