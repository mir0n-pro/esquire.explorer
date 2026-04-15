/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { EsqNodeStatus, EsqNodeStatusFactory } from 'src/esquire.ui/api/EsqNodeStatusFactory';

describe('EsqNodeStatusFactory', () => {

    beforeEach(() => {
        EsqNodeStatusFactory.init([
            new EsqNodeStatus(1, 'active',   'img/active.ico'),
            new EsqNodeStatus(2, 'inactive', 'img/inactive.ico'),
        ]);
    });

    afterEach(() => {
        EsqNodeStatusFactory.init([]);
    });

    describe('instanceOf()', () => {
        it('returns the matching status by id', () => {
            var s = EsqNodeStatusFactory.instanceOf(1);
            expect(s.id).toBe(1);
            expect(s.name).toBe('active');
            expect(s.icon).toBe('img/active.ico');
        });

        it('returns UNKNOWN for an unregistered id', () => {
            var s = EsqNodeStatusFactory.instanceOf(99);
            expect(s).toBe(EsqNodeStatusFactory.UNKNOWN);
        });

        it('returns UNKNOWN when dictionary is empty', () => {
            EsqNodeStatusFactory.init([]);
            var s = EsqNodeStatusFactory.instanceOf(1);
            expect(s).toBe(EsqNodeStatusFactory.UNKNOWN);
        });
    });
});
