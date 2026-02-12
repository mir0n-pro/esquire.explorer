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
* 02/05/2026 mir0n handle KeyCloak Token Renewal events 
* 02/12/2026 mir0n  EsqNodeType in explicit file
*                   added EsqRestApi.esquireKinds()
*                   EsqNodeTypeFactory.init with RestAPI and local exceptions set (define icons and heading)
*                   EsquireNodeTypes have only icons and heading
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

import {EsqNodeType} from 'src/esquire.ui/api/EsqNodeType';
import {EsqNodeTypeFactory} from 'src/esquire.ui/api/EsqNodeTypeFactory';
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
        // Token expired - Keycloak will automatically attempt to refresh
        console.log('Token expired, attempting refresh...');
      //} else if (event.type === KeycloakEventType.AuthSuccess) {
      //  this.authState.set('Authenticated');
      //  console.log('User successfully authenticated');
      } else if (event.type === KeycloakEventType.AuthError) {
        this.authState.set('Authentication error');
        this.logout();
      } else if (event.type === KeycloakEventType.AuthRefreshError) {
      // Handle the case where the refresh token itself expired
        this.logout();
      } else if (event.type === KeycloakEventType.AuthRefreshSuccess) {
        // Token refreshed successfully - maintain current state if already connected
        if (this.authState() === STATUS_CONNECTED && this.profile) {
          console.log('Token refreshed successfully');
        }
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
        esquireKinds: () => {
            this.setErrorMessage("");
            this.errorReport = undefined;
            if(!this.dataService) {
                this.setErrorMessage("Data service not initialized");
                throw new Error("Data service not initialized");
            }
            let ret: Observable<any> = this.dataService.esquireKinds( ) ;
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
    await EsqNodeTypeFactory.init(this.esqRestApiWrapper(), EsquireNodeTypes);
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
  var nodeType: EsqNodeType = EsqNodeTypeFactory.instanceOf(kind);
  if (nodeType) {
      ret = nodeType.icon;
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
export const EsquireNodeTypes = [
    new EsqNodeType({id: 0, name:"system", icon:"img/folders/system.ico", listHeaders: [{columnDef:"name", header:"Name"},  {columnDef:"desc", header:"Description"}]}),
    new EsqNodeType({id: 2, name:"sysadmins", icon:"img/folders/folder.ico", listHeaders: [{columnDef:"name", header:"Administrator"},  {columnDef:"desc", header:"Description"}]}),
    new EsqNodeType({id: 4, name:"alladmins", icon:"img/folders/folder.ico", listHeaders: [{columnDef:"name", header:"Administrator"},  {columnDef:"desc", header:"Description"}]}),
    new EsqNodeType({id: 6, name:"allaccounts", icon:"img/folders/folder.ico", listHeaders: [{columnDef:"name", header:"Account ID"},  {columnDef:"desc", header:"Description"}]}),
    new EsqNodeType({id: 8, name:"allclients", icon:"img/folders/folder.ico", listHeaders: [{columnDef:"name", header:"Client"},  {columnDef:"desc", header:"Description"}]}),
    new EsqNodeType({id: 10, name:"allmerchants", icon:"img/folders/folder.ico", listHeaders: [{columnDef:"name", header:"Merchant"},  {columnDef:"desc", header:"Description"}]}),
    new EsqNodeType({id: 20, name:"organization", icon:"img/org.ico"}),
    new EsqNodeType({id: 30, name:"sysadmin", icon:"img/sysadmin.ico"}),
    new EsqNodeType({id: 31, name:"sysadminlnk", icon:"img/sysadmin.ico"}),
    new EsqNodeType({id: 32, name:"admin", icon:"img/admin.ico"}),
    new EsqNodeType({id: 33, name:"adminlnk", icon:"img/admin.ico"}),
    new EsqNodeType({id: 34, name:"client", icon:"img/client.ico"}),
    new EsqNodeType({id: 35, name:"clientlnk", icon:"img/client.ico"}),
    new EsqNodeType({id: 36, name:"merchant", icon:"img/merchant.ico", listHeaders: [{columnDef:"name", header:"Account ID"},  {columnDef:"desc", header:"Description"}]}),
    new EsqNodeType({id: 37, name:"merchantlnk", icon:"img/merchant.ico"}),
    new EsqNodeType({id: 50, name:"caccount", icon:"img/acct.ico"}),
    new EsqNodeType({id: 51, name:"caccountlnk", icon:"img/links/acctl.ico"}),
    new EsqNodeType({id: 52, name:"maccount", icon:"img/macct.ico"}),
    new EsqNodeType({id: 53, name:"maccountlnk", icon:"img/links/macctl.ico"}),
    new EsqNodeType({id: 54, name:"paccount", icon:"img/pacct.ico"}),
    new EsqNodeType({id: 55, name:"paccountlnk", icon:"img/links/pacctl.ico"}),
] as const;

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

