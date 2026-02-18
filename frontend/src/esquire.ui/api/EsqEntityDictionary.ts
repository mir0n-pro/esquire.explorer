/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 12/24/2025 mir0n listvalues_kind moved inside of generic format 
* 02/13/2026 mir0n EsqNodeType renamed with EsqObjectKind
* 02/17/2026 mir0n added personal, minmax fields
*                  nullable changed from boolean to string
*/
export class EsqEntityField {
  name:string;              // +
  sort:number;              // x
  label:string;             // +
  type: string;             // +/- (string, number, flag, listvalues, date, datetime, href, tablist, tabstring, image)
  tooltip:string;           // x
  listvalues:string[];      // x in concrete order
  nullable:string;         // x
  nullmeaning:string;       // x
  validation:string;        // x 
  layer:number;             // +
  readwrite:number;         //(bitmap: 0:hidden,1:view, 3:full)
  format:string;   // +
  personal:string;
  minmax:string;   // +
  constructor(jsn : any) {
      this.name = jsn.name;
      this.sort = jsn.sort;
      this.label = jsn.label;
      this.type = jsn.type;
      this.tooltip = jsn.tooltip;
      this.listvalues = jsn.listvalues;
      this.nullable = jsn.nullable;
      this.nullmeaning = jsn.nullmeaning;
      this.validation = jsn.validation;
      this.layer = jsn.layer;
      this.readwrite = jsn.readwrite;
      this.format = jsn.format;
      this.personal = jsn.personal;
      this.minmax = jsn.minmax;
  }
};

//note: flag : string: Y/N values + null meaning
//      href   string[2], 0 : url, 1 : text 
//      image

export class EsqEntityDictionary {
  kind:number;            //entity kind, same as EsqObjectKind.id  
  layers:EsqEntityLayer[];  // sorted by [tab][order]
  constructor(entity_kind : number, jsn:any) {
    this.kind = entity_kind;
    this.layers = [];
    if (jsn) {
      jsn.forEach((x : any) => {
        this.layers[this.layers.length] = new EsqEntityLayer(x); 
      });
    }
  }
}

export class EsqEntityLayer {
  title:string;
  fields:EsqEntityField[]; // sorted by [tab][order]
  constructor(jsn : any) {
      this.title = jsn.title;
      this.fields = [];
      if (jsn.fields) {
        jsn.fields.forEach((x: any) => {
          this.fields[this.fields.length] = new EsqEntityField(x);
        });
      }
  }
}
