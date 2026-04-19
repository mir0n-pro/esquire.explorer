/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/12/2026 mir0n  initial: standalone account picker;
* 04/19/2026 mir0n  import paths migrated to @mir0n-pro/esquire.ui library
*/
import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
    ViewEncapsulation,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import {
    EsqRestApi,
    EsqExplorerCallApi,
    EsqObjectKindFactory,
    EsqUtils,
} from '@mir0n-pro/esquire.ui/api';
import { EsqFlatTreeSelectorFactory } from '@mir0n-pro/esquire.ui/explorer/flatTree';
import { EsqSelectAcctDialog } from './EsqSelectAcctDialog';

@Component({
    selector: 'esq-acct-picker',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatTooltipModule,
    ],
    templateUrl: './EsqAcctPicker.html',
    styleUrls: ['./EsqAcctPicker.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class EsqAcctPicker implements OnInit, OnChanges {

    @Input() entityId:         string = '';
    @Input() entityKind:       number = 0;
    @Input() entityName:       string = '';
    @Input() userId:           string = '';
    @Input() restApi!:         EsqRestApi;
    @Input() callApi!:         EsqExplorerCallApi;
    @Input() selectorFactory?: EsqFlatTreeSelectorFactory;
    @Input() treeKinds?:       Set<number>;
    @Input() reloadTrigger:    number = 0;

    @Output() entityChange = new EventEmitter<{ entityId: string; entityKind: number; entityName: string }>();

    protected entityIcon = 'img/$sign.ico';
    protected entityData = signal<any>(null);
    public    loading    = signal(false);

    private dialog = inject(MatDialog);

    ngOnInit(): void {
        void this.loadEntity();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes['entityId'] && !changes['entityId'].firstChange) ||
            (changes['reloadTrigger'] && !changes['reloadTrigger'].firstChange)) {
            void this.loadEntity();
        }
    }

    public async loadEntity(): Promise<void> {
        if (!this.entityId) {
            this.entityIcon = 'img/$sign.ico';
            this.entityData.set(null);
            return;
        }
        this.loading.set(true);
        try {
            this.entityIcon = EsqObjectKindFactory.instanceOf(this.entityKind).icon;
            this.entityData.set(await firstValueFrom(this.restApi.esquireCmd(this.entityKind, this.entityId)));
        } catch (err: any) {
            await this.callApi.confirmDlg(null, 'Load Error',
                EsqUtils.errorMessage(err), EsqExplorerCallApi.ConfirmFlag.Ok);
        } finally {
            this.loading.set(false);
        }
    }

    async onSelectAccount(): Promise<void> {
        var selectRef = this.dialog.open(EsqSelectAcctDialog, {
            autoFocus: false,
            panelClass: 'esq-dialog',
            data: {
                userId:          this.userId,
                entityId:        this.entityId,
                selectorFactory: this.selectorFactory,
                treeKinds:       this.treeKinds,
                callApi:         this.callApi,
            }
        });
        selectRef.updateSize('320px', '480px');
        var result = await new Promise<any>(resolve =>
            selectRef.afterClosed().subscribe((r: any) => resolve(r ?? null))
        );
        if (!result) return;
        this.entityId   = result.entityId;
        this.entityKind = result.entityKind;
        this.entityName = result.entityName;
        this.entityChange.emit({ entityId: this.entityId, entityKind: this.entityKind, entityName: this.entityName });
        void this.loadEntity();
    }

    async onOpenDetails(): Promise<void> {
        await this.callApi.calle(EsqExplorerCallApi.CMD_DEFAULT, null,
            this.entityId, '', this.entityKind, null);
    }
}
