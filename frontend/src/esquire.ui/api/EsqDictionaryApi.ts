/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 02/28/2026 mir0n  added dictionaryFromCache() to interface
*/
import { Observable } from 'rxjs';
import { EsqEntityLayer } from './EsqEntityDictionary';

export interface EsqDictionaryApi {
    //dictionary: (entity_kind: number) => Observable<EsqEntityLayer[]>;
    dictionary(entityKind: number): Observable<EsqEntityLayer[]>;
    /** Sync: return cached layers if present; otherwise null/empty */
    dictionaryFromCache(entityKind: number): EsqEntityLayer[];

}
