/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/13/2026 mir0n  initial: transfer dialog extending EsqAcctDialog; second account picker (id2/kind2)
* 04/14/2026 mir0n  onDictionaryLoaded hook; validateExtra self-contained async; same-account validation
*/
import {
    Component,
    Inject,
    ViewEncapsulation,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EsqDialogResizeDirective } from 'src/esquire.ui/components/EsqDialogResizeDirective';
import { EsqTabFieldComponent } from 'src/esquire.ui/components/EsqTabFieldComponent';
import { EsqAcctPicker } from './EsqAcctPicker';
import { EsqAcctDialog } from './EsqAcctDialog';
import { EsqExplorerCallApi } from 'src/esquire.ui/api/EsqExplorerCallApi';

@Component({
    selector: 'esq-acct-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatToolbarModule,
        MatButtonModule,
        MatDialogModule,
        DragDropModule,
        MatIcon,
        MatTooltipModule,
        EsqDialogResizeDirective,
        EsqTabFieldComponent,
        EsqAcctPicker,
    ],
    templateUrl: './EsqTransferDialog.html',
    styleUrls: ['../../../esquire.ui/components/EsqDetailsDialog.scss', './EsqAcctDialog.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class EsqTransferDialog extends EsqAcctDialog {

    protected id2Label:       string     = '';
    protected entityId2:      string     = '';
    protected entityKind2:    number     = 0;
    protected entityName2:    string     = '';
    protected reloadTrigger2: number     = 0;
    protected treeKinds2: Set<number> = new Set([
        0,
        6,              // allaccounts folder
        8,              // allclients folder
        10,             // allmerchants folder
        20,             // organization
        34,             // client
        36,             // merchant
        50, 51,         // caccount, caccountlnk
        52, 53,         // maccount, maccountlnk
                        // 54, 55 paccount excluded (no paper for transfer)
    ]);

    constructor(
        dialogRef: MatDialogRef<EsqTransferDialog>,
        @Inject(MAT_DIALOG_DATA) data: any
    ) {
        super(dialogRef as any, data);
        this.entityId2   = this.entityId;
        this.entityKind2 = this.entityKind;
        this.entityName2 = this.entityName;
    }

    protected override onDictionaryLoaded(): void {
        outer: for (var tab of this.dictLayers) {
            for (var field of tab.fields) {
                if (field.name === 'id2') {
                    this.id2Label = field.label;
                    break outer;
                }
            }
        }
    }

    protected onEntityChange2(result: { entityId: string; entityKind: number; entityName: string }): void {
        this.entityId2   = result.entityId;
        this.entityKind2 = result.entityKind;
        this.entityName2 = result.entityName;
        this.details.id2   = this.entityId2;
        this.details.kind2 = this.entityKind2;
    }

    protected override focusOnInit(): void {
        var pickers = this.el.nativeElement.querySelectorAll('esq-acct-picker');
        var btn = pickers[1]?.querySelector('.esq-acct-picker-btn') as HTMLElement;
        if (btn) btn.focus();
    }

    protected override async validateExtra(): Promise<string | null> {
        var ret: string | null = null;
        if (!this.entityId2) {
            ret = (this.id2Label || 'Destination account') + ' is required';
        } else if (this.entityId && this.entityId2 === this.entityId) {
            ret = 'Source and destination accounts must be different';
        }
        if(ret) {
            await this.callApi.confirmDlg(this.opKind, this.headerText + ' Validation Error',
                ret, EsqExplorerCallApi.ConfirmFlag.Ok);
            setTimeout(() => {
                var pickers = this.el.nativeElement.querySelectorAll('esq-acct-picker');
                var btn = pickers[1]?.querySelector('.esq-acct-picker-btn') as HTMLElement;
                if (btn) btn.focus();
            }, 100);
        }
        return ret;
    }

    protected override extraConfirmLines(): string[] {
        return [this.id2Label + ': ' + this.entityName2];
    }

    protected override canSubmit(): boolean {
        return super.canSubmit() && !!this.entityId2;
    }

    override async loadEntity(): Promise<void> {
        await super.loadEntity();
        this.reloadTrigger2++;
    }

    protected override resetDetails(): void {
        super.resetDetails();
        if (this.entityId2) {
            this.details.id2   = this.entityId2;
            this.details.kind2 = this.entityKind2;
        }
    }
}
