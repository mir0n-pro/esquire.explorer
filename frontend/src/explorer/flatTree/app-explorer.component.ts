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
* 02/01/2026 mir0n EsqRestApi extended with esquireKey()
*                  added EsqCommandMenuItems array with toolbar/context menu definition
*                  EsquireNodeTypes array expanded with children and commands list   
* 02/02/2026 mir0n "SysAdmin" and "Sys Admin-s" added
*                  Gaps in Entity Kind enumeration: system objects <> orgs <> users <> accounts
* 
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
import {EsqCommandMenuItem, EsqContextMenuBuilder} from "../../esquire.ui/api/EsqContextMenuBuilder";
import {EsqAccessProfile} from "../../rest/model/esqAccessProfile";


const STATUS_CONNECTED = "Connected";
const STATUS_AUTHENTICATED = "Authenticated";
const STATUS_READY = "Ready";

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
  private profile?:EsqAccessProfile;
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
              this._dataService.esquireKey().subscribe({
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
      esquireKey: (id?: string, options?:any) => {
            this.setErrorMessage("");
            this.errorReport = undefined;
            if(!this.dataService) {
                this.setErrorMessage("Data service not initialized");
                throw new Error("Data service not initialized");
            }
            let ret: Observable<any> = this.dataService.esquireKey( id, options) ;
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

  public esqCommandMenuItems() : EsqCommandMenuItem[] {
      return EsqCommandMenuItems;
 }

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

public async showDetails() {
    if (this.isConnected() && this.profile) {
      this.callApiMill?.instance().calle("details",this.profile.id as string,"", this.profile.kind as number);
    }
}

public async showAccessProfile() {
    if (this.isConnected() && this.profile) {
        this.callApiMill?.instance().calle("key",this.profile.id as string, "", 0);
    }
}

public isConnected() : boolean {
  return this.authState() === STATUS_CONNECTED;
}

public faceIcon() : string {
  var ret = "img/unknown.ico";
  if (this.isConnected()) {
    ret = this.findIcon(this.profile?.kind as number);
  }
  return ret;
}
public faceName() : string {
  if (this.isConnected()) {
    return this.profile?.name as string;
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
    System:       new EsqNodeType( 0, "System",              "img/folders/system.ico",  true,     [20],              [],  [{columnDef:"name", header:"Name"},  {columnDef:"desc", header:"Description"}]),
    SysAdmins:    new EsqNodeType( 2, "Sys admin-s",         "img/folders/folder.ico",  false, [30,32],              [],  [{columnDef:"name", header:"Administrator"},  {columnDef:"desc", header:"Description"}]),
    AllAdmins:    new EsqNodeType( 4, "All admin-s",         "img/folders/folder.ico",  false,    [32],              [],  [{columnDef:"name", header:"Administrator"},  {columnDef:"desc", header:"Description"}]),
    AllAccounts:  new EsqNodeType( 6, "All accounts",        "img/folders/folder.ico",  false,      [],              [],  [{columnDef:"name", header:"Account"},  {columnDef:"desc", header:"Description"}]),
    AllClients:   new EsqNodeType( 8, "All clients",         "img/folders/folder.ico",  false,    [34],              [],  [{columnDef:"name", header:"Client"},  {columnDef:"desc", header:"Description"}]),
    AllMerchants: new EsqNodeType( 10,"All merchants",       "img/folders/folder.ico",  false,    [36],              [],  [{columnDef:"name", header:"Merchant"},  {columnDef:"desc", header:"Description"}]),
    Organization: new EsqNodeType(20, "Organization",        "img/org.ico",             true,     [20],       ["_move"],  [{columnDef:"name", header:"Name"},  {columnDef:"desc", header:"Description"}]),
    SysAdmin:     new EsqNodeType(30, "SysAdmin",            "img/sysadmin.ico",        true,       [],["_mov_e","key"],  ),
    SysAdminLink: new EsqNodeType(31, "SysAdmin",            "img/sysadmin.ico",        true,       [],         ["key"],  ),
    Admin:        new EsqNodeType(32, "Admin",               "img/admin.ico",           true,       [],["_mov_e","key"],  ),
    AdminLink:    new EsqNodeType(33, "Admin",               "img/admin.ico",           true,       [],         ["key"],  ),
    Client:       new EsqNodeType(34, "Client",              "img/client.ico",          true,  [50,54],["_move_","key"],  [{columnDef:"name", header:"Account"},  {columnDef:"desc", header:"Description"}]),
    ClientLink:   new EsqNodeType(35, "Client",              "img/client.ico",          true,       [],         ["key"],  ),
    Merchant:     new EsqNodeType(36, "Merchant",            "img/merchant.ico",        true,     [52],["_move_","key"],  [{columnDef:"name", header:"Account"},  {columnDef:"desc", header:"Description"}]),
    MerchantLink: new EsqNodeType(37, "Merchant",            "img/merchant.ico",        true,       [],         ["key"],  ),
    CAccount:     new EsqNodeType(50, "Client Account",      "img/acct.ico",            true,       [],      ["_acct_"], ),
    CAccountLink: new EsqNodeType(51, "Client Account",      "img/links/acctl.ico",     true,       [],      ["_acct_"], ),
    MAccount:     new EsqNodeType(52, "Merchant Account",    "img/macct.ico",           true,       [],      ["_acct_"], ),
    MAccountLink: new EsqNodeType(53, "Merchant Account",    "img/links/macctl.ico",    true,       [],      ["_acct_"], ),
    PAccount:     new EsqNodeType(54, "Paper Client Account","img/pacct.ico",           true,       [],      ["_acct_"], ),
    PAccountLink: new EsqNodeType(55, "Paper Client Account","img/links/pacctl.ico",    true,       [],      ["_acct_"], ),
} as const;

export const EsquireStatuses = {
    Empty:   new EsqNodeStatus(0,  "Empty",           "img/status/empty.ico"),
    Deleted: new EsqNodeStatus(1,  "Deleted",         "img/status/delete.ico"),
    Locked:  new EsqNodeStatus(2,  "Locked",          "img/status/warning.ico"),
//    Good:    new EsqNodeStatus(3,  "Checked",         "img/status/ok.ico"),
//    Question:new EsqNodeStatus(4,  "Question",        "img/status/question.ico"),
} as const;


export const EsqCommandMenuItems:EsqCommandMenuItem[] = [
    new EsqCommandMenuItem("Access Profile", "verified_user", "key"),
    new EsqCommandMenuItem("Accounting", "monetization_on", "acct"),
    new EsqCommandMenuItem("Move", "reply_all", "move"),
    new EsqCommandMenuItem("New...", "add_circle", EsqContextMenuBuilder.CMD_NEW),
] as const;

