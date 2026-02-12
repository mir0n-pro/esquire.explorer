/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 02/12/2026 mir0n  EsqNodeType in explicit file
*/

import { EsqNodeType} from './EsqNodeType';
import { EsqNodeTypeFactory } from './EsqNodeTypeFactory';
import { EsqTreeNode } from './EsqTreeNode';

export interface EsqNewMenuItem {
    label: string;
    icon: string;
    type: EsqNodeType;
}

export class EsqCommandMenuItem {
    label: string;
    icon: string;
    cmd: string;

    constructor (label:string, icon:string, cmd:string) {
        this.label = label;
        this.icon = icon;
        this.cmd = cmd;
    }
}

export class EsqContextMenuBuilder {
    public static CMD_NEW: string = "new";

    public static buildNewMenuItems(parent: EsqTreeNode | null | undefined): EsqNewMenuItem[] {
        const allowedTypes = EsqNodeTypeFactory.getAllowedChildTypes(parent)
        return allowedTypes.map(childType => ({
            label: `New ${childType.name}`,
            icon: childType.icon,
            type: childType
        }));
    }
}
