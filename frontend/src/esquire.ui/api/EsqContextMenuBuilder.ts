/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 02/12/2026 mir0n  EsqNodeType in explicit file
* 02/13/2026 mir0n EsqNodeType renamed with EsqObjectKind
* 02/17/2026 mir0n CMD_ constants moved to EsqExplorerCallApi
* 04/13/2026 mir0n  EsqSubMenuItem interface; subItems on EsqCommandMenuItem for generic submenu support
*/

import { EsqObjectKind} from './EsqObjectKind';
import { EsqObjectKindFactory } from './EsqObjectKindFactory';
import { EsqTreeNode } from './EsqTreeNode';

export interface EsqNewMenuItem {
    label: string;
    icon: string;
    kind: EsqObjectKind;
}

export interface EsqSubMenuItem {
    label:     string;
    icon:      string;
    subCmd:    string;    // passed as subCmd to call()/calle()
    disabled?: boolean;   // optional grey-out; defaults false
}

export class EsqCommandMenuItem {
    label:     string;
    icon:      string;
    cmd:       string;
    subItems?: EsqSubMenuItem[];   // present = submenu trigger; absent = direct click

    constructor (label:string, icon:string, cmd:string, subItems?: EsqSubMenuItem[]) {
        this.label    = label;
        this.icon     = icon;
        this.cmd      = cmd;
        this.subItems = subItems;
    }
}

export class EsqContextMenuBuilder {
    public static buildNewMenuItems(parent: EsqTreeNode | null | undefined): EsqNewMenuItem[] {
        const allowedTypes = EsqObjectKindFactory.getAllowedChildTypes(parent)
        return allowedTypes.map(childType => ({
            label: `New ${childType.name}`,
            icon: childType.icon,
            kind: childType
        }));
    }
}
