/*
*  Esquire frameworks (tm)
*  Esquire Explorer
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 12/24/2025 mir0n kind parameter is requried for esq-cmd, esq-enode
*/
import {Component,
  OnInit,
  AfterViewInit,
  inject,
} from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatDialog} from '@angular/material/dialog';

import {EsqNodeType
  , EsqNodeTypeFactory
  , EsqNodeStatus
  , EsqNodeStatusFactory
  , EsqRestApi
  , EsqDictionaryApi
  , EsqExplorerCallApi 
} from '@mir0n-pro/esquire.ui/api';
import { EsqExplorerCallApiMill, EsqDictionary } from '@mir0n-pro/esquire.ui/components';
import { EsqExplorerComponent} from '@mir0n-pro/esquire.ui/explorer/flatTree';
import {EsquireService} from '../../rest/api/esquire.service';


@Component({
  selector: 'app-explorer',
  standalone: true,
  imports: [
    MatToolbar,
    EsqExplorerComponent
  ],
  templateUrl: './app-explorer.component.html',
  styleUrl: './app-explorer.component.scss'
})

export class ExplorerComponent implements OnInit, AfterViewInit {
  dataService: EsquireService;
  readonly detailsDialog:MatDialog = inject(MatDialog);
  private callApiMill:EsqExplorerCallApiMill;
  private dictionary:EsqDictionaryApi;
   
  constructor(dataService: EsquireService) {
    this.dataService = dataService; 
    EsqNodeTypeFactory.init(Object.values(EsquireNodeTypes));
    EsqNodeStatusFactory.init(Object.values(EsquireStatuses));
    this.dictionary = new EsqDictionary(this.esqRestApiWrapper());
    this.callApiMill = new EsqExplorerCallApiMill(this.detailsDialog, this.dictionary, this.esqRestApiWrapper());
  }

  public esqRestApiWrapper(): EsqRestApi {
    return {
      esquire: (id?: string, skip?: number, take?: number, options?:any) => {
        return this.dataService.esquire(id?encodeURIComponent(id):undefined, skip, take, 'body', false, options) ;
      },
      esquirePath: (id: string, options?:any) => {
        return this.dataService.esquirePath(encodeURIComponent(id), options) ;
      },
      esquireCmd: ( kind: number, id: string, cmd?: string, options?:any) => {
        return this.dataService.esquireCmd( kind, encodeURIComponent(id), cmd, options) ;
      },
     esquireEntityNode: (kind: number, id?: string, name?: string, options?:any) => {
        return this.dataService.esquireEntityNode( kind, (id && id.length >0)? encodeURIComponent(id) : undefined,
          name?encodeURIComponent(name):undefined, 
          options
        );
      },
     esquireDictionary: (kind: number, options?:any) => {
        return this.dataService.esquireDictionary(kind , options);
      },
    }
  };

  public esqExplorerCallApiWrapper(): EsqExplorerCallApi {
    return this.callApiMill.instance();
  }

  async ngOnInit() {
  }

  async ngAfterViewInit() {
  }

}

export const EsquireNodeTypes = {
    System:      new EsqNodeType( 0, "System",             "img/folders/system.ico",  true,  [{columnDef:"name", header:"Name"},  {columnDef:"desc", header:"Description"}]),
    Pokemons:    new EsqNodeType( 2, "All accounts",       "img/folders/folder.ico",  false, [{columnDef:"name", header:"Account"},  {columnDef:"desc", header:"Description"}]),
    Games:       new EsqNodeType( 4, "All admin-s",        "img/folders/folder.ico",  false, [{columnDef:"name", header:"Administrator"},  {columnDef:"desc", header:"Description"}]),
    TvShows:     new EsqNodeType( 6, "All clients",        "img/folders/folder.ico",  false, [{columnDef:"name", header:"Client"},  {columnDef:"desc", header:"Description"}]),
    Books:       new EsqNodeType( 8, "All merchants",      "img/folders/folder.ico",  false, [{columnDef:"name", header:"Merchanr"},  {columnDef:"desc", header:"Description"}]),
    Posters:     new EsqNodeType(10, "Organization",       "img/org.ico",             true, [{columnDef:"name", header:"Name"},  {columnDef:"desc", header:"Description"}]),
    Pokemon:     new EsqNodeType(12, "Client",             "img/client.ico",          true,  [{columnDef:"name", header:"Account"},  {columnDef:"desc", header:"Description"}]),
    PokemonLink: new EsqNodeType(13, "Client",             "img/client.ico",          true, ),
    Game:        new EsqNodeType(14, "Merchant",           "img/merchant.ico",        true,  [{columnDef:"name", header:"Account"},  {columnDef:"desc", header:"Description"}]), 
    GameLink:    new EsqNodeType(15, "Merchant",           "img/merchant.ico",        true, ), 
    TvShow:      new EsqNodeType(16, "Admin",              "img/admin.ico",           true, ), 
    TvShowLonk:  new EsqNodeType(17, "Admin",              "img/admin.ico",           true, ),
    Book:        new EsqNodeType(18, "Client Account",     "img/acct.ico",            true, ), 
    BookLink:    new EsqNodeType(19, "Client Account",     "img/links/acctl.ico",     true, ),
    Poster:      new EsqNodeType(20, "Merchant Account",   "img/macct.ico",           true, ), 
    PosterLink:  new EsqNodeType(21, "Merchant Account",   "img/links/macctl.ico",    true, ),
} as const;

export const EsquireStatuses = {
    Empty:   new EsqNodeStatus(0,  "Empty",           "img/status/empty.ico"),
    Deleted: new EsqNodeStatus(1,  "Deleted",         "img/status/delete.ico"),
    Locked:  new EsqNodeStatus(2,  "Locked",          "img/status/warning.ico"),
//    Good:    new EsqNodeStatus(3,  "Checked",         "img/status/ok.ico"),
//    Question:new EsqNodeStatus(4,  "Question",        "img/status/question.ico"),
} as const;
