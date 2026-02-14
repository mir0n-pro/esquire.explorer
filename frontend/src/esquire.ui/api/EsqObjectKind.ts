
/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 02/13/2026 mir0n EsqNodeType renamed with EsqObjectKind
*/

export class EsqColumnHeaderDef {
    columnDef?: string;
    header?: string;
    constructor ( jsn?:any) {
        if (jsn ) {
            if (jsn.columnDef) this.columnDef = jsn.columnDef;
            if (jsn.header) this.header = jsn.header;
        }
    }
}

export class EsqObjectKind {
    id: number = -1;
    name: string ="unknown";
    title: string = "";
    plural: string = "";
    desc: string = "";
    org: boolean = false;
    usr: boolean = false;
    acct: boolean = false;
    icon: string = "";
    detailed: boolean = false;
    childrenDetailed: boolean = false;
    treeFlags: string = "";
    listHeaders: EsqColumnHeaderDef[] = [];
    childKinds: number[] = [];
    commands: string[] = [];


 constructor ( jsn?:any)  {
    if (jsn ) {
        this.id = jsn.id;
        if (jsn.name) this.name = jsn.name;
        if (jsn.title) this.title = jsn.title;
        if (jsn.plural) this.plural = jsn.plural;
        if (jsn.desc) this.desc = jsn.desc;
        if (jsn.org) this.org = jsn.org;
        if (jsn.usr) this.usr = jsn.usr;
        if (jsn.acct) this.acct = jsn.acct;
        if (jsn.icon) this.icon = jsn.icon;
        if (jsn.detailed) this.detailed = jsn.detailed;
        if (jsn.childrenDetailed) this.childrenDetailed = jsn.childrenDetailed;
        if (jsn.treeFlags) this.treeFlags = jsn.treeFlags;
        if (jsn.listHeaders) this.listHeaders = jsn.listHeaders.map((h: any) => new EsqColumnHeaderDef(h));
        if (jsn.childKinds) this.childKinds = jsn.childKinds;
        if (jsn.commands) this.commands = jsn.commands;
    }
 }
 public isCommandAllowed(cmd:string): boolean {
    if (!this.commands || this.commands.length == 0) {
        return false;
    }
    return this.commands.includes(cmd);
 }

 public isNewAllowed(): boolean {
    return this.childKinds.length > 0;
 }

}