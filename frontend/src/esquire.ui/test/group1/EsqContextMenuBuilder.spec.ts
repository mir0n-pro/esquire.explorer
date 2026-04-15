/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { EsqContextMenuBuilder } from 'src/esquire.ui/api/EsqContextMenuBuilder';
import { EsqObjectKindFactory } from 'src/esquire.ui/api/EsqObjectKindFactory';
import { EsqObjectKind } from 'src/esquire.ui/api/EsqObjectKind';

describe('EsqContextMenuBuilder', () => {

    beforeEach(() => {
        (EsqObjectKindFactory as any)['kinds'] = [];
    });

    describe('buildNewMenuItems()', () => {
        it('returns empty array for null parent', () => {
            expect(EsqContextMenuBuilder.buildNewMenuItems(null)).toEqual([]);
        });

        it('returns empty array when parent has no childKinds', () => {
            var node = { kind: new EsqObjectKind({ id: 20, childKinds: [] }) } as any;
            expect(EsqContextMenuBuilder.buildNewMenuItems(node)).toEqual([]);
        });

        it('returns a menu item for each registered child kind', () => {
            (EsqObjectKindFactory as any)['kinds'] = [
                new EsqObjectKind({ id: 34, name: 'client', icon: 'img/client.ico' }),
            ];
            var node = { kind: new EsqObjectKind({ id: 20, childKinds: [34] }) } as any;
            var items = EsqContextMenuBuilder.buildNewMenuItems(node);
            expect(items.length).toBe(1);
            expect(items[0].label).toBe('New client');
            expect(items[0].icon).toBe('img/client.ico');
            expect(items[0].kind.id).toBe(34);
        });

        it('skips unregistered child kinds', () => {
            (EsqObjectKindFactory as any)['kinds'] = [];
            var node = { kind: new EsqObjectKind({ id: 20, childKinds: [34] }) } as any;
            expect(EsqContextMenuBuilder.buildNewMenuItems(node)).toEqual([]);
        });
    });
});
