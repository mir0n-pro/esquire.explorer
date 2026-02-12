/*
*  Esquire frameworks (tm)
* 
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 02/12/2026 mir0n  EsqNodeType in explicit file
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
import { CommonModule } from '@angular/common'
import {MatTableModule, MatTableDataSource, MatRow } from '@angular/material/table';
import { DataSource } from '@angular/cdk/collections';
/*  
import { EsqNodeType, EsqExplorerCallApi } from '@mir0n-pro/esquire.ui/api';
*/
import {EsqNodeType} from 'src/esquire.ui/api/EsqNodeType';
import {EsqExplorerCallApi} from 'src/esquire.ui/api/EsqExplorerCallApi';
import {EsqNodeTypeFactory} from "src/esquire.ui/api/EsqNodeTypeFactory";
import {EsqTabIknListComponent} from "./EsqTabIknListComponent";
import {EsqTabIknfTableComponent} from "./EsqTabIknfTableComponent";
import {EsqTabStringComponent} from "./EsqTabStringComponent";
import {EsqTabListComponent} from "./EsqTabListComponent";
import {MatDivider} from "@angular/material/list";

  @Component({
  selector: 'esq-tab-field',
  templateUrl: './EsqTabFieldComponent.html',
  styleUrl: './EsqTabListComponent.scss',
      imports: [
          MatButtonModule,
          MatTooltipModule,
  //        MatIcon,
          CommonModule,
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

      constructor() {
      }

      ngOnInit() {
      }

      ngOnDestroy() {
      }

      ngAfterViewInit() {
      }


      nodeTypeFromFormat(format:string) : EsqNodeType {
          var id:number = -1; //unknown
          if (format) {
              var ftype:string[] = format.split('=');
              if (ftype.length > 1 && ftype[0] == 'kind') {
                  id = Number(ftype[1]);
              }
          }
          return EsqNodeTypeFactory.instanceOf(id);
      }
  }


