/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 12/24/2025 mir0n kind parameter is requried for esq-cmd, esq-enode
* 02/01/2026 miron added esquireKey()
* 02/12/2026 miron added esquireKinds()
* 02/18/2026 mir0n  added esquireCmdSave(), esquireKeySave()
* 03/26/2026 mir0n  added esquireCmdNew to interface
* 03/28/2026 mir0n  added esquireCmdDel to interface
* 03/31/2026 mir0n  esquireCmdMove added to interface
*/
import { Observable } from 'rxjs';

export interface EsqRestApi {
 esquire: (id?: string, skip?: number, take?: number, options?:any) => Observable<any>;
 esquirePath: (id: string, options?:any) => Observable<any>;
 esquireCmd: (kind: number, id: string, cmd?: string, options?:any) => Observable<any>;
 esquireEntityNode: (kind: number, id?: string, name?: string, options?:any) => Observable<any>;
 esquireDictionary: (kind: number, options?:any) => Observable<any>;
 esquireKey:  (id?: string, options?:any) => Observable<any>;
 esquireKinds: () => Observable<any>;
 esquireCmdSave: (kind: number, id: string, body: any, cmd?: string, options?: any) => Observable<any>;
 esquireKeySave: (id: string, body: any, options?: any) => Observable<any>;
 esquireCmdNew: (kind: number, parentId: string, body: any, cmd?: string, options?: any) => Observable<any>;
 esquireCmdDel: (kind: number, id: string, cmd?: string, options?: any) => Observable<any>;
 esquireCmdMove: (kind: number, id: string, distId: string, options?: any) => Observable<any>;
}
