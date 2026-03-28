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
   public dictionary (entity_kind: number): Observable<EsqEntityLayer[]> {
        if (!this.subRequested) {
            let kind:EsqObjectKind = EsqObjectKindFactory.instanceOf(entity_kind);
            if (kind.usr && !this.subRequested) {
                this.subRequested = true;
                [EsqObjectKindFactory.PERSON_PRIMARY.id, EsqObjectKindFactory.ADDRESS_POSTAL.id, EsqObjectKindFactory.ADDRESS_BIZ.id]
                    .forEach(id => {
                        this._dictionary(id);
                    });
            }
         }
        return from (this._dictionary (entity_kind));
    }
    public dictionaryFromCache (entity_kind: number): EsqEntityLayer[] {
        return this.loadFromCache (entity_kind) ;
    }
    public async _dictionary (entity_kind: number)  {
        var ret:EsqEntityLayer[] = this.loadFromCache(entity_kind);
        if (ret && ret.length == 0 ) {
            await this.loadDictionary(entity_kind).catch(console.error);
            ret = this.loadFromCache(entity_kind);
        }
        EsqUtils.log('_dictionary ', ret);
        return ret;
    } 

    private loadFromCache (entity_kind: number) :EsqEntityLayer[]  {
        var ret:EsqEntityLayer[] = [];
        let found:EsqEntityDictionary[] = this.datastore.filter((x)=> x.kind == entity_kind);
        if (found && found.length >0 ) {
            ret = found[0].layers;
        }
        return ret;
    }

    private loadDictionary(entity_kind: number): Promise<void> {
        if (this.loadingMap.has(entity_kind)) {
            return this.loadingMap.get(entity_kind)!;
        }
        EsqUtils.log('loadDictionary[ ');
        var p: Promise<void> = firstValueFrom(this.restApi.esquireDictionary(entity_kind))
            .then((_dict: any) => {
                if (_dict) {
                    var dict: EsqEntityDictionary = new EsqEntityDictionary(entity_kind, _dict);
                    this.datastore[this.datastore.length] = dict;
                }
                this.loadingMap.delete(entity_kind);
                EsqUtils.log(']loadDictionary');
            })
            .catch((err: any) => {
                this.loadingMap.delete(entity_kind);
                console.error(err);
            });
        this.loadingMap.set(entity_kind, p);
        return p;
    }

}
