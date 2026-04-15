/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { of } from 'rxjs';
import { EsqDictionary } from 'src/esquire.ui/components/EsqDictionary';
import { EsqRestApi } from 'src/esquire.ui/api/EsqRestApi';

function mockLayers() {
    return [
        {
            title: 'Tab1',
            fields: [{ name: 'amount', label: 'Amount', type: 'number', readwrite: 3, nullable: 'N' }],
        },
    ];
}

describe('EsqDictionary', () => {
    var restApi: jasmine.SpyObj<EsqRestApi>;
    var dict: EsqDictionary;

    beforeEach(() => {
        restApi = jasmine.createSpyObj<EsqRestApi>('EsqRestApi', ['esquireDictionary']);
        restApi.esquireDictionary.and.returnValue(of(mockLayers()));
        dict = new EsqDictionary(restApi);
    });

    // ── dictionaryFromCache ───────────────────────────────────────────────────

    describe('dictionaryFromCache()', () => {
        it('returns empty array before any load', () => {
            expect(dict.dictionaryFromCache(980)).toEqual([]);
        });

        it('returns layers after dictionary() has been resolved', async () => {
            await dict._dictionary(980);
            var cached = dict.dictionaryFromCache(980);
            expect(cached.length).toBeGreaterThan(0);
        });
    });

    // ── dictionary ────────────────────────────────────────────────────────────

    describe('dictionary()', () => {
        it('returns an Observable that emits the loaded layers', (done) => {
            dict.dictionary(980).subscribe(layers => {
                expect(layers.length).toBeGreaterThan(0);
                done();
            });
        });

        it('calls REST API once for the given kind', async () => {
            await dict._dictionary(980);
            expect(restApi.esquireDictionary).toHaveBeenCalledWith(980);
            expect(restApi.esquireDictionary).toHaveBeenCalledTimes(1);
        });
    });

    // ── concurrent load deduplication ────────────────────────────────────────

    describe('concurrent calls — loadingMap dedup', () => {
        it('calls REST only once even when two loads are started concurrently', async () => {
            // Start two concurrent loads without awaiting the first
            var p1 = dict._dictionary(980);
            var p2 = dict._dictionary(980);
            await Promise.all([p1, p2]);
            // REST should have been called exactly once
            expect(restApi.esquireDictionary).toHaveBeenCalledTimes(1);
        });

        it('second call returns cached layers after first load completes', async () => {
            await dict._dictionary(980);
            await dict._dictionary(980);
            expect(restApi.esquireDictionary).toHaveBeenCalledTimes(1);
        });
    });
});
