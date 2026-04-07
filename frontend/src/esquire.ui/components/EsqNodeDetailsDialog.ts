/*
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 12/24/2025 mir0n added processing of tabstring field value type
*                  readOnly made public
*                  kind parameter is requried for esq-cmd, esq-enode
*                  listvalues_kind moved inside of generic format
* 02/01/2026 mir0n EsqTabLStringComponent renamed with EsqTabStringComponent
*                  added use EsqTabIknListComponent
* 02/04/2024 miron renamed with EsqNodeDetailsDialog (was EsqNodeEntityDetailsDialog)
* 02/05/2026 mir0n use EsqTabFieldComponent
* 02/12/2026 mir0n  EsqNodeType in explicit file
* 02/13/2026 mir0n  EsqNodeType renamed with EsqObjectKind
* 02/17/2026 mir0n  added fieldReadOnly method with personal flag support
*                   added userId field
* 02/18/2026 mir0n  added Save/Refresh buttons with change tracking
*                   wired onSave() to restApi.esquireCmdSave()
* 02/28/2026 mir0n  refactored to extend EsqEntityDetailsDialog (duplicate logic removed)
*                   added inline sub-entity field rendering
* 03/20/2026 mir0n  entity kind normalized to even (handles link-variant kinds)
* 03/27/2026 mir0n  EsqDialogResizeDirective added to imports
* 04/07/2026 mir0n  givenEntityKind set from data.nodeKind (pre-normalized by doNodeCommand)
*/

import {Component, Inject, ViewEncapsulation} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {EsqDialogResizeDirective} from './EsqDialogResizeDirective';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common'
import {MatTableModule } from '@angular/material/table';

import {EsqObjectKindFactory} from 'src/esquire.ui/api/EsqObjectKindFactory';
import {EsqTabFieldComponent} from "./EsqTabFieldComponent";
import {EsqObjectKind} from 'src/esquire.ui/api/EsqObjectKind';
import {EsqTreeNode} from 'src/esquire.ui/api/EsqTreeNode';
import {EsqNodeStatusFactory} from 'src/esquire.ui/api/EsqNodeStatusFactory';
import {FormsModule} from "@angular/forms";
import {EsqEntityDetailsDialog} from "./EsqEntityDetailsDialog";

  @Component({
  selector: 'details-dialog',
  templateUrl: './EsqNodeDetailsDialog.html',
  styleUrl: './EsqDetailsDialog.scss',
      imports: [
          MatDialogModule,
          MatButtonModule,
          MatTooltipModule,
          DragDropModule,
          EsqDialogResizeDirective,
          MatIcon,
          MatToolbarModule,
          MatTabsModule,
          MatDividerModule,
          CommonModule,
          MatTableModule,
          EsqTabFieldComponent,
          FormsModule
      ],
  encapsulation: ViewEncapsulation.None,
})

export class EsqNodeDetailsDialog extends EsqEntityDetailsDialog {
   public node: EsqTreeNode;

  constructor(
      dialogRef: MatDialogRef<EsqNodeDetailsDialog>,
      @Inject(MAT_DIALOG_DATA) data: any
    ) {
      super(dialogRef as any, data);

      this.node = data.node;
      this.givenEntityId = this.node.entityId;
      this.givenEntityKind = data.nodeKind;
    }

/// below node nuances
  nodeStatusIcon() {
    return EsqNodeStatusFactory.instanceOf(this.node.statusCode).icon;
  }

  nodeTypeName():string {
    return this.node.kind.name + (this.node.linkId?" (shortcut)" : "");
  }

  nodeTypeFromFormat(format:string) : EsqObjectKind {
    var id:number = -1; //unknown
    if (format) {
      var ftype:string[] = format.split('=');
      if (ftype.length > 1 && ftype[0] == 'kind') {
        id = Number(ftype[1]);
      }
    }
    return EsqObjectKindFactory.instanceOf(id);
  }

  fieldReadOnly(readwrite: number, personal?: string): boolean {
      var ret:boolean = true;
      if (String(this.node.entityId) === String(this.userId)) {
          // "personal" mode: only applicable fields
          ret = !("Y" === personal && readwrite == 3);
      } else {
          ret = this.readOnly || readwrite < 3;
      }
      return ret;
  }

}
