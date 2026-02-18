/*
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 02/12/2026 mir0n  EsqNodeType in explicit file
* 02/13/2026 mir0n  EsqNodeType renamed with EsqObjectKind
* 02/17/2026 mir0n  added field types: flag, number, string with listvalues
*                   added fieldReadOnly with personal flag support
*                   added nullable/nullmeaning handling
*                   added clearToNull, formatNumber, onNumberInput
*                   added tooltip support via field.tooltip
*/
import {AfterViewInit, 
  Component, 
  ElementRef, 
  Input, 
  OnDestroy,
  OnInit, 
  QueryList, 
  ViewChildren, 
  ViewEncapsulation
} from '@angular/core';
import { MatButtonModule} from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'
import {MatTableModule, MatTableDataSource, MatRow } from '@angular/material/table';
import { DataSource } from '@angular/cdk/collections';
/*  
import { EsqNodeType, EsqExplorerCallApi } from '@mir0n-pro/esquire.ui/api';
*/
import {EsqObjectKind} from 'src/esquire.ui/api/EsqObjectKind';
import {EsqExplorerCallApi} from 'src/esquire.ui/api/EsqExplorerCallApi';
import {EsqUtils} from './EsqUtils';
import {EsqObjectKindFactory} from "src/esquire.ui/api/EsqObjectKindFactory";
import {EsqTabIknListComponent} from "./EsqTabIknListComponent";
import {EsqTabIknfTableComponent} from "./EsqTabIknfTableComponent";
import {EsqTabStringComponent} from "./EsqTabStringComponent";
import {EsqTabListComponent} from "./EsqTabListComponent";
import {MatDivider} from "@angular/material/list";

  @Component({
  selector: 'esq-tab-field',
  templateUrl: './EsqTabFieldComponent.html',
  styleUrl: './EsqDetailsDialog.scss',
      imports: [
          MatButtonModule,
          MatTooltipModule,
  //        MatIcon,
          CommonModule,
          FormsModule,
          MatTableModule,
          EsqTabIknListComponent,
          EsqTabIknfTableComponent,
          EsqTabStringComponent,
          EsqTabListComponent,
          MatDivider
      ],
  encapsulation: ViewEncapsulation.None,
})

export class EsqTabFieldComponent implements OnInit,  AfterViewInit, OnDestroy {
      @Input() public field!: any;  //EsqEntityField
      @Input() public details:any[] =  [];  //EsqEntity/EsqAcessProfile
      @Input() public callApi!: EsqExplorerCallApi;
      @Input() public readOnly: boolean = true;
      @Input() public enableDetails: boolean = true;
      @Input() public userId: string = "";


      constructor() {
      }

      ngOnInit() {
      }

      ngOnDestroy() {
      }

      ngAfterViewInit() {
      }

      fieldReadOnly(readwrite: number, personal?: string): boolean {
          var ret:boolean = true;
          if ((this.details as any)?.["id"] === this.userId) {
              // "personal" mode: only applicable fields
              ret = !("Y" === personal && readwrite == 3);
          } else {
              ret = this.readOnly || readwrite < 3;
          }
          return ret;
      }


      clearToNull(field: any): void {
          this.details[field.name] = '';
      }

      formatNumber(value: any, format?: string): string {
          return EsqUtils.formatNumber(value, format);
      }

      parseNumber(formatted: string): number | null {
          return EsqUtils.parseNumber(formatted);
      }

      onNumberInput(field: any, event: Event): void {
          const input = event.target as HTMLInputElement;
          const parsed = this.parseNumber(input.value);
          if (parsed !== null) {
              this.details[field.name] = parsed;
          }
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
  }


