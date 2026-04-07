/*
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 12/24/2025 mir0n debug log added
* 02/28/2026 mir0n  added loading Set to prevent concurrent duplicate loads
*                   added subRequested flag; proactively loads sub-entity kinds
*                   added dictionaryFromCache() public method
* 03/28/2026 mir0n  loading Set → loadingMap: concurrent callers await the same in-flight Promise
* 04/07/2026 mir0n  entityKind naming (was entity_kind)
*/
import {firstValueFrom, from, Observable, of} from 'rxjs';
/*
import { EsqDictionaryApi
    , EsqEntityDictionary
    , EsqEntityLayer
    , EsqRestApi
} from '@mir0n-pro/esquire.ui/api';
*/
import {EsqDictionaryApi} from 'src/esquire.ui/api/EsqDictionaryApi';
import {EsqEntityDictionary} from 'src/esquire.ui/api/EsqEntityDictionary';
import {EsqEntityLayer} from 'src/esquire.ui/api/EsqEntityDictionary';
import {EsqRestApi} from 'src/esquire.ui/api/EsqRestApi';
import {EsqUtils} from "./EsqUtils";
import {EsqObjectKindFactory} from "../api/EsqObjectKindFactory";
import {EsqObjectKind} from "../api/EsqObjectKind";


export class EsqDictionary implements EsqDictionaryApi {

    private datastore:EsqEntityDictionary[] = [];
    private loadingMap:Map<number,Promise<void>> = new Map();
    private restApi:EsqRestApi;
    private subRequested:boolean = false;

    public constructor(restApi:EsqRestApi) {
        this.restApi = restApi;
    }
   public dictionary (entityKind: number): Observable<EsqEntityLayer[]> {
        if (!this.subRequested) {
            let kindObj:EsqObjectKind = EsqObjectKindFactory.instanceOf(entityKind);
            if (kindObj.usr && !this.subRequested) {
                this.subRequested = true;
                [EsqObjectKindFactory.PERSON_PRIMARY.id, EsqObjectKindFactory.ADDRESS_POSTAL.id, EsqObjectKindFactory.ADDRESS_BIZ.id]
                    .forEach(id => {
                        this._dictionary(id);
                    });
            }
         }
        return from (this._dictionary (entityKind));
    }
    public dictionaryFromCache (entityKind: number): EsqEntityLayer[] {
        return this.loadFromCache (entityKind) ;
    }
    public async _dictionary (entityKind: number)  {
        var ret:EsqEntityLayer[] = this.loadFromCache(entityKind);
        if (ret && ret.length == 0 ) {
            await this.loadDictionary(entityKind).catch(console.error);
            ret = this.loadFromCache(entityKind);
        }
        EsqUtils.log('_dictionary ', ret);
        return ret;
    } 

    private loadFromCache (entityKind: number) :EsqEntityLayer[]  {
        var ret:EsqEntityLayer[] = [];
        let found:EsqEntityDictionary[] = this.datastore.filter((x)=> x.kind == entityKind);
        if (found && found.length >0 ) {
            ret = found[0].layers;
        }
        return ret;
    }

    private loadDictionary(entityKind: number): Promise<void> {
        if (this.loadingMap.has(entityKind)) {
            return this.loadingMap.get(entityKind)!;
        }
        EsqUtils.log('loadDictionary[ ');
        var p: Promise<void> = firstValueFrom(this.restApi.esquireDictionary(entityKind))
            .then((_dict: any) => {
                if (_dict) {
                    var dict: EsqEntityDictionary = new EsqEntityDictionary(entityKind, _dict);
                    this.datastore[this.datastore.length] = dict;
                }
                this.loadingMap.delete(entityKind);
                EsqUtils.log(']loadDictionary');
            })
            .catch((err: any) => {
                this.loadingMap.delete(entityKind);
                console.error(err);
            });
        this.loadingMap.set(entityKind, p);
        return p;
    }

}
