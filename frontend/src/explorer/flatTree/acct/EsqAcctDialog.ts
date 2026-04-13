/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/09/2026 mir0n  initial: deposit form dialog; dictionary-driven fields (kind 980)
*                   entity read on init/refresh; stays open after submit
* 04/10/2026 mir0n  accept external defined REST command submitter
* 04/12/2026 mir0n  extract account picker to EsqAcctPicker; idLabel from dict field 'id';
*                   validateFields() before submit; onEnterKey event: Event
*/
import {
    Component,
    ElementRef,
    HostListener,
    Inject,
    OnDestroy,
    OnInit,
    inject,
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

import { EsqCommandSubmitter } from 'src/esquire.ui/api/EsqEntityCommandHandler';
import { EsqExplorerCallApi, EsqExplorerHostDummy } from 'src/esquire.ui/api/EsqExplorerCallApi';
import { EsqDialogResizeDirective } from 'src/esquire.ui/components/EsqDialogResizeDirective';
import { EsqTabFieldComponent } from 'src/esquire.ui/components/EsqTabFieldComponent';
import { EsqUtils } from 'src/esquire.ui/components/EsqUtils';
import { EsqValidationError } from 'src/esquire.ui/components/EsqValidationError';
import { MatIcon } from '@angular/material/icon';
import { EsqFlatTreeSelectorFactory } from 'src/esquire.ui/explorer/flatTree/EsqFlatTreeSelector';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EsqAcctPicker } from './EsqAcctPicker';
const ACCT_DEPOSIT_KIND = 1000;

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
    templateUrl: './EsqAcctDialog.html',
    styleUrls: ['../../../esquire.ui/components/EsqDetailsDialog.scss', './EsqAcctDialog.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class EsqAcctDialog extends EsqExplorerHostDummy implements OnInit, OnDestroy {

    private dialogRef: MatDialogRef<EsqAcctDialog>;
    protected restApi: EsqRestApi;
    private dictionaryApi: EsqDictionaryApi;
    private submitter?: EsqCommandSubmitter;
    protected callApi: EsqExplorerCallApi;

    protected entityKind: number;
    protected entityId: string;
    protected entityName: string;
    protected userId: string;
    protected selectorFactory?: EsqFlatTreeSelectorFactory;

    protected headerIcon: string = 'img/$sign.ico';
    protected headerText: string = '';
    protected idLabel: string = '';
    protected reloadTrigger: number = 0;
    protected fields: any[] = [];
    protected details: any = {};
    private dictLayers: any[] = [];

    private el = inject(ElementRef);

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
        this.submitter = data.submitter;
        this.callApi = data.callApi;
        this.userId = data.userId || '';
        this.selectorFactory = data.selectorFactory;
        this.details = { id: this.entityId, kind: this.entityKind };
        this.dialogRef.disableClose = true;
    }

    override setLoading(on: boolean): void {
        this.loading.set(on);
    }

    ngOnInit(): void {
        this.callApi?.registerHost(this);
        this.dictionaryApi.dictionary(ACCT_DEPOSIT_KIND).subscribe(layers => {
            this.dictLayers = layers;
            if (layers.length > 0) {
                this.headerText = layers[0].title;
            }
            var allFields: any[] = [];
            for (var tab of layers) {
                for (var field of tab.fields) {
                    if (field.name === 'id') this.idLabel = field.label;
                    if (field.readwrite > 0) {
                        allFields.push(field);
                    }
                }
            }
            this.fields = allFields;
            this.resetDetails();
            setTimeout(() => {
                var input = this.el.nativeElement.querySelector(
                    'esq-tab-field input:not([readonly]):not([disabled]), esq-tab-field select:not([disabled])'
                );
                if (input) (input as HTMLElement).focus();
            }, 0);
        });
    }

    ngOnDestroy(): void {
        this.callApi?.unregisterHost(this);
    }

    async loadEntity(): Promise<void> {
        this.reloadTrigger++;
    }

    protected onEntityChange(result: { entityId: string; entityKind: number; entityName: string }): void {
        this.entityId   = result.entityId;
        this.entityKind = result.entityKind;
        this.entityName = result.entityName;
        this.details.id   = this.entityId;
        this.details.kind = this.entityKind;
    }

    private resetDetails(): void {
        this.details = { id: this.entityId, kind: this.entityKind };
        for (var tab of this.dictLayers) {
            for (var field of tab.fields) {
                if (field.nullable !== 'Y' && field.default) {
                    this.details[field.name] = field.default;
                }
            }
        }
    }

    @HostListener('keydown.enter', ['$event'])
    onEnterKey(event: Event): void {
        if ((event.target as HTMLElement).tagName === 'TEXTAREA') return;
        if (this.canSubmit()) {
            event.preventDefault();
            void this.onSubmit();
        }
    }

    @HostListener('keydown.escape')
    onCancel(): void {
        this.dialogRef.close(null);
    }

    protected canSubmit(): boolean {
        return !this.saving() && !!this.details.amount && Number(this.details.amount) !== 0;
    }

    async onSubmit(): Promise<void> {
        if (!this.canSubmit()) {
            return;
        }
        var error = EsqUtils.validateFields(this.details, this.dictLayers);
        if (error) {
            await this.callApi.confirmDlg(null, this.headerText + ' Validation Error',
                error.message, EsqExplorerCallApi.ConfirmFlag.Ok);
            setTimeout(() => {
                var el = document.querySelector('[data-field="' + error!.fieldName + '"]') as HTMLElement;
                if (el) el.focus();
            }, 100);
            return;
        }
        var operationName = this.headerText;
        var rows: string[] = [];
        for (var field of this.fields) {
            var val = this.details[field.name];
            if (field.name === 'typeId') {
                if (val && field.listvalues) {
                    var matched = (field.listvalues as string[]).find((o: string) => o.split('~')[0] === String(val));
                    if (matched) operationName = matched.split('~')[1] || matched.split('~')[0];
                }
                continue;
            }
            if (val === null || val === undefined || val === '' || val === 0 || val === '0') continue;
            var display = field.type === 'number' ? EsqUtils.formatNumber(val, field.format) : String(val);
            rows.push(field.label + ': ' + display);
        }
        var lines: string[] = [
            'You are about to submit ' + operationName,
            'Account: ' + this.entityName,
            ...rows,
        ];
        lines.push('');
        lines.push('Are you sure to continue?');
        var result = await this.callApi.confirmDlg(null, 'Confirm Deposit', lines.join('\n'), EsqExplorerCallApi.ConfirmFlag.YesNo, 1);
        if (result !== 0) return;
        this.saving.set(true);
        try {
            var body = Object.assign({}, this.details);
            await firstValueFrom(this.submitter!.submit(this.entityKind, this.entityId, body));
            this.resetDetails();
            void this.loadEntity();
            setTimeout(() => {
                var input = this.el.nativeElement.querySelector(
                    'esq-tab-field input:not([readonly]):not([disabled]), esq-tab-field select:not([disabled])'
                );
                if (input) (input as HTMLElement).focus();
            }, 0);
        } catch (err: any) {
            if (err.errors && err.errors.length > 0) {
                var apiErr = err.errors[0];
                var valError: EsqValidationError = {
                    fieldName: apiErr.fieldName,
                    fieldLabel: apiErr.fieldLabel,
                    message: apiErr.message,
                    tabIndex: 0,
                };
                await this.callApi.confirmDlg(null, operationName + ' Error',
                    operationName + ' failed: ' + (err.detail || valError.message), EsqExplorerCallApi.ConfirmFlag.Ok);
                setTimeout(() => {
                    var el = document.querySelector('[data-field="' + valError.fieldName + '"]') as HTMLElement;
                    if (el) el.focus();
                }, 100);
            } else {
                var errMsg = EsqUtils.errorMessage(err);
                await this.callApi.confirmDlg(null, operationName + ' Error', operationName + ' failed: ' + errMsg, EsqExplorerCallApi.ConfirmFlag.Ok);
            }
        } finally {
            this.saving.set(false);
        }
    }
}
