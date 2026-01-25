/*
*  Esquire frameworks (tm)
*  Esquire Explorer
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 12/24/2025 mir0n kind parameter is requried for esq-cmd, esq-enode
* 01/08/2026 mir0n move initialization out from constructor
* 01/10/2026 mir0n added keycloakSignal processing
*                  added keyCloak UI/UX elements
* 01/12/2026 mir0n added profile dialog menu command
*                  login handshake : load profile at logon
* 01/18/2026 mir0n errorMessage signal added 
* 01/19/2025 mir0n alert on false logon uncommented 
*                  Error Report added
* 01/24/2026 mir0n use local esquire.ui instead of library
*
*/
import {Component,
  OnInit,
  AfterViewInit,
  inject,
  Signal,
  signal,
  effect,
  computed,
} from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
/*
import {EsqNodeType
  , EsqNodeTypeFactory
  , EsqNodeStatus
  , EsqNodeStatusFactory
  , EsqRestApi
  , EsqDictionaryApi
  , EsqExplorerCallApi
  ,  EsqEntityLayer
} from '@mir0n-pro/esquire.ui/api';

import { EsqExplorerCallApiMill, EsqDictionary } from '@mir0n-pro/esquire.ui/components';
import { EsqExplorerComponent} from '@mir0n-pro/esquire.ui/explorer/flatTree';
*/

import {EsqNodeType,EsqNodeTypeFactory} from 'src/esquire.ui/api/EsqNodeTypeFactory';
import {EsqNodeStatus,EsqNodeStatusFactory} from 'src/esquire.ui/api/EsqNodeStatusFactory';
import {EsqRestApi} from 'src/esquire.ui/api/EsqRestApi';
import {EsqDictionaryApi} from 'src/esquire.ui/api/EsqDictionaryApi';
import {EsqExplorerCallApi} from 'src/esquire.ui/api/EsqExplorerCallApi';
//import {EsqEntityLayer} from 'src/esquire.ui/api/EsqEntityDictionary';
import {EsqExplorerCallApiMill} from 'src/esquire.ui/components/EsqExplorerCallApiMill';
import {EsqDictionary} from 'src/esquire.ui/components/EsqDictionary';
import {EsqExplorerComponent} from 'src/esquire.ui/explorer/flatTree/EsqExplorerComponent';
import { ProblemDetail, problemDetailDictionary } from 'src/esquire.ui/api/ProblemDetail';
import { EsqSingleEntryDialog } from 'src/esquire.ui/components/EsqSingleEntryDialog';


import {EsquireService} from '../../rest/api/esquire.service';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEvent, KeycloakEventType } from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { Observable } from 'rxjs';


const STATUS_CONNECTED = "Connected";
const STATUS_AUTHENTICATED = "Authenticated";
const STATUS_READY = "Ready";
const CMD_PROFILE = "profile";


@Component({
  selector: 'app-explorer',
  standalone: true,
  imports: [
    MatToolbar,
    MatIconButton,
    MatIconModule,
    MatMenuModule,
    EsqExplorerComponent
  ],
  templateUrl: './app-explorer.component.html',
  styleUrl: './app-explorer.component.scss'
})
export class ExplorerComponent implements OnInit, AfterViewInit {
  private keycloak: Keycloak;
  keycloakSignal: Signal<KeycloakEvent> = inject(KEYCLOAK_EVENT_SIGNAL);
  authState = signal('Initial');
  errorMessage = signal('');
  dataService?: EsquireService;
  _dataService: EsquireService;

  readonly detailsDialog:MatDialog = inject(MatDialog);
  private callApiMill?:EsqExplorerCallApiMill;
  private dictionary?:EsqDictionaryApi;
  private profile:any = undefined;
  private profileRequested = false; 
  private errorReport: ProblemDetail |undefined = undefined;

  constructor(dataService: EsquireService) {
    this._dataService = dataService; 
    this.keycloak = inject(Keycloak);
    effect(() => {
      const event = this.keycloakSignal();
      console.warn('Session status update: ' + event.type);
      if (event.type === KeycloakEventType.TokenExpired) {
        this.authState.set('Token expired');
      //} else if (event.type === KeycloakEventType.AuthSuccess) {
      //  this.authState.set('Authenticated');
      //  console.log('User successfully authenticated');
      } else if (event.type === KeycloakEventType.AuthError) {
        this.authState.set('Authentication error');
        this.logout(); 
      } else if (event.type === KeycloakEventType.AuthRefreshError) {
      // Handle the case where the refresh token itself expired
        this.logout();                      
      } else if (event.type === KeycloakEventType.Ready) {
        var good = computed(() => this.keycloak.authenticated ?? false);
        if (good()) {
          let was:string = this.authState();
          if (!this.profileRequested) {
            this.authState.set(STATUS_AUTHENTICATED);
            if (was != STATUS_AUTHENTICATED) {
              this.profileRequested = true;
              this._dataService.esquireCmd( 0, '0', CMD_PROFILE).subscribe({
                  next: (value) => {
                    this.profile = value;
                  },
                  error: (err) => {
                    this.errorReport = err;
                    console.error('Something went wrong: ' + err);
                    this.authState.set("Error in profile");
                    this.setErrorMessage('Something went wrong: ' + err.detail);
                    if (err.detail) {
                      alert('Something went wrong: ' + err.detail);
                    }
                    this.logout();     
                  },
                  complete: () =>  {
                    this.authState.set(STATUS_CONNECTED);
                  }
              });
            }
          }

        } else {
          this.authState.set(STATUS_READY);
        }
      } else {
        //xxx: this will disable access to explorer, keeping session open, simple "login" will bring all back
        //     it could be more complex solution, but that is good-enough for now
        this.authState.set('' + event.type);
      }
    });
  }

  private setErrorMessage(msg:string) {
    this.errorMessage.set((msg.length > 64) ? msg.substring(0,61) + '...' : msg);
  }
   
  public esqRestApiWrapper(): EsqRestApi {
    return {
      esquire: (id?: string, skip?: number, take?: number, options?:any) => {
        this.setErrorMessage("");
        this.errorReport = undefined;
        if(!this.dataService) {
          this.setErrorMessage("Data service not initialized");
          throw new Error("Data service not initialized");
        }
        let ret: Observable<any> = this.dataService.esquire(id?encodeURIComponent(id):undefined, skip, take, 'body', false, options);
        ret.subscribe({
          error : (err: ProblemDetail) => {
            console.error(err.detail || err.title);
            this.errorReport = err;
            this.setErrorMessage( err.detail || err.title);
          }
        }) ;
        return ret;
      },
      esquirePath: (id: string, options?:any) => {
        this.setErrorMessage("");
        this.errorReport = undefined;
        if(!this.dataService) {
          this.setErrorMessage("Data service not initialized");
          throw new Error("Data service not initialized");
        }
        let ret: Observable<any> = this.dataService.esquirePath(encodeURIComponent(id), options);
        ret.subscribe({
          error : (err: ProblemDetail) => {
            console.error(err.detail || err.title);
            this.errorReport = err;
            this.setErrorMessage( err.detail || err.title);
          }
        }) ;
        return ret;
      },
      esquireCmd: ( kind: number, id: string, cmd?: string, options?:any) => {
        this.setErrorMessage("");
        this.errorReport = undefined;
        if(!this.dataService) {
          this.setErrorMessage("Data service not initialized");
          throw new Error("Data service not initialized");
        }
        let ret: Observable<any> = this.dataService.esquireCmd( kind, encodeURIComponent(id), cmd, options) ;
        ret.subscribe({
          error : (err: ProblemDetail) => {
            console.error(err.detail || err.title);
            this.errorReport = err;
            this.setErrorMessage( err.detail || err.title);
          }
        }) ;
        return ret;
      },
     esquireEntityNode: (kind: number, id?: string, name?: string, options?:any) => {
        this.setErrorMessage("");
        this.errorReport = undefined;
        if(!this.dataService) {
          this.setErrorMessage("Data service not initialized");
          throw new Error("Data service not initialized");
        }
        let ret: Observable<any> = this.dataService.esquireEntityNode( kind, (id && id.length >0)? encodeURIComponent(id) : undefined,
          name?encodeURIComponent(name):undefined, 
          options
        );
        ret.subscribe({
          error : (err: ProblemDetail) => {
            console.error(err.detail || err.title);
            this.errorReport = err;
            this.setErrorMessage( err.detail || err.title);
          }
        }) ;
        return ret; 
      },
     esquireDictionary: (kind: number, options?:any) => {
        this.setErrorMessage("");
        this.errorReport = undefined;
        if(!this.dataService) {
          this.setErrorMessage("Data service not initialized");
          throw new Error("Data service not initialized");
        }
        let ret: Observable<any> = this.dataService.esquireDictionary(kind , options);
        ret.subscribe({
          error : (err: ProblemDetail) => {
            console.error(err.detail || err.title);
            this.errorReport = err;
            this.setErrorMessage( err.detail || err.title);
          }
        }) ;
        return ret;
      },
    }
  };

  public esqExplorerCallApiWrapper(): EsqExplorerCallApi {
    if (this.callApiMill) {
      return this.callApiMill.instance();
    } else {
      throw new Error("CallApiMill not initialized");
    }
  }

  async ngOnInit() {
    this.dataService = this._dataService; 
    EsqNodeTypeFactory.init(Object.values(EsquireNodeTypes));
    EsqNodeStatusFactory.init(Object.values(EsquireStatuses));
    this.dictionary = new EsqDictionary(this.esqRestApiWrapper());
    this.callApiMill = new EsqExplorerCallApiMill(this.detailsDialog, this.dictionary, this.esqRestApiWrapper());
  }

  async ngAfterViewInit() {
  }

public async login(): Promise<void> {
  await this.keycloak.login({
    redirectUri: window.location.origin
  });
}  

public async showProfile() {
    if (this.isConnected() && this.profile) {
      this.callApiMill?.instance().calle("details",this.profile.id,"", this.profile.kind);
    }   
}

public isConnected() : boolean {
  return this.authState() === STATUS_CONNECTED;
}

public faceIcon() : string {
  var ret = "img/unknown.ico";
  if (this.isConnected()) {
    ret = this.findIcon(this.profile.kind);
  }
  return ret;
}
public faceName() : string {
  if (this.isConnected()) {
    return this.profile.name;
  }
  return "Diconnected";
}
public faceNameClass() : string {
  var ret = "name-bar" 
  //if (this.isConnected())) {
  //  return "name-bar";
  //}
  return ret;
}

public async logout(): Promise<void> {
  this.profileRequested = false;
  this.profile = undefined;
  await this.keycloak.logout({
    redirectUri: window.location.origin, // Where to go after
  });
}

private findIcon(kind:number) : string {
  var ret: string = "img/unknown.ico";
  for (const tp of Object.values(EsquireNodeTypes)) {
    if (tp.id == kind) {
      ret = tp.icon;
      break;
    }
  }
  return ret;
}

 public canShowErrorReport() : boolean {
    return this.errorReport !== undefined;
  } 

  public async runErrorReport() : Promise<void> {
    if (!this.errorReport) {
      return Promise.resolve();
    }
    var dialogRef:MatDialogRef<any> = this.detailsDialog.open(EsqSingleEntryDialog, {
      autoFocus: false,
      data: {
        dictionary : problemDetailDictionary,
        readOnly : true,
        details : this.errorReport,
        title : "Error Report",
        titleIcon : "./img/error.ico"
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
    return new Promise<void>((resolve)=>resolve());
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
