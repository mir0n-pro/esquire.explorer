/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 02/01/2026 mir0n  added create()
*/
import {  EsqTreeNode} from './EsqTreeNode';

export interface EsqExplorerCallApi {
  call: (cmd: string, node: EsqTreeNode) => Promise<void>;
  calle: (cmd: string, entity_id: string, entity_name: string, entity_kind: number) => Promise<void>;
  create: (parent_node: EsqTreeNode, typeId?: number) => Promise<void>;
}
