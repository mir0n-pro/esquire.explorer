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
* 02/13/2026 mir0n  EsqNodeType renamed with EsqObjectKind
* 02/17/2026 mir0n  use EsqAccessProfile from esquire.ui/api
*                   use CMD_ constants from EsqExplorerCallApi
* 02/18/2026 mir0n  added esquireCmdSave() wrapper (routes acct to /esq-cmd-asave)
*                   added esquireKeySave() wrapper
*                   console.log replaced with EsqUtils.log
* 03/01/2026 mir0n  wait for initial access profile load
* 03/06/2026 mir0n  error report dialog: JSON.stringify errors[] for tabstring display
* 03/09/2026 mir0n  profile converted to signal — fixes NG0100 ExpressionChangedAfterChecked
*                   callApiMill/dictionary init moved before await — fixes CallApiMill not initialized race
* 03/16/2026 mir0n  let → var (convention); subscribe error blocks removed
* 03/26/2026 mir0n  implements EsqExplorerHost: onTreeRefresh(), onTreeRefreshSelect(), setErrorMessage()
*                   esquireCmdNew() routes to /esq-anew (acct) or /esq-new; registers mill host
* 03/27/2026 mir0n  setUserId() called at profile load; userId passed to EsqSingleEntryDialog
* 03/28/2026 mir0n  Delete command: esquireCmdDel() REST wrapper, Delete menu item, onTreeRefresh() consolidated
* 03/31/2026 mir0n  explorer layout fix: 1fr grid row
*                   login hint callout: hideLoginHint signal, ?from=auth redirect on login/logout
*                   esquireCmdMove() REST wrapper: POST /esq-move
* 04/02/2026 mir0n  fix: extra subscription causes double HTTP request
*                   api.calle(): added subCmd, selectMode
* 04/07/2026 mir0n  esquireCmdSave/New/Del: removed acct routing (esquireCmdAdel/Anew/Asave eliminated from API)
* 04/08/2026 mir0n  ExplorerComponent extends EsqExplorerHostDummy
*                   static initialization at constructor (moved from ngOnInit)
*                   esqRestApiWrapper() : issue loading envent
*                   esqRestApiWrapper() : EsqUtils.observeWithDelay() to emulate REST API delays
* 04/09/2026 mir0n  esquireCmdAcct() REST wrapper: POST /esq-acct
*                   EsqAcctCommandHandler registered in constructor
* 04/10/2026 mir0n  added generic pipeWithErrorAndDelay() to help REST API wrapper
*                   initialize EsqAccessProfile Flag Indexes
*                   registerHandler(new EsqAcctCommandHandle with inline submitter
*                   use EsqShellConstants.CMD_ACCT
* 04/12/2026 mir0n  EsqFlatTreeDatasource created in constructor; passed to EsqAcctCommandHandler
* 04/13/2026 mir0n  kinds 1000/1002 (deposit/withdrawal) in EsquireObjectKinds with titles
*                   acct subItems built in ngOnInit from dict kind icons
* 04/14/2026 mir0n  subItemDisabled callback; Transfer submenu item; EsqObjectKind 1004 (transfer)
* 04/19/2026 mir0n  import paths migrated to @mir0n-pro/esquire.ui library
* 04/21/2026 mir0n  advertisement context added, nvagation to adv-explorer back-n-force
*/
import {
  Component,
  OnDestroy,
  OnInit,
//  ViewChild,
  inject,
  Signal,
  signal,
  effect,
  computed,
  ViewEncapsulation,
} from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
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

import {
  EsqObjectKind,
  EsqObjectKindFactory,
  EsqNodeStatus,
  EsqNodeStatusFactory,
  EsqRestApi,
  EsqDictionaryApi,
  EsqExplorerCallApi,
  EsqExplorerHost,
  EsqExplorerHostDummy,
  ProblemDetail,
  problemDetailDictionary,
  EsqTreeNode,
  EsqCommandMenuItem,
  EsqAccessProfile,
  EsqUtils,
} from '@mir0n-pro/esquire.ui/api';
import {
  EsqExplorerCallApiMill,
  EsqDictionary,
  EsqSingleEntryDialog,
} from '@mir0n-pro/esquire.ui/components';
import {EsqExplorerComponent, EsqFlatTreeDatasource} from '@mir0n-pro/esquire.ui/explorer/flatTree';
import {EsqAcctCommandHandler} from 'src/explorer/flatTree/acct/EsqAcctCommandHandler';
import {AcctOperation} from 'src/explorer/flatTree/acct/AcctOperation';

import {EsquireService} from '../../rest/api/esquire.service';
import {
  KEYCLOAK_EVENT_SIGNAL,
  KeycloakEvent,
  KeycloakEventType,
} from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import {
  Observable,
  catchError,
  throwError,
  finalize,
} from 'rxjs';
import {EsqShellConstants} from "./app-shell.contants";

const STATUS_CONNECTED = "Connected";
const STATUS_AUTHENTICATED = "Authenticated";
const STATUS_READY = "Ready";

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    MatToolbar,
    MatIconButton,
    MatIconModule,
    MatMenuModule,
    MatTabsModule,
    MatTooltipModule,
    EsqExplorerComponent
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  encapsulation: ViewEncapsulation.None
})
export class ExplorerComponent extends EsqExplorerHostDummy implements OnInit, OnDestroy {

  private keycloak: Keycloak;
  protected flatDs!: EsqFlatTreeDatasource;
  keycloakSignal: Signal<KeycloakEvent> = inject(KEYCLOAK_EVENT_SIGNAL);
  authState = signal('Initial');
  errorMessage = signal('');
  showLanding = signal(true);
  dataService?: EsquireService;
  _dataService: EsquireService;

  readonly loginHint = 'Welcome to Esquire Application Frameworks 2.0\u2122!\nThis is a super-powered backoffice framework \u2014 log in to explore.\nSeed logon: mainadmin / q';

  readonly subItemDisabled = (cmd: string, subCmd: string, node: EsqTreeNode | null): boolean => {
      if (cmd === EsqShellConstants.CMD_ACCT && Number(subCmd) === AcctOperation.DICT_KIND_TRANSFER) {
          var kind = node?.kind.id ?? 0;
          return kind === EsqShellConstants.KIND_PACCOUNT || kind === EsqShellConstants.KIND_PACCOUNTLNK;
      }
      return false;
  };

  readonly detailsDialog:MatDialog = inject(MatDialog);
  private callApi?:EsqExplorerCallApi;
  private callHost?:EsqExplorerHost;
  private dictionary?:EsqDictionaryApi;
  private profile = signal<EsqAccessProfile|null>(null);
  private profileRequested = false;
  private errorReport: ProblemDetail |undefined = undefined;

  private pipeWithErrorAndDelay(obsrvbl:Observable<any>): Observable<any> {
      this.setErrorMessage("");
      this.errorReport = undefined;
      this.callHost?.setLoading(true);
      return EsqUtils.observeWithDelay(obsrvbl, 1000).pipe(catchError(err => {
          this.errorReport = err;
          this.setErrorMessage(err.detail || err.title, err);
          return throwError(() => err);
      }), finalize(() => this.callHost?.setLoading(false)));
    }

  constructor(dataService: EsquireService) {
    super();
    //EsqUtils.DELAY = true;
    //EsqUtils.DEBUG = true;
    this._dataService = dataService;
    this.keycloak = inject(Keycloak);

    EsqAccessProfile.addFlagIndex(EsqShellConstants.CMD_ACCT,4);

    this.dictionary = new EsqDictionary(this.esqRestApiWrapper());
    let callApiMill:EsqExplorerCallApiMill = new EsqExplorerCallApiMill(this.detailsDialog, this.dictionary, this.esqRestApiWrapper());
    this.callApi = callApiMill.instance();
    this.callApi.registerHost(this);
    this.callHost = callApiMill.getHost();
    this.flatDs = new EsqFlatTreeDatasource(this.esqRestApiWrapper());
    this.callApi.registerHandler(new EsqAcctCommandHandler(
        {
            submit: (kind, id, body) => {
                return this.pipeWithErrorAndDelay(
                    this.dataService?.esquireCmdAcct(kind, encodeURIComponent(id), body) ??
                    throwError(() => new Error('Data Service is not initialized'))
                );
            }
        },
        this.flatDs
    ));

    effect(() => {
      const event = this.keycloakSignal();
      console.warn('Session status update: ' + event.type);
      if (event.type === KeycloakEventType.TokenExpired) {
        // Token expired - Keycloak will automatically attempt to refresh
        EsqUtils.log('Token expired, attempting refresh...');
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
        if (this.authState() === STATUS_CONNECTED && this.profile()) {
          EsqUtils.log('Token refreshed successfully');
        }
      } else if (event.type === KeycloakEventType.Ready) {
        var good = computed(() => this.keycloak.authenticated ?? false);
        if (good()) {
          let was:string = this.authState();
          if (!this.profileRequested) {
            this.authState.set(STATUS_AUTHENTICATED);
            if (was != STATUS_AUTHENTICATED) {
              this.profileRequested = true;
              this.dataService?.esquireKey().subscribe({
                  next: (value) => {
                    var ap = new EsqAccessProfile(value);
                    this.profile.set(ap);
                    callApiMill.setUserId(ap.id);
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
                    this.showLanding.set(false);
                  }
              }) ??
              throwError(() => new Error('Data Service is not initialized'));
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

  public profileLoaded(): boolean {
    return this.profile() !== null;
  }

  override setErrorMessage(msg: string, err?: any): void {
    // EsqUtils.log('[4/4] ExplorerComponent.setErrorMessage: FINAL - updating errorMessage signal. Message: ' + msg);
    this.errorMessage.set((msg.length > 64) ? msg.substring(0,61) + '...' : msg);
    if (err) {
      this.errorReport = err;
    }
    // EsqUtils.log('[4/4] ExplorerComponent.setErrorMessage: errorMessage signal value is now: ' + this.errorMessage());
  }

  public esqRestApiWrapper(): EsqRestApi {
    return {
      esquire: (id?: string, skip?: number, take?: number, options?:any) => {
        return this.pipeWithErrorAndDelay(
            this.dataService?.esquire(id?encodeURIComponent(id):undefined, skip,
                take, 'body', false, options) ??
            throwError(() => new Error('Data Service is not initialized'))
        );
      },
      esquirePath: (id: string, options?:any) => {
        return this.pipeWithErrorAndDelay(
            this.dataService?.esquirePath(encodeURIComponent(id), options) ??
            throwError(() => new Error('Data Service is not initialized'))
        );
      },
      esquireCmd: ( kind: number, id: string, cmd?: string, options?:any) => {
        return this.pipeWithErrorAndDelay(
            this.dataService?.esquireCmd( kind, encodeURIComponent(id), cmd, options) ??
            throwError(() => new Error('Data Service is not initialized'))
        );
      },
     esquireEntityNode: (kind: number, id?: string, name?: string, options?:any) => {
        return this.pipeWithErrorAndDelay(
            this.dataService?.esquireEntityNode( kind, (id && id.length >0)? encodeURIComponent(id) : undefined,
                name?encodeURIComponent(name):undefined,
                options) ??
            throwError(() => new Error('Data Service is not initialized'))
        );
      },
     esquireDictionary: (kind: number, options?:any) => {
        return this.pipeWithErrorAndDelay(
            this.dataService?.esquireDictionary(kind , options) ??
            throwError(() => new Error('Data Service is not initialized'))
        );
      },
      esquireKey: (id?: string, options?:any) => {
        return this.pipeWithErrorAndDelay(
            this.dataService?.esquireKey(id, options) ??
            throwError(() => new Error('Data Service is not initialized'))
        );
      },
      esquireKinds: () => {
        return this.pipeWithErrorAndDelay(
            this.dataService?.esquireKinds() ??
            throwError(() => new Error('Data Service is not initialized'))
        );
      },
      esquireCmdSave: (kind: number, id: string, body: any, cmd?: string, options?: any) => {
        return this.pipeWithErrorAndDelay(
            this.dataService?.esquireCmdSave(kind, encodeURIComponent(id), body, cmd) ??
            throwError(() => new Error('Data Service is not initialized'))
        );
      },
      esquireKeySave: (id: string, body: any, options?: any) => {
        return this.pipeWithErrorAndDelay(
            this.dataService?.esquireKeySave(id, body) ??
            throwError(() => new Error('Data Service is not initialized'))
        );
      },
      esquireCmdNew: (kind: number, parentId: string, body: any, cmd?: string, options?: any) => {
        return this.pipeWithErrorAndDelay(
            this.dataService?.esquireCmdNew(kind, encodeURIComponent(parentId), body, cmd) ??
            throwError(() => new Error('Data Service is not initialized'))
        );
      },
      esquireCmdDel: (kind: number, id: string, cmd?: string, options?: any) => {
        return this.pipeWithErrorAndDelay(
            this.dataService?.esquireCmdDel(kind, encodeURIComponent(id), cmd) ??
            throwError(() => new Error('Data Service is not initialized'))
        );
      },
      esquireCmdMove: (kind: number, id: string, distId: string, options?: any) => {
        return this.pipeWithErrorAndDelay(
            this.dataService?.esquireCmdMove(kind, encodeURIComponent(id), encodeURIComponent(distId)) ??
            throwError(() => new Error('Data Service is not initialized'))
        );
      },
    }
  };

  public esqCommandMenuItems() : EsqCommandMenuItem[] {
      return EsqCommandMenuItems;
 }

  public esqExplorerCallApiWrapper(): EsqExplorerCallApi {
    if (this.callApi) {
      return this.callApi;
    } else {
      throw new Error("CallApiMill not initialized");
    }
  }
  public esqAccessProfile() : EsqAccessProfile | null {
      return this.profile();
  }

  ngOnDestroy(): void {
    //not really required
    this.callApi?.unregisterHost(this);
  }

  async ngOnInit() {
    this.dataService = this._dataService;
    await EsqObjectKindFactory.init(this.esqRestApiWrapper(), EsquireObjectKinds);
    EsqNodeStatusFactory.init(Object.values(EsquireStatuses));
    var acctItem = EsqCommandMenuItems.find(i => i.cmd === EsqShellConstants.CMD_ACCT);
    if (acctItem) {
        acctItem.subItems = [
            { label: 'Deposit',    icon: EsqObjectKindFactory.instanceOf(AcctOperation.DICT_KIND_DEPOSIT).icon,    subCmd: String(AcctOperation.DICT_KIND_DEPOSIT)    },
            { label: 'Withdrawal', icon: EsqObjectKindFactory.instanceOf(AcctOperation.DICT_KIND_WITHDRAWAL).icon, subCmd: String(AcctOperation.DICT_KIND_WITHDRAWAL) },
            { label: 'Transfer',   icon: EsqObjectKindFactory.instanceOf(AcctOperation.DICT_KIND_TRANSFER).icon,   subCmd: String(AcctOperation.DICT_KIND_TRANSFER)   },
        ];
    }
  }

public async login(): Promise<void> {
  await this.keycloak.login({
    redirectUri: window.location.origin
  });
}

public async showDetails() {
    var p = this.profile();
    if (this.isConnected() && p) {
      this.callApi?.calle(EsqExplorerCallApi.CMD_DEFAULT, null, p.id as string, "", p.kind as number, p);
    }
}

public async showAccessProfile() {
    var p = this.profile();
    if (this.isConnected() && p) {
        this.callApi?.calle(EsqExplorerCallApi.CMD_KEY, null, p.id as string, "", 0, p);
    }
}

public toggleLanding(): void {
  if (this.isConnected() && this.profileLoaded()) {
    this.showLanding.set(!this.showLanding());
  }
}

public isConnected() : boolean {
  return this.authState() === STATUS_CONNECTED;
}

public faceIcon() : string {
  var ret = "img/unknown.ico";
  if (this.isConnected()) {
    ret = this.findIcon(this.profile()?.kind as number);
  }
  return ret;
}
public faceName() : string {
  if (this.isConnected()) {
    return this.profile()?.name as string;
  }
  return "Disconnected";
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
  this.profile.set(null);
  await this.keycloak.logout({
    redirectUri: window.location.origin,
  });
}

private findIcon(kind:number) : string {
  var ret: string = "img/unknown.ico";
  var nodeType: EsqObjectKind = EsqObjectKindFactory.instanceOf(kind);
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
        details : { ...this.errorReport, errors: this.errorReport.errors ? JSON.stringify(this.errorReport.errors, null, 2) : undefined },
        title : "Error Report",
        titleIcon : "./img/error.ico",
        userId : this.profile()?.id || ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      EsqUtils.log(`Dialog result: ${result}`);
    });
    return new Promise<void>((resolve)=>resolve());
  }
}

export const EsquireObjectKinds = [
    new EsqObjectKind({id: 0, name:"system", icon:"img/folders/system.ico", listHeaders: [{columnDef:"name", header:"Name"},  {columnDef:"desc", header:"Description"}]}),
    new EsqObjectKind({id: 2, name:"sysadmins", icon:"img/folders/folder.ico", listHeaders: [{columnDef:"name", header:"Administrator"},  {columnDef:"desc", header:"Description"}]}),
    new EsqObjectKind({id: 4, name:"alladmins", icon:"img/folders/folder.ico", listHeaders: [{columnDef:"name", header:"Administrator"},  {columnDef:"desc", header:"Description"}]}),
    new EsqObjectKind({id: 6, name:"allaccounts", icon:"img/folders/folder.ico", listHeaders: [{columnDef:"name", header:"Account ID"},  {columnDef:"desc", header:"Description"}]}),
    new EsqObjectKind({id: 8, name:"allclients", icon:"img/folders/folder.ico", listHeaders: [{columnDef:"name", header:"Client"},  {columnDef:"desc", header:"Description"}]}),
    new EsqObjectKind({id: 10, name:"allmerchants", icon:"img/folders/folder.ico", listHeaders: [{columnDef:"name", header:"Merchant"},  {columnDef:"desc", header:"Description"}]}),
    new EsqObjectKind({id: 20, name:"organization", icon:"img/org.ico"}),
    new EsqObjectKind({id: 30, name:"sysadmin", icon:"img/sysadmin.ico"}),
    new EsqObjectKind({id: 31, name:"sysadminlnk", icon:"img/sysadmin.ico"}),
    new EsqObjectKind({id: 32, name:"admin", icon:"img/admin.ico"}),
    new EsqObjectKind({id: 33, name:"adminlnk", icon:"img/admin.ico"}),
    new EsqObjectKind({id: 34, name:"client", icon:"img/client.ico"}),
    new EsqObjectKind({id: 35, name:"clientlnk", icon:"img/client.ico"}),
    new EsqObjectKind({id: 36, name:"merchant", icon:"img/merchant.ico", listHeaders: [{columnDef:"name", header:"Account ID"},  {columnDef:"desc", header:"Description"}]}),
    new EsqObjectKind({id: 37, name:"merchantlnk", icon:"img/merchant.ico"}),
    new EsqObjectKind({id: 50, name:"caccount", icon:"img/acct.ico"}),
    new EsqObjectKind({id: 51, name:"caccountlnk", icon:"img/links/acctl.ico"}),
    new EsqObjectKind({id: 52, name:"maccount", icon:"img/macct.ico"}),
    new EsqObjectKind({id: 53, name:"maccountlnk", icon:"img/links/macctl.ico"}),
    new EsqObjectKind({id: 54, name:"paccount", icon:"img/pacct.ico"}),
    new EsqObjectKind({id: 55, name:"paccountlnk", icon:"img/links/pacctl.ico"}),
    new EsqObjectKind({id: 980,  name:"admin",      icon:"img/star.ico"}),
    new EsqObjectKind({id: 982,  name:"tools",      icon:"img/tools.ico"}),
    new EsqObjectKind({id: 1000, name:"deposit",    title:"Deposit",    icon:"img/$sign.ico"}),
    new EsqObjectKind({id: 1002, name:"withdrawal", title:"Withdrawal", icon:"img/$withdraw.ico"}),
    new EsqObjectKind({id: 1004, name:"transfer",   title:"Transfer",   icon:"img/$transfer.ico"}),
] as const;

export const EsquireStatuses = {
    Empty:   new EsqNodeStatus(0,  "Empty",           "img/status/empty.ico"),
    Deleted: new EsqNodeStatus(1,  "Deleted",         "img/status/delete.ico"),
    Locked:  new EsqNodeStatus(2,  "Locked",          "img/status/warning.ico"),
//    Good:    new EsqNodeStatus(3,  "Checked",         "img/status/ok.ico"),
//    Question:new EsqNodeStatus(4,  "Question",        "img/status/question.ico"),
} as const;


export const EsqCommandMenuItems:EsqCommandMenuItem[] = [
    new EsqCommandMenuItem("Access Profile", "verified_user", EsqExplorerCallApi.CMD_KEY),
    new EsqCommandMenuItem("Accounting", "monetization_on", EsqShellConstants.CMD_ACCT, []),
    new EsqCommandMenuItem("Move",   "reply_all", EsqExplorerCallApi.CMD_MOVE),
    new EsqCommandMenuItem("Delete", "cancel",    EsqExplorerCallApi.CMD_DELETE),
    new EsqCommandMenuItem("New...", "add_circle", EsqExplorerCallApi.CMD_NEW),
] as const;

