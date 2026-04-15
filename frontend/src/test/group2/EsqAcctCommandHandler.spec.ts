/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { EsqAcctCommandHandler } from 'src/explorer/flatTree/acct/EsqAcctCommandHandler';
import { EsqShellConstants } from 'src/explorer/flatTree/app-shell.contants';

describe('EsqAcctCommandHandler', () => {
    var handler: EsqAcctCommandHandler;

    beforeEach(() => {
        handler = new EsqAcctCommandHandler();
    });

    describe('canHandle()', () => {
        it('returns true for CMD_ACCT', () => {
            expect(handler.canHandle(EsqShellConstants.CMD_ACCT)).toBeTrue();
        });
        it('returns false for edit', () => {
            expect(handler.canHandle('edit')).toBeFalse();
        });
        it('returns false for node', () => {
            expect(handler.canHandle('node')).toBeFalse();
        });
        it('returns false for empty string', () => {
            expect(handler.canHandle('')).toBeFalse();
        });
    });
});
