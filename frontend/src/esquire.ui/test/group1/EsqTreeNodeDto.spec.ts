/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { EsqTreeNodeDto } from 'src/esquire.ui/api/EsqTreeNodeDto';

describe('EsqTreeNodeDto', () => {

    describe('constructor', () => {
        it('sets defaults when constructed with no args', () => {
            var dto = new EsqTreeNodeDto();
            expect(dto.id).toBe('');
            expect(dto.name).toBe('');
            expect(dto.entityId).toBe('');
            expect(dto.level).toBe(0);
        });

        it('maps JSON fields correctly', () => {
            var dto = new EsqTreeNodeDto({
                id: 'n1', parentId: 'p1', name: 'Node One',
                kind: 20, entityId: 'e1', level: 2,
                path: ['p0', 'p1'],
            });
            expect(dto.id).toBe('n1');
            expect(dto.parentId).toBe('p1');
            expect(dto.name).toBe('Node One');
            expect(dto.entityId).toBe('e1');
            expect(dto.level).toBe(2);
            expect(dto.path).toEqual(['p0', 'p1']);
        });
    });

    describe('value()', () => {
        it('returns string value for an existing string column', () => {
            var dto = new EsqTreeNodeDto({ id: 'n1', name: 'Test', customCol: 'hello' });
            expect(dto.value('customCol')).toBe('hello');
        });

        it('returns empty string for a missing column', () => {
            var dto = new EsqTreeNodeDto({ id: 'n1' });
            expect(dto.value('nonexistent')).toBe('');
        });

        it('returns empty string for a numeric column (not a string)', () => {
            var dto = new EsqTreeNodeDto({ id: 'n1', numericCol: 42 });
            expect(dto.value('numericCol')).toBe('');
        });
    });
});
