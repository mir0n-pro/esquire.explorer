/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/13/2026 mir0n  initial: AcctOperation namespace; AmountEffect enum; OperationCode interface;
*                   DICT_KIND_DEPOSIT/WITHDRAWAL; valueOf()
*/

/**
 * Mirror of backend AcctOperation enum (pacMan.acct.AcctOperation).
 * Defines operation codes, amount effects, and dict kinds for account transactions.
 */
export namespace AcctOperation {

    export const DICT_KIND_DEPOSIT    = 1000;
    export const DICT_KIND_WITHDRAWAL = 1002;

    export enum AmountEffect {
        NEGATIVE = -1,   // the amount must be < 0
        ANY      =  0,   // any amount != 0
        POSITIVE =  1,   // the amount must be > 0
    }

    export interface OperationCode {
        id:       number;
        name:     string;
        label:    string;
        effect:   AmountEffect;
        dictKind: number;
        icon:     string;
    }

    export const UNKNOWN:    OperationCode = { id: 0, name: 'UNKNOWN',    label: 'Unknown',    effect: AmountEffect.ANY,      dictKind: DICT_KIND_DEPOSIT,    icon: 'img/$sign.ico'     };
    export const DEPOSIT:    OperationCode = { id: 1, name: 'DEPOSIT',    label: 'Deposit',    effect: AmountEffect.POSITIVE, dictKind: DICT_KIND_DEPOSIT,    icon: 'img/$sign.ico'     };
    export const WITHDRAWAL: OperationCode = { id: 2, name: 'WITHDRAWAL', label: 'Withdrawal', effect: AmountEffect.NEGATIVE, dictKind: DICT_KIND_WITHDRAWAL, icon: 'img/$withdraw.ico' };
    export const TRANSFER:   OperationCode = { id: 3, name: 'TRANSFER',   label: 'Transfer',   effect: AmountEffect.NEGATIVE, dictKind: DICT_KIND_WITHDRAWAL, icon: 'img/$transfer.ico' };
    export const ADJUSTMENT: OperationCode = { id: 4, name: 'ADJUSTMENT', label: 'Adjustment', effect: AmountEffect.ANY,      dictKind: DICT_KIND_DEPOSIT,    icon: 'img/$sign.ico'     };
    export const COMMISSION: OperationCode = { id: 5, name: 'COMMISSION', label: 'Commission', effect: AmountEffect.NEGATIVE, dictKind: DICT_KIND_WITHDRAWAL, icon: 'img/$withdraw.ico' };

    const _ALL: OperationCode[] = [UNKNOWN, DEPOSIT, WITHDRAWAL, TRANSFER, ADJUSTMENT, COMMISSION];

    export function valueOf(id: number): OperationCode {
        return _ALL.find(op => op.id === id) ?? UNKNOWN;
    }
}