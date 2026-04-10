/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/09/2026 mir0n  initial: deposit form dialog; dictionary-driven fields (kind 980)
*                   entity read on init/refresh; stays open after submit
*/
import {
    Component,
    HostListener,
    Inject,
    OnDestroy,
    OnInit,
    signal,
    ViewEncapsulation,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { EsqRestApi } from 'src/esquire.ui/api/EsqRestApi';
import { EsqDictionaryApi } from 'src/esquire.ui/api/EsqDictionaryApi';

import { EsqExplorerCallApi, EsqExplorerHostDummy } from 'src/esquire.ui/api/EsqExplorerCallApi';
import { EsqDialogResizeDirective } from 'src/esquire.ui/components/EsqDialogResizeDirective';
import { EsqTabFieldComponent } from 'src/esquire.ui/components/EsqTabFieldComponent';
import { EsqUtils } from 'src/esquire.ui/components/EsqUtils';
import { EsqObjectKindFactory } from 'src/esquire.ui/api/EsqObjectKindFactory';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
const ACCT_ACTIVTY_KIND = 980;

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
    ],
    templateUrl: './EsqAcctDialog.html',
    styleUrl: '../../../esquire.ui/components/EsqDetailsDialog.scss',
    encapsulation: ViewEncapsulation.None,
})
export class EsqAcctDialog extends EsqExplorerHostDummy implements OnInit, OnDestroy {

    private dialogRef: MatDialogRef<EsqAcctDialog>;
    private restApi: EsqRestApi;
    private dictionaryApi: EsqDictionaryApi;
    protected callApi: EsqExplorerCallApi;

    protected entityKind: number;
    protected entityId: string;
    protected entityName: string;
    protected userId: string;

    protected headerIcon: string = '';
    protected entityData: any = null;
    protected fields: any[] = [];
    protected details: any = {};

    public loading = signal(false);
    public saving = signal(false);

    constructor(
        dialogRef: MatDialogRef<EsqAcctDialog>,
        @Inject(MAT_DIALOG_DATA) data: any
    ) {
        super();
        this.dialogRef = dialogRef;
        this.entityKind = data.entityKind;
        this.entityId = data.entityId;
        this.entityName = data.entityName;
        this.restApi = data.restApi;
        this.dictionaryApi = data.dictionaryApi;
        this.callApi = data.callApi;
        this.userId = data.userId || '';
        this.headerIcon = EsqObjectKindFactory.instanceOf(this.entityKind).icon;
        this.details = { id: this.entityId, kind: this.entityKind };
        this.dialogRef.disableClose = true;
    }

    override setLoading(on: boolean): void {
        this.loading.set(on);
    }

    ngOnInit(): void {
        this.callApi?.registerHost(this);
        void this.loadEntity();
        this.dictionaryApi.dictionary(ACCT_ACTIVTY_KIND).subscribe(layers => {
            var allFields: any[] = [];
            for (var tab of layers) {
                for (var field of tab.fields) {
                    if (field.nullable !== 'Y' && field.default && !(field.name in this.details)) {
                        this.details[field.name] = field.default;
                    }
                    if (field.readwrite > 0) {
                        allFields.push(field);
                    }
                }
            }
            this.fields = allFields;
        });
    }

    ngOnDestroy(): void {
        this.callApi?.unregisterHost(this);
    }

    async loadEntity(): Promise<void> {
        this.loading.set(true);
        try {
            this.entityData = await firstValueFrom(this.restApi.esquireCmd(this.entityKind, this.entityId));
        } catch (err: any) {
            var errMsg = EsqUtils.errorMessage(err);
            await this.callApi.confirmDlg(null, 'Load Error', errMsg, EsqExplorerCallApi.ConfirmFlag.Ok);
        } finally {
            this.loading.set(false);
        }
    }

    @HostListener('keydown.escape')
    onCancel(): void {
        this.dialogRef.close(null);
    }

    protected canSubmit(): boolean {
        return !this.saving();
    }

    async onSubmit(): Promise<void> {
        if (!this.canSubmit()) {
            return;
        }
        this.saving.set(true);
        try {
            var body = Object.assign({}, this.details);
            await firstValueFrom(this.restApi.esquireCmdAcct(this.entityKind, this.entityId, body));
            this.details = { id: this.entityId, kind: this.entityKind };
            void this.loadEntity();
        } catch (err: any) {
            var errMsg = EsqUtils.errorMessage(err);
            await this.callApi.confirmDlg(null, 'Deposit Error', 'Deposit failed: ' + errMsg, EsqExplorerCallApi.ConfirmFlag.Ok);
        } finally {
            this.saving.set(false);
        }
    }
}
