/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { AcctOperation } from 'src/explorer/flatTree/acct/AcctOperation';

describe('AcctOperation', () => {

    describe('dict kind constants', () => {
        it('DICT_KIND_DEPOSIT is 1000', () => {
            expect(AcctOperation.DICT_KIND_DEPOSIT).toBe(1000);
        });
        it('DICT_KIND_WITHDRAWAL is 1002', () => {
            expect(AcctOperation.DICT_KIND_WITHDRAWAL).toBe(1002);
        });
        it('DICT_KIND_TRANSFER is 1004', () => {
            expect(AcctOperation.DICT_KIND_TRANSFER).toBe(1004);
        });
    });

    describe('valueOf()', () => {
        it('returns DEPOSIT for id 1', () => {
            expect(AcctOperation.valueOf(1)).toBe(AcctOperation.DEPOSIT);
        });
        it('returns WITHDRAWAL for id 2', () => {
            expect(AcctOperation.valueOf(2)).toBe(AcctOperation.WITHDRAWAL);
        });
        it('returns TRANSFER for id 3', () => {
            expect(AcctOperation.valueOf(3)).toBe(AcctOperation.TRANSFER);
        });
        it('returns ADJUSTMENT for id 4', () => {
            expect(AcctOperation.valueOf(4)).toBe(AcctOperation.ADJUSTMENT);
        });
        it('returns COMMISSION for id 5', () => {
            expect(AcctOperation.valueOf(5)).toBe(AcctOperation.COMMISSION);
        });
        it('returns UNKNOWN for unrecognised id', () => {
            expect(AcctOperation.valueOf(999)).toBe(AcctOperation.UNKNOWN);
        });
        it('returns UNKNOWN for id 0', () => {
            expect(AcctOperation.valueOf(0)).toBe(AcctOperation.UNKNOWN);
        });
    });

    describe('AmountEffect', () => {
        it('DEPOSIT effect is POSITIVE', () => {
            expect(AcctOperation.DEPOSIT.effect).toBe(AcctOperation.AmountEffect.POSITIVE);
        });
        it('WITHDRAWAL effect is NEGATIVE', () => {
            expect(AcctOperation.WITHDRAWAL.effect).toBe(AcctOperation.AmountEffect.NEGATIVE);
        });
        it('TRANSFER effect is NEGATIVE', () => {
            expect(AcctOperation.TRANSFER.effect).toBe(AcctOperation.AmountEffect.NEGATIVE);
        });
        it('ADJUSTMENT effect is ANY', () => {
            expect(AcctOperation.ADJUSTMENT.effect).toBe(AcctOperation.AmountEffect.ANY);
        });
        it('COMMISSION effect is NEGATIVE', () => {
            expect(AcctOperation.COMMISSION.effect).toBe(AcctOperation.AmountEffect.NEGATIVE);
        });
    });

    describe('dictKind wiring', () => {
        it('DEPOSIT dictKind matches DICT_KIND_DEPOSIT', () => {
            expect(AcctOperation.DEPOSIT.dictKind).toBe(AcctOperation.DICT_KIND_DEPOSIT);
        });
        it('WITHDRAWAL dictKind matches DICT_KIND_WITHDRAWAL', () => {
            expect(AcctOperation.WITHDRAWAL.dictKind).toBe(AcctOperation.DICT_KIND_WITHDRAWAL);
        });
        it('TRANSFER dictKind matches DICT_KIND_TRANSFER', () => {
            expect(AcctOperation.TRANSFER.dictKind).toBe(AcctOperation.DICT_KIND_TRANSFER);
        });
    });
});
