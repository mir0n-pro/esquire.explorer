/*
*  Esquire frameworks (tm)
* 
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 02/01/2026 mir0n EsqTabLStringComponent renamed with EsqTabStringComponent
* 02/17/2026 mir0n made editable with two-way [(value)] binding
*                  added readOnly, maxLength inputs
*/
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';


  @Component({
  selector: 'esq-tab-string',
  templateUrl: './EsqTabStringComponent.html',
  styleUrl: './EsqTabStringComponent.scss',
  imports: [
    NgClass,
    FormsModule
  ],
  encapsulation: ViewEncapsulation.None,
})

export class EsqTabStringComponent implements OnInit,  AfterViewInit, OnDestroy {

  @Input() public value!: string;
  @Output() public valueChange = new EventEmitter<string>();
  @Input() public readOnly: boolean = false;
  @Input() public maxLength: number = 2000;

  constructor() {
  }      

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  ngAfterViewInit() {
  }    

}

