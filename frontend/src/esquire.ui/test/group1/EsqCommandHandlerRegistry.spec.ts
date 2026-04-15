/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { EsqCommandHandlerRegistry } from 'src/esquire.ui/components/commands/EsqCommandHandlerRegistry';
import { EsqEntityCommandHandler, EsqEntityCommandContext, EsqNodeCommandContext } from 'src/esquire.ui/api/EsqEntityCommandHandler';

function makeHandler(cmd: string): EsqEntityCommandHandler {
    return {
        canHandle: (c) => c === cmd,
        executeWithNode: jasmine.createSpy('executeWithNode').and.returnValue(Promise.resolve()),
        executeWithEntity: jasmine.createSpy('executeWithEntity').and.returnValue(Promise.resolve()),
    };
}

describe('EsqCommandHandlerRegistry', () => {
    var registry: EsqCommandHandlerRegistry;

    beforeEach(() => {
        registry = new EsqCommandHandlerRegistry();
    });

    // ── register / findHandler ────────────────────────────────────────────────

    describe('findHandler()', () => {
        it('returns the registered handler for a known command', () => {
            var h = makeHandler('default');
            registry.register(h);
            expect(registry.findHandler('default')).toBe(h);
        });

        it('returns undefined for an unknown command', () => {
            registry.register(makeHandler('default'));
            expect(registry.findHandler('unknown')).toBeUndefined();
        });

        it('returns the first matching handler when multiple are registered', () => {
            var h1 = makeHandler('default');
            var h2 = makeHandler('default');
            registry.register(h1);
            registry.register(h2);
            expect(registry.findHandler('default')).toBe(h1);
        });
    });

    // ── executeWithNode ───────────────────────────────────────────────────────

    describe('executeWithNode()', () => {
        it('delegates to the matching handler', async () => {
            var h = makeHandler('delete');
            registry.register(h);
            var ctx = {} as EsqNodeCommandContext;
            await registry.executeWithNode('delete', ctx);
            expect(h.executeWithNode).toHaveBeenCalledWith(ctx);
        });

        it('calls notImplemented callback when no handler found', async () => {
            var called = '';
            registry.setNotImplementedHandler(async (cmd) => { called = cmd; });
            await registry.executeWithNode('unknown', {} as EsqNodeCommandContext);
            expect(called).toBe('unknown');
        });

        it('throws when no handler and no notImplemented callback', async () => {
            await expectAsync(registry.executeWithNode('x', {} as EsqNodeCommandContext))
                .toBeRejectedWithError(/No handler/);
        });
    });

    // ── executeWithEntity ─────────────────────────────────────────────────────

    describe('executeWithEntity()', () => {
        it('delegates to the matching handler', async () => {
            var h = makeHandler('move');
            registry.register(h);
            var ctx = {} as EsqEntityCommandContext;
            await registry.executeWithEntity('move', ctx);
            expect(h.executeWithEntity).toHaveBeenCalledWith(ctx);
        });

        it('calls notImplemented callback when no handler found', async () => {
            var called = '';
            registry.setNotImplementedHandler(async (cmd) => { called = cmd; });
            await registry.executeWithEntity('unknown', {} as EsqEntityCommandContext);
            expect(called).toBe('unknown');
        });
    });
});
