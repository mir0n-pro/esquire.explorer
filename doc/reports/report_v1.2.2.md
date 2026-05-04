# Release Report: v1.2.1 → v1.2.2

**Repo:** `esquire.explorer/develop`  
**Top commit:** `f885b20`

---

## Release Notes

### doc/release_notes.txt


**v1.2.2-2605.0318** v1.2.2 Finalization. Search resources and metadata  
&nbsp;- e2e tests support any url  
&nbsp;- search resources and metadata  
&nbsp;- landing page: corrected context  
&nbsp;- landing page: mobile pen/finger firendly  

**v1.2.2-2604.2118** v1.2.2 Finalization. Advertisement context  

**v1.2.2-2604.2018**  Transfer: dynamic rate label (Rate SRC/DEST); same-ccy readonly+reset  

**v1.2.2-2604.1914**  Local esquire.ui module replaced with library package; Playwright e2e suite  
&nbsp;: Refactoring: src/esquire.ui/ removed (73 files); all import paths migrated to  
&nbsp;                @mir0n-pro/esquire.ui  
&nbsp;: Improvement: run-yalc.bat / run-git.bat; package.json lib dep set to ^1.2.2  
&nbsp;: Feature:     27-test Playwright e2e suite  
&nbsp;: doc:         added doc/e2e.todo.md  
&nbsp;                lib docs moved to esquire.ui.lib project  

**v1.2.2-2604.1712** Tuning of field types: image, tablist  

**v1.2.2-2604.1515**  EsqObjectKindFactory: pass kind title from server; add login-hint background  

**v1.2.2-2604.1422**  Unit tests were added  
&nbsp;  separated for esquire.ui and app levels  

**v1.2.2-2604.1420**  Acct Transaction Phase IV: Transfer acct operation with dest picker and paper-account guard  
&nbsp;: Feature:     EsqTransferDialog — second account picker; same-account validation  
&nbsp;: Improvement: EsqAcctDialog protected hooks (onDictionaryLoaded, focusOnInit, validateExtra, extraConfirmLines)  
&nbsp;: Fix:         findByEntityId expression; onSelect() kind normalization; Transfer DICT_KIND corrected  

**v1.2.2-2604.1319** Acct operations expansion: Deposit/Withdrawal submenu; AmountEffect validation  

**v1.2.2-2604.1219** Account picker; generic entity select dialog; EsqMoveDialog refactor  

**v1.2.2-2604.1018** Rename app-explorer.component with app-shell  

**v1.2.2-2604.1017** Externalize acct command as custom  

**v1.2.2-2604.0920** Acct deposit command: dialog with dictionary-driven fields, entity refresh, continuous operation  

**v1.2.2-2604.0820** Generalization of "loading" indicator; debug delay centralized  

**v1.2.2-2604.0711**  Kind normalization refactor; REST API facade update  
&nbsp;: Kind:  
&nbsp;     EsqObjectKindFactory.normalize() — single normalization point replacing scattered inline  
&nbsp;: REST:  
&nbsp;     Removed acct-specific endpoint routing (esquireCmdAdel/Anew/Asave)  
&nbsp;     esquireCmdDel/New/Save now handle all entity kinds uniformly  
&nbsp;: added doc\kind.context.md  

**v1.2.2-2604.0221** Refactoring of menu command handle; Elimination of double HTTP request  

**v1.2.2-2603.3121**  Move command; ESC close for all dialogs  
&nbsp;: Move: EsqMoveDialog — org-only tree, confirm, keyboard nav, ESC/X close  
&nbsp;: canCmdClick(): cannot move yourself (entityId === profile.id)  
&nbsp;: REST: esquireCmdMove POST /esq-move (kind, id, dist_id)  
&nbsp;: ESC closes all dialogs with Close/X button  

**v1.2.2-2603.3012**  Synch with keyCloak esquire theme; UI/UX cleanup  
&nbsp;: Explorer layout fix;  
&nbsp;: Login hint callout;  
&nbsp;: Confirm dialog keyboard nav  

**v1.2.2-2603.2818**  Inject dictionary defaults in create entity dialog  

**v1.2.2-2603.2814**  Delete command  

**v1.2.2-2603.2712**  Windows style dialog resize + position/size persistence per user  

**v1.2.2-2603.2621**  Styled confirm/alert dialog replaces browser alert()/confirm()  
&nbsp;: EsqConfirmDialog:  
&nbsp;    New component: Ok (alert), YesNo, OkCancel modes via ConfirmFlag enum  

**v1.2.2-2603.2618**  Create entity dialog, bypass error message to shell footer  
&nbsp;: Create:  
&nbsp;    EsqCreateEntityDialog: two-phase Create→Edit dialog extending EsqEntityDetailsDialog  
&nbsp;    onCreate(): validates main + subentity fields; POSTs via esquireCmdNew/esquireCmdAnew  
&nbsp;    on success: transitions to edit mode; triggers tree refresh and selects new entity  
&nbsp;: REST:  
&nbsp;    esquireCmdNew (/esq-new), esquireCmdAnew (/esq-anew): create entity endpoints  
&nbsp;    esquireCmdDel (/esq-del), esquireCmdAdel (/esq-adel): delete entity endpoints  
&nbsp;    EsqRestApi interface: esquireCmdNew added  
&nbsp;    app-explorer: esquireCmdNew() routes to /esq-anew for acct kinds, /esq-new otherwise  
&nbsp;: Permissions:  
&nbsp;    canCreateKind(): isCommandAllowed(CMD_NEW) gates New submenu items  
&nbsp;: EsqExplorerHost:  
&nbsp;    onTreeRefreshSelect(), setErrorMessage() added to interface and implemented  
&nbsp;    Mill doExplorerCreate: handles treeRefreshSelect → host.onTreeRefreshSelect(entityId)  
&nbsp;    Mill doExplorerCreate: onError callback → host.setErrorMessage() propagates dialog errors to UI  
&nbsp;: Fix:  
&nbsp;    onCreate(): subentity validation loop added (same pattern as onSave())  
&nbsp;    onCreate(): early return removed; restructured as if/else  
&nbsp;    closeConfirmMessage() hook: overridable; create mode says "continue with creation"  

**v1.2.2-2603.2019**  tree auto refresh on update of important fields + few fixes  
&nbsp;: EsqExplorerHost:  
&nbsp;    new interface with onTreeRefresh(); EsqExplorerCallApi extended with registerHost()  
&nbsp;    EsqExplorerComponent self-registers as host in ngOnInit()  
&nbsp;: affects3:  
&nbsp;    EsqEntityDictionary: affects3 optional field from JSON  
&nbsp;    EsqEntityDetailsDialog: detects affects3 changes (incl. subentities); passes 'treeRefresh' on close  
&nbsp;    EsqExplorerCallApiMill: fires host.onTreeRefresh() with 250ms delay on 'treeRefresh' result  
&nbsp;: Fix:  
&nbsp;    fallback to gotoTreeNode when focused link-variant node has no server path  
&nbsp;: Fix:  
&nbsp;    EsqNodeDetailsDialog: givenEntityKind normalized to even — handles link-variant (odd) kinds  

**v1.2.2-2603.1917**  Fix: Entity kind normalization  

**v1.2.2-2603.1620**  saving flag; subscribe cleanup  
&nbsp;: saving:  
&nbsp;    EsqAccessProfileDialog, EsqEntityDetailsDialog: saving flag prevents double-click Save  
&nbsp;    Save button disabled while request is in progress  
&nbsp;: cleanup:  
&nbsp;    app-explorer.component.ts: let → var convention; subscribe error blocks removed  

**v1.2.2-2603.1017**  debug skip flags for development testing  
&nbsp;: DEBUG_SKIP_VALIDATION:  
&nbsp;    EsqUtils: DEBUG_SKIP_VALIDATION and DEBUG_SKIP_PERMISSION static flags  
&nbsp;    validateFields() returns null immediately when DEBUG_SKIP_VALIDATION is set  
&nbsp;: DEBUG_SKIP_PERMISSION:  
&nbsp;    EsqAccessProfile: import EsqUtils for flag access  
&nbsp;    isCommandAllowed() returns true immediately when DEBUG_SKIP_PERMISSION is set  
&nbsp; 3 doc drafts added:  
&nbsp;: fieldType.md  
&nbsp;: permissions.md  
&nbsp;: validations.md  

**v1.2.2-2603.0918**  Race condition fixes  
&nbsp;: NG0100 ExpressionChangedAfterItHasBeenChecked:  
&nbsp;    profile converted to Angular signal  
&nbsp;    faceIcon() and faceName() now reactive — no stale values during change detection  
&nbsp;: CallApiMill not initialized:  
&nbsp;    callApiMill and dictionary initialized synchronously before async EsqObjectKindFactory.init()  
&nbsp;    profile load can no longer race ahead of component initialization  

**v1.2.2-2603.0618**  Server-side validation error handling; ikn-list refresh fix  
&nbsp;: Server validation errors:  
&nbsp;    saveData catchError handles RFC 7807 errors[] from backend  
&nbsp;    alert shows server error message; focus moves to invalid field and tab  
&nbsp;    focusField deferred via setTimeout(0) to run after Angular re-render  
&nbsp;: AccessProfileDialog double-subscribe fix:  
&nbsp;    second details$ async pipe replaced with details property  
&nbsp;    prevents duplicate HTTP save requests on error  
&nbsp;: Error Report dialog:  
&nbsp;    errors[] array JSON.stringify'd before display (was showing [object Object])  
&nbsp;    added "Validation Errors" tab in ProblemDetail dictionary  
&nbsp;: IKN list refresh fix:  
&nbsp;    ngOnChanges rebuilds list when esqListElements changes externally (Refresh button)  
&nbsp;    self-emitted changes (add/remove) skip rebuild to preserve focused row  

**v1.2.2-2603.0315**  Add/Remove roles; text field type  
&nbsp;: complete the list tab with add button dropdown menu  
&nbsp;: Array change detection  
&nbsp;: Text field type  
&nbsp;: Keyboard-accessible clear button  
&nbsp;: ProblemDetail:  
&nbsp;    title and detail field types changed from 'string' to 'text' (multi-line textarea)  
&nbsp;: gateway use default port  
&nbsp;: comment out sort buttons in the list tab  

**v1.2.2-2603.0120**  
&nbsp; Wait for initial access profile load  

**v1.2.3-2603.0115**  date field type; null change-detection fix  
&nbsp;: Null change detection fix:  
&nbsp;: Date field:  
&nbsp;    native  (Angular Material datepicker skipped: breaks grid structure)  

**v1.2.2-2602.2819**  Sub-entity rendering; dialog inheritance; tab restore  
&nbsp;: Sub-entity inline rendering  
&nbsp;: Dictionary proactive loading  
&nbsp;: Dialog inheritance  
&nbsp;: Tab restore after Save/Refresh  
&nbsp;: Error handling in dialogs  
&nbsp;: Null option fix:  
&nbsp;    select placeholder options use value=null instead of value="" for correct null detection  

**v1.2.2-2602.1817**  Wire Save to REST  
&nbsp;: Save entity changes:  
&nbsp;    POST /esq-cmd-save for general entities, POST /esq-cmd-asave for account entities  
&nbsp;    routed by EsqObjectKind.acct flag in the wrapper  
&nbsp;: Save access profile:  
&nbsp;    POST /esq-key-save for access profile changes  
&nbsp;: OpenAPI spec:  
&nbsp;    added EsqEntity schema (id + kind + additionalProperties)  
&nbsp;    3 new POST endpoints: esquireCmdSave, esquireCmdAsave, esquireKeySave  
&nbsp;    input and output both use typed schemas (EsqEntity / EsqAccessProfile)  
&nbsp;: Dialog onSave:  
&nbsp;    all 3 detail dialogs wired to REST; save error shown via alert()  
&nbsp;    originalDetails updated only on success, dialog stays open on failure  
&nbsp;    unsaved changes confirmation on Close (OK to save, Cancel to discard)  
&nbsp;: Field validation on Save:  
&nbsp;    required field check, string pattern validation, number min/max validation  
&nbsp;    focus moves to invalid field and tab on error  
&nbsp;    EsqValidationError type, data-field attributes on all inputs for focus  
&nbsp;: Change tracking:  
&nbsp;    deepCopy, getChangedFields utility methods in EsqUtils  
&nbsp;    AccessProfile fix: removed async alias in template, use component property  
&nbsp;: isCommandAllowed:  
&nbsp;    entity_id param with personal mode (own profile always editable)  
&nbsp;    kind rounding for paired entity kinds  
&nbsp;    String() coercion for entityId/userId comparison in fieldReadOnly  
&nbsp;: ProblemDetail dictionary:  
&nbsp;    minmax defaults set to '100' and '200'  
&nbsp;: Logging:  
&nbsp;    console.log replaced with EsqUtils.log across components  

**v1.2.2-2602.1700**  Editable fields and access profile permissions  
&nbsp;: Editable dialog fields:  
&nbsp;    field editability controlled by readwrite flag, personal flag,  
&nbsp;    and access profile permissions.  
&nbsp;: Field types:  
&nbsp;    flag (Yes/No dropdown), number (formatted), string with listvalues (dropdown)  
&nbsp;: Nullable fields:  
&nbsp;    placeholder with nullmeaning, clear button for text inputs, greyed-out nullmeaning in dropdowns  
&nbsp;: Readonly/disabled styling: consistent across all input types, bottom border only for readonly,  
&nbsp;    no border for node properties  
&nbsp;: Tooltips from field.tooltip on all inputs  
&nbsp;: EsqTabStringComponent:  
&nbsp;    editable textarea with two-way binding, readOnly and maxLength support  
&nbsp;: EsqUtils:  
&nbsp;    formatNumber and parseNumber utility methods  
&nbsp;: Access Profile:  
&nbsp;    isolated from REST model into esquire.ui/api with EsqRole, EsqPermission classes  
&nbsp;: isCommandAllowed:  
&nbsp;    permission check based on admin flags per entity kind  
&nbsp;: Command constants:  
&nbsp;    CMD_DEFAULT, CMD_NEW, CMD_MOVE, CMD_DELETE, CMD_KEY, CMD_ACCT centralized in EsqExplorerCallApi  
&nbsp;: ReadOnly flag in dialogs derived from access profile permissions instead of hardcoded  
1.2.2-2602.1400  Clean Name convention: kind vs type  
&nbsp;: Kind is for entity/treenode objects, and type is for only any other purpose.  
&nbsp;: EsqNodeType renamed with EsqObjectKind to be in synch with services  

**v1.2.2-2602.1322** refactoring/cleanup in progress  
&nbsp; treeFlags removed from TreeNode  
&nbsp; api regenerated  

**v1.2.2-2602.1217** set of node types configured in server side  
&nbsp; set of node types configured in server side, keeps ability to be defined/overwritten locally  
&nbsp; added "/esq-kinds" REST API entry point  

**v1.02.02-2602.0419**  
&nbsp;  handle KeyCloak Token Renewal events  
&nbsp;  generalization of dialogs : a common TabField component to handle any field type  

**v1.02.02-2602.0419**  Preparing for dialog code generalization  
&nbsp;  api regenerated (single object vs array)  
&nbsp;  Prepare for dialog code generalization  
&nbsp;: Clean set of dialogs: now is clear: NodeDialog, DetailsDialog, NodeDetailsDialog, AccessProfileDialog  
&nbsp;: Simplify with "name" and "kind" fields: any object is an EsqThing  
&nbsp;: At start up load an Access Profile instead of User Details  

**v1.02.02-2602.0218**  
&nbsp; "SysAdmin" and "Sys Admin-s" added  
&nbsp; Gaps in Entity Kind enumeration: system objects  orgs  users  accounts  

---

## Code Changes

### frontend/src/changes.txt


**04/20/2026** mir0n  Advertisement context  
**flatTree\app-shell.***  
&nbsp;- advertisement context added, nvagation to adv-explorer back-n-force  

**04/20/2026** mir0n  Transfer: dynamic rate label and readonly toggle  
**explorer\flatTree\acct\EsqAcctPicker.ts**  
&nbsp;- ccyChange output: emits account currency after each account load  
&nbsp;- destroyed guard added (OnDestroy)  
**explorer\flatTree\acct\EsqTransferDialog.***  
&nbsp;- dynamic rate label: shows "Rate SRC/DEST" from ccyChange events  
&nbsp;- same-ccy: rate field readonly, reset to 1.00; cross-ccy: editable  

**04/19/2026** mir0n  import paths migrated to @mir0n-pro/esquire.ui library  
**app\interceptor\rfc9457Interceptor.ts**  
&nbsp;- import paths migrated to @mir0n-pro/esquire.ui library  
&nbsp;- multiline import blocks reformatted: 3+ items one-per-line  
**explorer\flatTree\app-shell.ts**  
&nbsp;- import paths migrated to @mir0n-pro/esquire.ui library  
&nbsp;- multiline import blocks reformatted: 3+ items one-per-line  
**explorer\flatTree\acct\EsqAcctCommandHandler.ts**  
&nbsp;- import paths migrated to @mir0n-pro/esquire.ui library  
&nbsp;- multiline import blocks reformatted: 3+ items one-per-line  
**explorer\flatTree\acct\EsqAcctDialog.ts**  
&nbsp;- import paths migrated to @mir0n-pro/esquire.ui library  
&nbsp;- multiline import blocks reformatted: 3+ items one-per-line  
**explorer\flatTree\acct\EsqAcctDialog.scss**  
&nbsp;- @use '@mir0n-pro/esquire.ui/components/EsqDetailsDialog' (replaces local src reference)  
**explorer\flatTree\acct\EsqAcctPicker.ts**  
&nbsp;- import paths migrated to @mir0n-pro/esquire.ui library  
&nbsp;- multiline import blocks reformatted: 3+ items one-per-line  
**explorer\flatTree\acct\EsqSelectAcctDialog.ts**  
&nbsp;- import paths migrated to @mir0n-pro/esquire.ui library  
&nbsp;- multiline import blocks reformatted: 3+ items one-per-line  
**explorer\flatTree\acct\EsqSelectAcctDialog.scss**  
&nbsp;- @use '@mir0n-pro/esquire.ui/components/EsqDetailsDialog' and /explorer/flatTree/components/EsqSelectEntityDialog  
&nbsp;**+ added explorer\flatTree\acct\EsqSelectEntityDialog.html**  
&nbsp;- template copied locally from library (Angular requires templateUrl to be a local file)  
**explorer\flatTree\acct\EsqTransferDialog.ts**  
&nbsp;- import paths migrated to @mir0n-pro/esquire.ui library  
&nbsp;- multiline import blocks reformatted: 3+ items one-per-line  

**04/15/2026** mir0n  add login-hint background  
**flatTree\app-shell.scss**  
&nbsp;- ComponentModel.svg background added to login-hint-row  

**04/14/2026** mir0n  Transfer acct operation; protective hooks; paper-account submenu guard  
**flatTree\acct\AcctOperation.ts**  
&nbsp;- DICT_KIND_TRANSFER=1004; TRANSFER.dictKind corrected  
&nbsp;**+ added flatTree\acct\EsqTransferDialog.***  
**flatTree\acct\EsqAcctCommandHandler.ts**  
&nbsp;- route DICT_KIND_TRANSFER to EsqTransferDialog  
**flatTree\acct\EsqAcctDialog.ts**  
&nbsp;- protected hooks for subclassing: onDictionaryLoaded, focusOnInit, extraConfirmLines, validateExtra async  
&nbsp;- isNegativeOp getter; el.nativeElement querySelector; idLabel in confirm lines  
**flatTree\acct\EsqSelectAcctDialog.ts**  
&nbsp;- isSelectable() blocks re-selection of pre-selected entity  
**flatTree\app-shell.contants.ts**  
&nbsp;- KIND_PACCOUNT/KIND_PACCOUNTLNK constants  
**flatTree\app-shell.ts**  
&nbsp;- subItemDisabled callback; Transfer submenu item; EsqObjectKind 1004 (transfer)  

**04/13/2026** mir0n  Acct operations expansion: Deposit/Withdrawal submenu; AmountEffect validation  
&nbsp;**+ added flatTree\acct\AcctOperation.ts**  
**flatTree\acct\EsqAcctCommandHandler.ts**  
&nbsp;- pass dictKind (parsed from subCmd) to EsqAcctDialog  
**flatTree\acct\EsqAcctDialog.ts**  
&nbsp;- dict-kind driven: header icon/title and dictionary from dictKind param  
&nbsp;- AmountEffect validation; NEGATIVE ops negate amount on submit  
&nbsp;- opKind cached; entityId guard in canSubmit; confirmDlg passes opKind  
**flatTree\app-shell.ts**  
&nbsp;- kinds 1000/1002 added to EsquireObjectKinds with titles  
&nbsp;- acct subItems (Deposit/Withdrawal) built in ngOnInit from kind icons  

**04/12/2026** mir0n  Account picker; EsqAcctDialog fixes; EsqSelectAcctDialog  
&nbsp;**+ added flatTree\acct\EsqAcctPicker.***  
**flatTree\acct\EsqAcctDialog.ts**  
&nbsp;- extract account picker to EsqAcctPicker; idLabel from dict field 'id'  
&nbsp;- validateFields() before submit; onEnterKey event: Event  
**flatTree\acct\EsqAcctDialog.scss**  
&nbsp;- account header row grid styles  
&nbsp;**+ added flatTree\acct\EsqSelectAcctDialog.ts**  
**flatTree\acct\EsqAcctCommandHandler.ts**  
&nbsp;- selectorFactory param; pass to EsqAcctDialog; dialog size 480px  
**flatTree\app-shell.ts**  
&nbsp;- EsqFlatTreeDatasource created in constructor; passed to EsqAcctCommandHandler  

**04/10/2026** mir0n Rename app-explorer.component with app-shell  

**04/10/2026** mir0n Externalize acct command as custom  
&nbsp;**+ added flatTree\app-shell.contants.ts**  
**flatTree\app-explorer.component.ts**  
&nbsp;- added generic pipeWithErrorAndDelay() to help REST API wrapper  
&nbsp;- initialize EsqAccessProfile Flag Indexes  
&nbsp;- registerHandler(new EsqAcctCommandHandle with inline submitter  
&nbsp;- use EsqShellConstants.CMD_ACCT  
**flatTree\acct\EsqAcctCommandHandler.ts**  
&nbsp;- use EsqShellConstants.CMD_ACCT  
&nbsp;- accept external defined REST command submitter  
**flatTree\acct\EsqAcctDialog.ts**  
&nbsp;- accept external defined REST command submitter  

**04/09/2026** mir0n  acct deposit command  
**flatTree\acct\EsqAcctCommandHandler.ts**  
&nbsp;- initial: acct deposit command handler  
**flatTree\acct\EsqAcctDialog.ts**  
&nbsp;- initial: deposit form dialog; dictionary-driven fields (kind 980)  
&nbsp;- entity read on init/refresh; stays open after submit  
**flatTree\acct\EsqAcctDialog.html**  
&nbsp;- initial: deposit form; Close/Submit/Refresh actions  
**flatTree\app-explorer.component.ts**  
&nbsp;- esquireCmdAcct() REST wrapper: POST /esq-acct  
&nbsp;- EsqAcctCommandHandler registered in constructor  

**04/08/2026** mir0n  generalization of "loading" indicator  
**flatTree\app-explorer.component.ts**  
&nbsp;- ExplorerComponent extends EsqExplorerHostDummy  
&nbsp;- static initialization at constructor (moved from ngOnInit)  
&nbsp;- esqRestApiWrapper() : issue loading envent  
&nbsp;- esqRestApiWrapper() : EsqUtils.observeWithDelay() to emulate REST API delays  

**04/07/2026** mir0n  updated REST API facade; removed acct-endpoint routing  
**flatTree\app-explorer.component.ts**  
&nbsp;- esquireCmdSave/New/Del wrappers: removed acct routing (esquireCmdAdel/Anew/Asave eliminated from API)  

**04/02/2026** mir0n  
**flatTree\app-explorer.component.ts**  
&nbsp;- fix: extra subscription causes double HTTP request  
&nbsp;- api.calle(): added subCmd, selectMode  

**03/31/2026** mir0n  move command REST wiring  
**explorer\flatTree\app-explorer.component.ts**  
&nbsp;- esquireCmdMove() REST wrapper: POST /esq-move with kind, id, dist_id  

**03/31/2026** mir0n  explorer layout fix; login hint callout  
**styles.scss**  
&nbsp;- app-root, app-explorer: display: block; height: 100% (propagates height chain to Angular host elements)  
**explorer\flatTree\app-explorer.component.scss**  
&nbsp;- grid-template-rows: auto → 1fr (explorer fills space between toolbars on resize)  
&nbsp;- login-hint-row + login-form-wrapper: callout bubble with triangle arrow pointing to login icon  
**explorer\flatTree\app-explorer.component.html**  
&nbsp;- login hint restructured as callout (login-hint-row wrapper, arrow bubble)  
&nbsp;- empty  placeholder keeps 1fr grid row alive when hint is hidden  
**explorer\flatTree\app-explorer.component.ts**  
&nbsp;- hideLoginHint signal: suppresses login hint when ?from=auth query param present  
&nbsp;- login()/logout() redirect to /?from=auth so hint is hidden after Keycloak callback  

**03/28/2026** mir0n  delete command  
**explorer\flatTree\app-explorer.component.ts**  
&nbsp;- esquireCmdDel() REST wrapper: routes to /esq-adel for acct kinds, /esq-del otherwise  
&nbsp;- onTreeRefresh() consolidated: entityId/asOwner optional params; removed onTreeRefreshSelect()  
&nbsp;- Delete menu item added to EsqCommandMenuItems  

**03/27/2026** mir0n  dialog resize + position/size persistence per user  
**explorer\flatTree\app-explorer.component.ts**  
&nbsp;- setUserId() called at profile load — informs mill of logged-in userId at logon  
&nbsp;- userId passed to EsqSingleEntryDialog data  

**03/26/2026** mir0n  create entity dialog  
**rest\api\esquire.service.ts**  
&nbsp;- added esquireCmdNew (/esq-new): create org/user entity under parent  
&nbsp;- added esquireCmdAnew (/esq-anew): create account entity under parent user  
&nbsp;- added esquireCmdDel (/esq-del): delete org/user entity by id  
&nbsp;- added esquireCmdAdel (/esq-adel): delete account entity by id  
**explorer\flatTree\app-explorer.component.ts**  
&nbsp;- implements EsqExplorerHost: onTreeRefresh(), onTreeRefreshSelect(), setErrorMessage()  
&nbsp;- esquireCmdNew() REST wrapper: routes to /esq-anew for acct kinds, /esq-new otherwise  
&nbsp;- registers mill host via callApiMill.instance().registerHost(this) in ngOnInit()  
&nbsp;- setErrorMessage(): updates errorMessage signal and stores errorReport  
**explorer\flatTree\app-explorer.component.html**  
&nbsp;- [esqExplorerHost]="this" binding on  component  

**03/16/2026** mir0n  let → var convention; subscribe error blocks removed  
**explorer\flatTree\app-explorer.component.ts**  
&nbsp;- let → var for ret variable (coding convention)  
&nbsp;- subscribe error blocks removed (error handling done in dialog catchError)  

**03/09/2026** mir0n Race condition fixes: NG0100 and CallApiMill not initialized  
**explorer\flatTree\app-explorer.component.ts**  
&nbsp;- profile converted to Angular signal — fixes NG0100 ExpressionChangedAfterChecked on faceIcon/faceName  
&nbsp;- callApiMill and dictionary initialized before await EsqObjectKindFactory.init() — fixes "CallApiMill not initialized" race  

**03/06/2026** mir0n Server-side validation error focus; error report errors[] display  
**explorer\flatTree\app-explorer.component.ts**  
&nbsp;- error report dialog: JSON.stringify errors[] for correct tabstring display (was "[object Object]")  

**03/03/2026** claude Fix Keycloak SSO iframe timeout in K8s deployment  
**main.ts**  
&nbsp;- checkLoginIframe: true → false (cross-port iframe unreliable with self-signed certs)  
&nbsp;- onLoad stays 'check-sso' — session detection still works via silentCheckSsoRedirectUri  

**03/01/2026** mir0n  
**explorer\flatTree\app-explorer.component.ts**  
&nbsp;- Wait for initial access profile load  

**02/18/2026** mir0n Wire Save to REST — esquireCmdSave & esquireKeySave  
**explorer\flatTree\app-explorer.component.ts**  
&nbsp;- added esquireCmdSave() wrapper (routes acct entities to /esq-cmd-asave)  
&nbsp;- added esquireKeySave() wrapper  
&nbsp;- console.log replaced with EsqUtils.log  

**02/17/2026** mir0n Access profile permissions and command constants  
**explorer\flatTree\app-explorer.component.ts**  
&nbsp;- use EsqAccessProfile from esquire.ui/api (isolated from REST model)  
&nbsp;- use CMD_ constants from EsqExplorerCallApi  
&nbsp;- wrap REST response with new EsqAccessProfile constructor  

**02/13/2026** mir0n EsqNodeType renamed with EsqObjectKind  
**explorer\flatTree\app-explorer.component.ts**  
&nbsp;- EsqNodeType renamed with EsqObjectKind  
&nbsp;- EsqNodeTypeFactory renamed with EsqObjectKindFactory  

**02/12/2026** mir0n  
**explorer\flatTree\app-explorer.component.ts**  
&nbsp;- EsqNodeType in explicit file  
&nbsp;- added EsqRestApi.esquireKinds()  
&nbsp;- EsqNodeTypeFactory.init with RestAPI and local exceptions set (define icons and heading)  
&nbsp;- EsquireNodeTypes have only icons and heading  

**02/05/2026** mir0n  
&nbsp; handle KeyCloak Token Renewal events  

**02/04/2026** mir0n  
&nbsp;  explicit use EsqAccessProfile instead of any  
&nbsp;  load Access Profile at startup (instead of entity details)  

**02/02/2026**  
**explorer\flatTree\flatTree\app-explorer.component.ts**  
&nbsp; "SysAdmin" and "Sys Admin-s" added  
&nbsp; Gaps in Entity Kind enumeration: system objects  orgs  users  accounts  

### frontend/src/esquire.ui/changes.txt


---

## Commits

```

-- 2026-05-03 | commit: f885b20 | mir0n.the.programmer | v1.2.2-2605.0318 v1.2.2 Finalization. Search resources and metadata --
M	doc/release_notes.txt
M	e2e-test/tests/01-prelogin.spec.ts
M	e2e-test/tests/07-details.spec.ts
M	frontend/Dockerfile.k8s
M	frontend/package.json
A	frontend/public/googlecb109f50553030d1.html
A	frontend/public/img/og-banner.png
A	frontend/public/robots.txt
A	frontend/public/sitemap.xml
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/explorer/flatTree/app-shell.scss
M	frontend/src/index.html
M	frontend/src/styles.scss
 13 files changed, 193 insertions(+), 37 deletions(-)

-- 2026-04-22 | commit: c138563 | mir0n.the.programmer | support of local k8s deployment --
A	doc/reports/report_v1.2.2.md
M	e2e-test/e2e-test.bat
M	e2e-test/helpers/auth.ts
M	e2e-test/playwright.config.ts
M	e2e-test/tests/01-prelogin.spec.ts
M	e2e-test/tests/02-login.spec.ts
M	frontend/Dockerfile
A	frontend/Dockerfile.k8s
A	frontend/nginx.conf
M	frontend/src/explorer/flatTree/app-shell.html
 10 files changed, 1521 insertions(+), 24 deletions(-)

-- 2026-04-21 | commit: 37f8c73 | mir0n.the.programmer | v1.2.2 Finalization --
M	README.md
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/explorer/flatTree/app-shell.scss
M	frontend/src/explorer/flatTree/app-shell.ts
 6 files changed, 626 insertions(+), 75 deletions(-)

-- 2026-04-20 | commit: 5c65ed0 | mir0n.the.programmer | Transfer: dynamic rate label (Rate SRC/DEST); same-ccy readonly+reset --
M	doc/release_notes.txt
M	e2e-test/e2e-test.scope.md
M	e2e-test/tests/11-deposit.spec.ts
A	e2e-test/tests/13-transfer.spec.ts
M	frontend/compose.yaml
M	frontend/package.json
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/acct/EsqAcctPicker.ts
M	frontend/src/explorer/flatTree/acct/EsqTransferDialog.html
M	frontend/src/explorer/flatTree/acct/EsqTransferDialog.ts
 10 files changed, 189 insertions(+), 20 deletions(-)


-- 2026-04-19 | commit: 18400e5 | mir0n.the.programmer | Local esquire.ui module replaced with library package; Playwright e2e suite --
A	doc/e2e.todo.md
D	doc/fieldType.md
D	doc/kind.context.md
D	doc/permissions.md
M	doc/release_notes.txt
D	doc/validations.md
A	e2e-test/.env
A	e2e-test/.gitignore
A	e2e-test/e2e-test.bat
A	e2e-test/e2e-test.scope.md
A	e2e-test/helpers/auth.ts
A	e2e-test/helpers/tree.ts
A	e2e-test/package.json
A	e2e-test/playwright-report/--placeholder--
A	e2e-test/playwright.config.ts
A	e2e-test/test-results/.last-run.json
A	e2e-test/tests/01-prelogin.spec.ts
A	e2e-test/tests/02-login.spec.ts
A	e2e-test/tests/03-access-profile.spec.ts
A	e2e-test/tests/04-tree-load.spec.ts
A	e2e-test/tests/05-tree-navigation.spec.ts
A	e2e-test/tests/06-context-menu.spec.ts
A	e2e-test/tests/07-details.spec.ts
A	e2e-test/tests/08-new-entity.spec.ts
A	e2e-test/tests/09-move-entity.spec.ts
A	e2e-test/tests/10-delete-entity.spec.ts
A	e2e-test/tests/11-deposit.spec.ts
A	e2e-test/tests/12-withdrawal.spec.ts
A	e2e-test/tests/14-error-handling.spec.ts
M	frontend/Dockerfile
M	frontend/angular.json
M	frontend/compose.yaml
M	frontend/package.json
M	frontend/src/app/interceptor/rfc9457Interceptor.ts
M	frontend/src/changes.txt
D	frontend/src/esquire.ui/api/AsEsqTreeNodePipe.spec.ts
D	frontend/src/esquire.ui/api/AsEsqTreeNodePipe.ts
D	frontend/src/esquire.ui/api/EsqAccessProfile.ts
D	frontend/src/esquire.ui/api/EsqContextMenuBuilder.ts
D	frontend/src/esquire.ui/api/EsqDictionaryApi.ts
D	frontend/src/esquire.ui/api/EsqEntityCommandHandler.ts
D	frontend/src/esquire.ui/api/EsqEntityDictionary.ts
D	frontend/src/esquire.ui/api/EsqExplorerCallApi.ts
D	frontend/src/esquire.ui/api/EsqNodeStatusFactory.ts
D	frontend/src/esquire.ui/api/EsqObjectKind.ts
D	frontend/src/esquire.ui/api/EsqObjectKindFactory.ts
D	frontend/src/esquire.ui/api/EsqRestApi.ts
D	frontend/src/esquire.ui/api/EsqTreeNode.ts
D	frontend/src/esquire.ui/api/EsqTreeNodeDto.ts
D	frontend/src/esquire.ui/api/ProblemDetail.ts
D	frontend/src/esquire.ui/api/ng-package.json
D	frontend/src/esquire.ui/api/public-api.ts
D	frontend/src/esquire.ui/changes.txt
D	frontend/src/esquire.ui/components/EsqAccessProfileDialog.html
D	frontend/src/esquire.ui/components/EsqAccessProfileDialog.ts
D	frontend/src/esquire.ui/components/EsqConfirmDialog.html
D	frontend/src/esquire.ui/components/EsqConfirmDialog.ts
D	frontend/src/esquire.ui/components/EsqCreateEntityDialog.ts
D	frontend/src/esquire.ui/components/EsqDetailsDialog.scss
D	frontend/src/esquire.ui/components/EsqDialogResizeDirective.ts
D	frontend/src/esquire.ui/components/EsqDictionary.ts
D	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.html
D	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
D	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
D	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.html
D	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.ts
D	frontend/src/esquire.ui/components/EsqNodeDialog.html
D	frontend/src/esquire.ui/components/EsqNodeDialog.ts
D	frontend/src/esquire.ui/components/EsqResizeDirective.ts
D	frontend/src/esquire.ui/components/EsqSingleEntryDialog.html
D	frontend/src/esquire.ui/components/EsqSingleEntryDialog.ts
D	frontend/src/esquire.ui/components/EsqTabFieldComponent.html
D	frontend/src/esquire.ui/components/EsqTabFieldComponent.ts
D	frontend/src/esquire.ui/components/EsqTabIknListComponent.html
D	frontend/src/esquire.ui/components/EsqTabIknListComponent.ts
D	frontend/src/esquire.ui/components/EsqTabIknfTableComponent.html
D	frontend/src/esquire.ui/components/EsqTabIknfTableComponent.ts
D	frontend/src/esquire.ui/components/EsqTabListComponent.html
D	frontend/src/esquire.ui/components/EsqTabListComponent.scss
D	frontend/src/esquire.ui/components/EsqTabListComponent.ts
D	frontend/src/esquire.ui/components/EsqTabStringComponent.html
D	frontend/src/esquire.ui/components/EsqTabStringComponent.scss
D	frontend/src/esquire.ui/components/EsqTabStringComponent.ts
D	frontend/src/esquire.ui/components/EsqUtils.ts
D	frontend/src/esquire.ui/components/EsqValidationError.ts
D	frontend/src/esquire.ui/components/commands/EsqCommandHandlerRegistry.ts
D	frontend/src/esquire.ui/components/commands/EsqDefaultCommandHandler.ts
D	frontend/src/esquire.ui/components/commands/EsqDeleteCommandHandler.ts
D	frontend/src/esquire.ui/components/commands/EsqKeyCommandHandler.ts
D	frontend/src/esquire.ui/components/loading.16.gif
D	frontend/src/esquire.ui/components/ng-package.json
D	frontend/src/esquire.ui/components/public-api.ts
D	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.html
D	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.scss
D	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.ts
D	frontend/src/esquire.ui/explorer/flatTree/EsqFlatTreeDatasource.ts
D	frontend/src/esquire.ui/explorer/flatTree/EsqFlatTreeSelector.ts
D	frontend/src/esquire.ui/explorer/flatTree/EsqListViewDatasource.ts
D	frontend/src/esquire.ui/explorer/flatTree/EsqSelectEntityDatasource.ts
D	frontend/src/esquire.ui/explorer/flatTree/EsqTreeViewDatasource.ts
D	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveCommandHandler.ts
D	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveDialog.ts
D	frontend/src/esquire.ui/explorer/flatTree/components/EsqSelectEntityDialog.scss
D	frontend/src/esquire.ui/explorer/flatTree/components/EsqSelectEntityDialog.ts
D	frontend/src/esquire.ui/explorer/flatTree/loading.16.gif
D	frontend/src/esquire.ui/explorer/flatTree/ng-package.json
D	frontend/src/esquire.ui/explorer/flatTree/public-api.ts
D	frontend/src/esquire.ui/test/group1/EsqAccessProfile.spec.ts
D	frontend/src/esquire.ui/test/group1/EsqCommandHandlerRegistry.spec.ts
D	frontend/src/esquire.ui/test/group1/EsqContextMenuBuilder.spec.ts
D	frontend/src/esquire.ui/test/group1/EsqNodeStatusFactory.spec.ts
D	frontend/src/esquire.ui/test/group1/EsqObjectKind.spec.ts
D	frontend/src/esquire.ui/test/group1/EsqObjectKindFactory.spec.ts
D	frontend/src/esquire.ui/test/group1/EsqTreeNode.spec.ts
D	frontend/src/esquire.ui/test/group1/EsqTreeNodeDto.spec.ts
D	frontend/src/esquire.ui/test/group1/EsqUtils.spec.ts
D	frontend/src/esquire.ui/test/group2/EsqDictionary.spec.ts
D	frontend/src/esquire.ui/test/group2/EsqFlatTreeDatasource.spec.ts
D	frontend/src/esquire.ui/test/group2/EsqSelectEntityDatasource.spec.ts
D	frontend/src/esquire.ui/test/group2/EsqTreeViewDatasource.spec.ts
D	frontend/src/esquire.ui/test/group3/EsqAccessProfileDialog.spec.ts
D	frontend/src/esquire.ui/test/group3/EsqConfirmDialog.spec.ts
D	frontend/src/esquire.ui/test/group3/EsqEntityDetailsDialog.spec.ts
D	frontend/src/esquire.ui/test/group3/EsqExplorerComponent.spec.ts
D	frontend/src/esquire.ui/test/group3/EsqMoveDialog.spec.ts
D	frontend/src/esquire.ui/test/group3/EsqNodeDetailsDialog.spec.ts
D	frontend/src/esquire.ui/test/group3/EsqNodeDialog.spec.ts
D	frontend/src/esquire.ui/test/group3/EsqSelectEntityDialog.spec.ts
D	frontend/src/esquire.ui/test/group3/EsqSingleEntryDialog.spec.ts
D	frontend/src/esquire.ui/test/test.structure.md
M	frontend/src/explorer/flatTree/acct/EsqAcctCommandHandler.ts
M	frontend/src/explorer/flatTree/acct/EsqAcctDialog.scss
M	frontend/src/explorer/flatTree/acct/EsqAcctDialog.ts
M	frontend/src/explorer/flatTree/acct/EsqAcctPicker.ts
A	frontend/src/explorer/flatTree/acct/EsqSelectAcctDialog.scss
M	frontend/src/explorer/flatTree/acct/EsqSelectAcctDialog.ts
R100	frontend/src/esquire.ui/explorer/flatTree/components/EsqSelectEntityDialog.html	frontend/src/explorer/flatTree/acct/EsqSelectEntityDialog.html
M	frontend/src/explorer/flatTree/acct/EsqTransferDialog.ts
M	frontend/src/explorer/flatTree/app-shell.ts
 139 files changed, 825 insertions(+), 12807 deletions(-)

-- 2026-04-17 | commit: 07761ff | mir0n.the.programmer | Tuning of field types: image, tablist --
M	doc/release_notes.txt
M	frontend/src/esquire.ui/api/public-api.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqTabFieldComponent.html
M	frontend/src/esquire.ui/components/EsqTabListComponent.html
M	frontend/src/esquire.ui/components/EsqTabListComponent.scss
 6 files changed, 19 insertions(+), 3 deletions(-)

-- 2026-04-15 | commit: 1c09ca9 | mir0n.the.programmer | EsqObjectKindFactory: pass kind title from server; add login-hint background --
M	doc/release_notes.txt
M	frontend/compose.yaml
A	frontend/public/img/ComponentModel.svg
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/api/EsqObjectKindFactory.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/explorer/flatTree/app-shell.scss
 7 files changed, 13988 insertions(+), 3 deletions(-)

-- 2026-04-14 | commit: 0b589ee | mir0n.the.programmer | Unit tests were added --
M	doc/release_notes.txt
M	frontend/angular.json
M	frontend/package.json
D	frontend/src/app/app.component.spec.ts
A	frontend/src/esquire.ui/test/group1/EsqAccessProfile.spec.ts
A	frontend/src/esquire.ui/test/group1/EsqCommandHandlerRegistry.spec.ts
A	frontend/src/esquire.ui/test/group1/EsqContextMenuBuilder.spec.ts
A	frontend/src/esquire.ui/test/group1/EsqNodeStatusFactory.spec.ts
A	frontend/src/esquire.ui/test/group1/EsqObjectKind.spec.ts
A	frontend/src/esquire.ui/test/group1/EsqObjectKindFactory.spec.ts
A	frontend/src/esquire.ui/test/group1/EsqTreeNode.spec.ts
A	frontend/src/esquire.ui/test/group1/EsqTreeNodeDto.spec.ts
A	frontend/src/esquire.ui/test/group1/EsqUtils.spec.ts
A	frontend/src/esquire.ui/test/group2/EsqDictionary.spec.ts
A	frontend/src/esquire.ui/test/group2/EsqFlatTreeDatasource.spec.ts
A	frontend/src/esquire.ui/test/group2/EsqSelectEntityDatasource.spec.ts
A	frontend/src/esquire.ui/test/group2/EsqTreeViewDatasource.spec.ts
A	frontend/src/esquire.ui/test/group3/EsqAccessProfileDialog.spec.ts
A	frontend/src/esquire.ui/test/group3/EsqConfirmDialog.spec.ts
A	frontend/src/esquire.ui/test/group3/EsqEntityDetailsDialog.spec.ts
A	frontend/src/esquire.ui/test/group3/EsqExplorerComponent.spec.ts
A	frontend/src/esquire.ui/test/group3/EsqMoveDialog.spec.ts
A	frontend/src/esquire.ui/test/group3/EsqNodeDetailsDialog.spec.ts
A	frontend/src/esquire.ui/test/group3/EsqNodeDialog.spec.ts
A	frontend/src/esquire.ui/test/group3/EsqSelectEntityDialog.spec.ts
A	frontend/src/esquire.ui/test/group3/EsqSingleEntryDialog.spec.ts
A	frontend/src/esquire.ui/test/test.structure.md
D	frontend/src/explorer/flatTree/app-shell.spec.ts
A	frontend/src/test/group1/AcctOperation.spec.ts
A	frontend/src/test/group2/EsqAcctCommandHandler.spec.ts
A	frontend/src/test/group3/AppComponent.spec.ts
A	frontend/src/test/group3/ExplorerComponent.spec.ts
A	frontend/src/test/test.structure.md
 33 files changed, 2243 insertions(+), 58 deletions(-)

-- 2026-04-14 | commit: 6cb3d97 | mir0n.the.programmer | Acct Transaction Phase IV: Transfer acct operation with dest picker and paper-account guard --
M	doc/release_notes.txt
M	frontend/public/img/$transfer.ico
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.html
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqFlatTreeSelector.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqSelectEntityDatasource.ts
M	frontend/src/esquire.ui/explorer/flatTree/components/EsqSelectEntityDialog.ts
M	frontend/src/explorer/flatTree/acct/AcctOperation.ts
M	frontend/src/explorer/flatTree/acct/EsqAcctCommandHandler.ts
M	frontend/src/explorer/flatTree/acct/EsqAcctDialog.html
M	frontend/src/explorer/flatTree/acct/EsqAcctDialog.scss
M	frontend/src/explorer/flatTree/acct/EsqAcctDialog.ts
M	frontend/src/explorer/flatTree/acct/EsqAcctPicker.html
M	frontend/src/explorer/flatTree/acct/EsqSelectAcctDialog.ts
A	frontend/src/explorer/flatTree/acct/EsqTransferDialog.html
A	frontend/src/explorer/flatTree/acct/EsqTransferDialog.ts
M	frontend/src/explorer/flatTree/app-shell.contants.ts
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/explorer/flatTree/app-shell.ts
 21 files changed, 387 insertions(+), 59 deletions(-)

-- 2026-04-13 | commit: 7df4919 | mir0n.the.programmer | Acct operations expansion: Deposit/Withdrawal submenu; AmountEffect validation --
M	doc/release_notes.txt
M	frontend/public/img/$sign.ico
A	frontend/public/img/$transfer.ico
A	frontend/public/img/$withdraw.ico
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/api/EsqContextMenuBuilder.ts
M	frontend/src/esquire.ui/api/EsqObjectKindFactory.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.html
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.ts
A	frontend/src/explorer/flatTree/acct/AcctOperation.ts
M	frontend/src/explorer/flatTree/acct/EsqAcctCommandHandler.ts
M	frontend/src/explorer/flatTree/acct/EsqAcctDialog.ts
M	frontend/src/explorer/flatTree/app-shell.ts
 14 files changed, 234 insertions(+), 38 deletions(-)

-- 2026-04-12 | commit: 3120076 | mir0n.the.programmer | Account picker; generic entity select dialog; EsqMoveDialog refactor --
M	doc/release_notes.txt
A	frontend/public/img/$sign.ico
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqDetailsDialog.scss
M	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqFlatTreeDatasource.ts
A	frontend/src/esquire.ui/explorer/flatTree/EsqFlatTreeSelector.ts
A	frontend/src/esquire.ui/explorer/flatTree/EsqSelectEntityDatasource.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqTreeViewDatasource.ts
M	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveCommandHandler.ts
D	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveDialog.scss
M	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveDialog.ts
R059	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveDialog.html	frontend/src/esquire.ui/explorer/flatTree/components/EsqSelectEntityDialog.html
A	frontend/src/esquire.ui/explorer/flatTree/components/EsqSelectEntityDialog.scss
A	frontend/src/esquire.ui/explorer/flatTree/components/EsqSelectEntityDialog.ts
M	frontend/src/explorer/flatTree/acct/EsqAcctCommandHandler.ts
M	frontend/src/explorer/flatTree/acct/EsqAcctDialog.html
A	frontend/src/explorer/flatTree/acct/EsqAcctDialog.scss
M	frontend/src/explorer/flatTree/acct/EsqAcctDialog.ts
A	frontend/src/explorer/flatTree/acct/EsqAcctPicker.html
A	frontend/src/explorer/flatTree/acct/EsqAcctPicker.scss
A	frontend/src/explorer/flatTree/acct/EsqAcctPicker.ts
A	frontend/src/explorer/flatTree/acct/EsqSelectAcctDialog.ts
M	frontend/src/explorer/flatTree/app-shell.html
M	frontend/src/explorer/flatTree/app-shell.ts
 27 files changed, 1117 insertions(+), 320 deletions(-)

-- 2026-04-10 | commit: 959ec8a | mir0n.the.programmer | Rename app-explorer.component with app-shell --
M	doc/release_notes.txt
M	frontend/src/app/app.routes.ts
M	frontend/src/changes.txt
R099	frontend/src/explorer/flatTree/app-explorer.component.html	frontend/src/explorer/flatTree/app-shell.html
R099	frontend/src/explorer/flatTree/app-explorer.component.scss	frontend/src/explorer/flatTree/app-shell.scss
R089	frontend/src/explorer/flatTree/app-explorer.component.spec.ts	frontend/src/explorer/flatTree/app-shell.spec.ts
R097	frontend/src/explorer/flatTree/app-explorer.component.ts	frontend/src/explorer/flatTree/app-shell.ts
M	frontend/src/main.ts
 8 files changed, 11 insertions(+), 27 deletions(-)

-- 2026-04-10 | commit: e5ad123 | mir0n.the.programmer | Externalize acct command as custom --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/api/EsqAccessProfile.ts
M	frontend/src/esquire.ui/api/EsqEntityCommandHandler.ts
M	frontend/src/esquire.ui/api/EsqExplorerCallApi.ts
M	frontend/src/esquire.ui/api/EsqRestApi.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/explorer/flatTree/acct/EsqAcctCommandHandler.ts
M	frontend/src/explorer/flatTree/acct/EsqAcctDialog.ts
M	frontend/src/explorer/flatTree/app-explorer.component.ts
A	frontend/src/explorer/flatTree/app-shell.contants.ts
M	frontend/src/rest/api/esquire.service.ts
A	frontend/src/rest/model/acctTransactionRequest.ts
A	frontend/src/rest/model/acctTransactionSimple.ts
M	frontend/src/rest/model/models.ts
 15 files changed, 373 insertions(+), 200 deletions(-)

-- 2026-04-09 | commit: 041dd59 | mir0n.the.programmer | Acct deposit command: dialog with dictionary-driven fields, entity refresh, continuous operation --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/api/EsqRestApi.ts
M	frontend/src/esquire.ui/changes.txt
A	frontend/src/explorer/flatTree/acct/EsqAcctCommandHandler.ts
A	frontend/src/explorer/flatTree/acct/EsqAcctDialog.html
A	frontend/src/explorer/flatTree/acct/EsqAcctDialog.ts
M	frontend/src/explorer/flatTree/app-explorer.component.ts
M	openapi-generate/esqEsquireApi.yaml
 9 files changed, 451 insertions(+), 1 deletion(-)

-- 2026-04-08 | commit: 278880d | mir0n.the.programmer | Generalization of "loading" indicator; debug delay centralized --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/api/EsqExplorerCallApi.ts
M	frontend/src/esquire.ui/api/EsqObjectKindFactory.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.html
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.ts
M	frontend/src/esquire.ui/components/EsqConfirmDialog.html
M	frontend/src/esquire.ui/components/EsqDetailsDialog.scss
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqNodeDialog.html
M	frontend/src/esquire.ui/components/EsqSingleEntryDialog.html
M	frontend/src/esquire.ui/components/EsqUtils.ts
A	frontend/src/esquire.ui/components/loading.16.gif
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.html
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.scss
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqFlatTreeDatasource.ts
M	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveCommandHandler.ts
M	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveDialog.html
M	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveDialog.ts
M	frontend/src/explorer/flatTree/app-explorer.component.html
M	frontend/src/explorer/flatTree/app-explorer.component.ts
 26 files changed, 318 insertions(+), 140 deletions(-)

-- 2026-04-07 | commit: 0b72625 | mir0n.the.programmer |  Kind normalization refactor; REST API facade update --
A	doc/kind.context.md
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/api/EsqAccessProfile.ts
M	frontend/src/esquire.ui/api/EsqDictionaryApi.ts
M	frontend/src/esquire.ui/api/EsqEntityCommandHandler.ts
M	frontend/src/esquire.ui/api/EsqEntityDictionary.ts
M	frontend/src/esquire.ui/api/EsqExplorerCallApi.ts
M	frontend/src/esquire.ui/api/EsqObjectKindFactory.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqDictionary.ts
M	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.ts
M	frontend/src/esquire.ui/components/commands/EsqDefaultCommandHandler.ts
M	frontend/src/esquire.ui/components/commands/EsqDeleteCommandHandler.ts
M	frontend/src/esquire.ui/components/commands/EsqKeyCommandHandler.ts
M	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveCommandHandler.ts
M	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveDialog.ts
M	frontend/src/explorer/flatTree/app-explorer.component.ts
M	frontend/src/rest/api/esquire.service.ts
M	openapi-generate/esqEsquireApi.yaml
 21 files changed, 220 insertions(+), 438 deletions(-)

-- 2026-04-02 | commit: 652cbc1 | mir0n.the.programmer | Refactoring of menu command handle; Elimination of double HTTP request --
M	doc/release_notes.txt
M	frontend/src/changes.txt
A	frontend/src/esquire.ui/api/EsqEntityCommandHandler.ts
M	frontend/src/esquire.ui/api/EsqExplorerCallApi.ts
M	frontend/src/esquire.ui/api/public-api.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqDetailsDialog.scss
M	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
M	frontend/src/esquire.ui/components/EsqTabIknListComponent.ts
M	frontend/src/esquire.ui/components/EsqTabListComponent.ts
M	frontend/src/esquire.ui/components/EsqUtils.ts
A	frontend/src/esquire.ui/components/commands/EsqCommandHandlerRegistry.ts
A	frontend/src/esquire.ui/components/commands/EsqDefaultCommandHandler.ts
A	frontend/src/esquire.ui/components/commands/EsqDeleteCommandHandler.ts
A	frontend/src/esquire.ui/components/commands/EsqKeyCommandHandler.ts
M	frontend/src/esquire.ui/components/public-api.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.ts
A	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveCommandHandler.ts
M	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveDialog.ts
M	frontend/src/explorer/flatTree/app-explorer.component.ts
 20 files changed, 859 insertions(+), 286 deletions(-)

-- 2026-03-31 | commit: ca8518b | mir0n.the.programmer | Move command; ESC close for all dialogs --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/api/EsqRestApi.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.ts
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqNodeDialog.ts
M	frontend/src/esquire.ui/components/EsqSingleEntryDialog.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqFlatTreeDatasource.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqTreeViewDatasource.ts
A	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveDialog.html
A	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveDialog.scss
A	frontend/src/esquire.ui/explorer/flatTree/components/EsqMoveDialog.ts
M	frontend/src/explorer/flatTree/app-explorer.component.ts
M	frontend/src/rest/api/esquire.service.ts
M	openapi-generate/esqEsquireApi.yaml
 17 files changed, 585 insertions(+), 23 deletions(-)

-- 2026-03-31 | commit: 1166df8 | mir0n.the.programmer | Synch with keyCloak esquire theme; UI/UX cleanup --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqConfirmDialog.html
M	frontend/src/esquire.ui/components/EsqConfirmDialog.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.scss
M	frontend/src/explorer/flatTree/app-explorer.component.html
M	frontend/src/explorer/flatTree/app-explorer.component.scss
M	frontend/src/explorer/flatTree/app-explorer.component.ts
M	frontend/src/styles.scss
 10 files changed, 144 insertions(+), 21 deletions(-)

-- 2026-03-28 | commit: ca369b5 | mir0n.the.programmer | Inject dictionary defaults in create entity dialog --
M	doc/release_notes.txt
M	frontend/src/esquire.ui/api/EsqEntityDictionary.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqCreateEntityDialog.ts
M	frontend/src/esquire.ui/components/EsqDictionary.ts
M	frontend/src/rest/model/esqEntityField.ts
M	openapi-generate/esqEsquireApi.yaml
 7 files changed, 78 insertions(+), 18 deletions(-)

-- 2026-03-28 | commit: 5d1c76f | mir0n.the.programmer |   Delete command --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/api/EsqExplorerCallApi.ts
M	frontend/src/esquire.ui/api/EsqRestApi.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.ts
M	frontend/src/explorer/flatTree/app-explorer.component.ts
 8 files changed, 105 insertions(+), 16 deletions(-)

-- 2026-03-27 | commit: 7ffffdd | mir0n.the.programmer | Windows style dialog resize + position/size persistence per user --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.html
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.ts
M	frontend/src/esquire.ui/components/EsqConfirmDialog.html
M	frontend/src/esquire.ui/components/EsqConfirmDialog.ts
M	frontend/src/esquire.ui/components/EsqCreateEntityDialog.ts
M	frontend/src/esquire.ui/components/EsqDetailsDialog.scss
A	frontend/src/esquire.ui/components/EsqDialogResizeDirective.ts
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqNodeDialog.html
M	frontend/src/esquire.ui/components/EsqNodeDialog.ts
M	frontend/src/esquire.ui/components/EsqSingleEntryDialog.html
M	frontend/src/esquire.ui/components/EsqSingleEntryDialog.ts
M	frontend/src/esquire.ui/components/public-api.ts
M	frontend/src/explorer/flatTree/app-explorer.component.ts
 21 files changed, 341 insertions(+), 9 deletions(-)

-- 2026-03-26 | commit: b958375 | mir0n.the.programmer | Styled confirm/alert dialog replaces browser alert()/confirm() --
M	doc/release_notes.txt
M	frontend/src/esquire.ui/api/EsqExplorerCallApi.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.ts
A	frontend/src/esquire.ui/components/EsqConfirmDialog.html
A	frontend/src/esquire.ui/components/EsqConfirmDialog.ts
M	frontend/src/esquire.ui/components/EsqCreateEntityDialog.ts
M	frontend/src/esquire.ui/components/EsqDetailsDialog.scss
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
M	frontend/src/esquire.ui/components/public-api.ts
 11 files changed, 228 insertions(+), 40 deletions(-)

-- 2026-03-26 | commit: 01582af | mir0n.the.programmer | Create entity dialog, bypass error message to shell footer --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/api/EsqExplorerCallApi.ts
M	frontend/src/esquire.ui/api/EsqRestApi.ts
M	frontend/src/esquire.ui/changes.txt
A	frontend/src/esquire.ui/components/EsqCreateEntityDialog.ts
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
M	frontend/src/esquire.ui/components/EsqUtils.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.html
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.ts
M	frontend/src/explorer/flatTree/app-explorer.component.html
M	frontend/src/explorer/flatTree/app-explorer.component.ts
M	frontend/src/rest/api/esquire.service.ts
M	openapi-generate/esqEsquireApi.yaml
 16 files changed, 862 insertions(+), 11 deletions(-)

-- 2026-03-20 | commit: a150fac | mir0n.the.programmer |  tree auto refresh on update of important fields + few fixes --
M	doc/release_notes.txt
M	frontend/src/esquire.ui/api/EsqEntityDictionary.ts
M	frontend/src/esquire.ui/api/EsqExplorerCallApi.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqFlatTreeDatasource.ts
 9 files changed, 151 insertions(+), 23 deletions(-)

-- 2026-03-19 | commit: d269c73 | mir0n.the.programmer | Fix: Entity kind normalization --
M	doc/release_notes.txt
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
 3 files changed, 8 insertions(+)

-- 2026-03-16 | commit: 76b2e54 | mir0n.the.programmer | saving flag; subscribe cleanup --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.html
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.ts
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
M	frontend/src/explorer/flatTree/app-explorer.component.ts
 8 files changed, 45 insertions(+), 24 deletions(-)

-- 2026-03-10 | commit: 8741f63 | mir0n.the.programmer | debug skip flags for development testing, docs were drafted --
A	doc/fieldType.md
A	doc/permissions.md
M	doc/release_notes.txt
A	doc/validations.md
M	frontend/src/esquire.ui/api/EsqAccessProfile.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqUtils.ts
 7 files changed, 878 insertions(+)

-- 2026-03-09 | commit: 82f7b2c | mir0n.the.programmer | Race condition fixes --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-explorer.component.ts
 3 files changed, 31 insertions(+), 14 deletions(-)

-- 2026-03-06 | commit: f75faa2 | mir0n.the.programmer |  Server-side validation error handling; ikn-list refresh fix --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/api/ProblemDetail.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.html
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.ts
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqTabIknListComponent.ts
M	frontend/src/explorer/flatTree/app-explorer.component.ts
 9 files changed, 144 insertions(+), 46 deletions(-)

-- 2026-03-03 | commit: 112dbea | mir0n.the.programmer | Add/Remove roles; text field type --
M	doc/release_notes.txt
M	frontend/compose.yaml
M	frontend/public/assets/config.json
A	frontend/public/img/star.ico
A	frontend/public/img/tools.ico
M	frontend/src/esquire.ui/api/ProblemDetail.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqDetailsDialog.scss
M	frontend/src/esquire.ui/components/EsqTabFieldComponent.html
M	frontend/src/esquire.ui/components/EsqTabFieldComponent.ts
M	frontend/src/esquire.ui/components/EsqTabIknListComponent.html
M	frontend/src/esquire.ui/components/EsqTabIknListComponent.ts
M	frontend/src/esquire.ui/components/EsqTabListComponent.scss
M	frontend/src/esquire.ui/components/EsqUtils.ts
M	frontend/src/explorer/flatTree/app-explorer.component.ts
 15 files changed, 264 insertions(+), 42 deletions(-)

-- 2026-03-03 | commit: ccf7df2 | Alexander.Orlov | fix: disable checkLoginIframe for cross-port K8s deployment --
M	frontend/src/changes.txt
M	frontend/src/main.ts
 2 files changed, 8 insertions(+), 2 deletions(-)

-- 2026-03-02 | commit: 91ac685 | Alexander.Orlov | fix: Dockerfile COPY *.json destination must end with / --
M	frontend/Dockerfile
 1 file changed, 1 insertion(+), 1 deletion(-)

-- 2026-03-02 | commit: 5451da2 | Alexander.Orlov | Fix config property names to match RuntimeConfig interface --
M	frontend/public/assets/config.json
M	frontend/public/assets/config.json.template
 2 files changed, 6 insertions(+), 6 deletions(-)

-- 2026-03-01 | commit: face3e4 | mir0n.the.programmer | Wait for initial access profile load --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-explorer.component.html
M	frontend/src/explorer/flatTree/app-explorer.component.ts
 4 files changed, 13 insertions(+), 1 deletion(-)

-- 2026-03-01 | commit: 85700ec | mir0n.the.programmer | Date field type; null change-detection fix --
M	doc/release_notes.txt
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqDetailsDialog.scss
M	frontend/src/esquire.ui/components/EsqTabFieldComponent.html
M	frontend/src/esquire.ui/components/EsqTabFieldComponent.ts
M	frontend/src/esquire.ui/components/EsqUtils.ts
 6 files changed, 105 insertions(+), 13 deletions(-)

-- 2026-02-28 | commit: 1f3a132 | mir0n.the.programmer | Sub-entity rendering; dialog inheritance; tab restore --
M	doc/release_notes.txt
M	frontend/src/esquire.ui/api/EsqDictionaryApi.ts
M	frontend/src/esquire.ui/api/EsqObjectKindFactory.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.html
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.ts
M	frontend/src/esquire.ui/components/EsqDictionary.ts
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqTabFieldComponent.html
 12 files changed, 326 insertions(+), 234 deletions(-)

-- 2026-02-18 | commit: 4eb3ca4 | mir0n.the.programmer | Wire Save to REST --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/api/EsqAccessProfile.ts
M	frontend/src/esquire.ui/api/EsqRestApi.ts
M	frontend/src/esquire.ui/api/ProblemDetail.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.html
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.ts
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqSingleEntryDialog.html
M	frontend/src/esquire.ui/components/EsqTabFieldComponent.html
M	frontend/src/esquire.ui/components/EsqTabFieldComponent.ts
M	frontend/src/esquire.ui/components/EsqUtils.ts
A	frontend/src/esquire.ui/components/EsqValidationError.ts
M	frontend/src/explorer/flatTree/app-explorer.component.ts
M	frontend/src/rest/.openapi-generator/FILES
M	frontend/src/rest/api/esquire.service.ts
A	frontend/src/rest/model/esqEntity.ts
M	frontend/src/rest/model/models.ts
M	openapi-generate/esqEsquireApi.yaml
 24 files changed, 934 insertions(+), 99 deletions(-)

-- 2026-02-17 | commit: 2bbe2ab | mir0n.the.programmer | Editable fields and access profile permissions --
M	doc/release_notes.txt
M	frontend/src/changes.txt
A	frontend/src/esquire.ui/api/EsqAccessProfile.ts
M	frontend/src/esquire.ui/api/EsqContextMenuBuilder.ts
M	frontend/src/esquire.ui/api/EsqEntityDictionary.ts
M	frontend/src/esquire.ui/api/EsqExplorerCallApi.ts
M	frontend/src/esquire.ui/api/ProblemDetail.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.html
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.ts
M	frontend/src/esquire.ui/components/EsqDetailsDialog.scss
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqTabFieldComponent.html
M	frontend/src/esquire.ui/components/EsqTabFieldComponent.ts
M	frontend/src/esquire.ui/components/EsqTabIknListComponent.ts
M	frontend/src/esquire.ui/components/EsqTabListComponent.ts
M	frontend/src/esquire.ui/components/EsqTabStringComponent.html
M	frontend/src/esquire.ui/components/EsqTabStringComponent.ts
M	frontend/src/esquire.ui/components/EsqUtils.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.ts
M	frontend/src/explorer/flatTree/app-explorer.component.html
M	frontend/src/explorer/flatTree/app-explorer.component.ts
 26 files changed, 713 insertions(+), 127 deletions(-)

-- 2026-02-14 | commit: 7363e3a | mir0n.the.programmer | Clean Name convention: kind vs type --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/api/EsqContextMenuBuilder.ts
M	frontend/src/esquire.ui/api/EsqEntityDictionary.ts
R095	frontend/src/esquire.ui/api/EsqNodeType.ts	frontend/src/esquire.ui/api/EsqObjectKind.ts
R067	frontend/src/esquire.ui/api/EsqNodeTypeFactory.ts	frontend/src/esquire.ui/api/EsqObjectKindFactory.ts
M	frontend/src/esquire.ui/api/EsqTreeNode.ts
M	frontend/src/esquire.ui/api/EsqTreeNodeDto.ts
M	frontend/src/esquire.ui/api/public-api.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.ts
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqNodeDialog.html
M	frontend/src/esquire.ui/components/EsqTabFieldComponent.ts
M	frontend/src/esquire.ui/components/EsqTabIknListComponent.ts
M	frontend/src/esquire.ui/components/EsqTabIknfTableComponent.ts
M	frontend/src/esquire.ui/components/EsqTabListComponent.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.html
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqListViewDatasource.ts
M	frontend/src/explorer/flatTree/app-explorer.component.ts
 24 files changed, 200 insertions(+), 138 deletions(-)

-- 2026-02-13 | commit: cd11902 | mir0n.the.programmer | Refactoring/cleanup in progress --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/api/EsqTreeNode.ts
M	frontend/src/esquire.ui/api/EsqTreeNodeDto.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/explorer/flatTree/EsqTreeViewDatasource.ts
M	frontend/src/rest/model/esqTreeNode.ts
M	openapi-generate/esqEsquireApi.yaml
 8 files changed, 23 insertions(+), 15 deletions(-)

-- 2026-02-12 | commit: 4f1bf75 | mir0n.the.programmer | set of node types configured in server side, keeps ability to be defined/overwritten locally --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/api/EsqContextMenuBuilder.ts
A	frontend/src/esquire.ui/api/EsqNodeType.ts
M	frontend/src/esquire.ui/api/EsqNodeTypeFactory.ts
M	frontend/src/esquire.ui/api/EsqRestApi.ts
M	frontend/src/esquire.ui/api/EsqTreeNode.ts
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.ts
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqTabFieldComponent.ts
M	frontend/src/esquire.ui/components/EsqTabIknListComponent.ts
M	frontend/src/esquire.ui/components/EsqTabIknfTableComponent.html
M	frontend/src/esquire.ui/components/EsqTabIknfTableComponent.ts
M	frontend/src/esquire.ui/components/EsqTabListComponent.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.html
M	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.ts
M	frontend/src/esquire.ui/explorer/flatTree/EsqListViewDatasource.ts
M	frontend/src/explorer/flatTree/app-explorer.component.ts
M	frontend/src/rest/.openapi-generator/FILES
M	frontend/src/rest/api/esquire.service.ts
A	frontend/src/rest/model/esqColumnHeaderDef.ts
A	frontend/src/rest/model/esqObjectKind.ts
M	frontend/src/rest/model/models.ts
M	openapi-generate/esqEsquireApi.yaml
 25 files changed, 518 insertions(+), 99 deletions(-)

-- 2026-02-05 | commit: b131d1c | mir0n.the.programmer | generalization of dialogs : a common TabField component to handle any field type --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.html
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.ts
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqSingleEntryDialog.html
M	frontend/src/esquire.ui/components/EsqSingleEntryDialog.ts
A	frontend/src/esquire.ui/components/EsqTabFieldComponent.html
A	frontend/src/esquire.ui/components/EsqTabFieldComponent.ts
M	frontend/src/esquire.ui/components/EsqTabIknfTableComponent.html
M	frontend/src/explorer/flatTree/app-explorer.component.ts
 15 files changed, 232 insertions(+), 207 deletions(-)

-- 2026-02-04 | commit: c2c62f0 | mir0n.the.programmer | Preparing for dialog code generalization --
M	doc/release_notes.txt
M	frontend/src/changes.txt
M	frontend/src/esquire.ui/changes.txt
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.html
M	frontend/src/esquire.ui/components/EsqAccessProfileDialog.ts
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
M	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.html
M	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.ts
A	frontend/src/esquire.ui/components/EsqNodeDialog.html
A	frontend/src/esquire.ui/components/EsqNodeDialog.ts
M	frontend/src/esquire.ui/components/EsqTabIknListComponent.ts
M	frontend/src/esquire.ui/components/EsqTabIknfTableComponent.ts
M	frontend/src/explorer/flatTree/app-explorer.component.ts
M	frontend/src/rest/api/esquire.service.ts
M	frontend/src/rest/model/esqAccessProfile.ts
M	frontend/src/rest/model/esqPermission.ts
M	frontend/src/rest/model/esqRole.ts
M	frontend/src/rest/model/esqTreeNode.ts
M	openapi-generate/esqEsquireApi.yaml
 21 files changed, 478 insertions(+), 191 deletions(-)

-- 2026-02-02 | commit: 4733c2e | mir0n.the.programmer | "SysAdmin" and "Sys Admin-s" added --
M	doc/release_notes.txt
M	frontend/package.json
A	frontend/public/img/sysadmin.ico
M	frontend/src/changes.txt
M	frontend/src/explorer/flatTree/app-explorer.component.ts
 5 files changed, 35 insertions(+), 19 deletions(-)
```

---

## Files Modified

```
M	README.md
A	doc/e2e.todo.md
M	doc/release_notes.txt
A	doc/reports/report_v1.2.2.md
A	e2e-test/.env
A	e2e-test/.gitignore
A	e2e-test/e2e-test.bat
A	e2e-test/e2e-test.scope.md
A	e2e-test/helpers/auth.ts
A	e2e-test/helpers/tree.ts
A	e2e-test/package.json
A	e2e-test/playwright-report/--placeholder--
A	e2e-test/playwright.config.ts
A	e2e-test/test-results/.last-run.json
A	e2e-test/tests/01-prelogin.spec.ts
A	e2e-test/tests/02-login.spec.ts
A	e2e-test/tests/03-access-profile.spec.ts
A	e2e-test/tests/04-tree-load.spec.ts
A	e2e-test/tests/05-tree-navigation.spec.ts
A	e2e-test/tests/06-context-menu.spec.ts
A	e2e-test/tests/07-details.spec.ts
A	e2e-test/tests/08-new-entity.spec.ts
A	e2e-test/tests/09-move-entity.spec.ts
A	e2e-test/tests/10-delete-entity.spec.ts
A	e2e-test/tests/11-deposit.spec.ts
A	e2e-test/tests/12-withdrawal.spec.ts
A	e2e-test/tests/13-transfer.spec.ts
A	e2e-test/tests/14-error-handling.spec.ts
M	frontend/Dockerfile
A	frontend/Dockerfile.k8s
M	frontend/angular.json
M	frontend/compose.yaml
A	frontend/nginx.conf
M	frontend/package.json
M	frontend/public/assets/config.json
M	frontend/public/assets/config.json.template
A	frontend/public/googlecb109f50553030d1.html
A	frontend/public/img/$sign.ico
A	frontend/public/img/$transfer.ico
A	frontend/public/img/$withdraw.ico
A	frontend/public/img/ComponentModel.svg
A	frontend/public/img/og-banner.png
A	frontend/public/img/star.ico
A	frontend/public/img/sysadmin.ico
A	frontend/public/img/tools.ico
A	frontend/public/robots.txt
A	frontend/public/sitemap.xml
D	frontend/src/app/app.component.spec.ts
M	frontend/src/app/app.routes.ts
M	frontend/src/app/interceptor/rfc9457Interceptor.ts
M	frontend/src/changes.txt
D	frontend/src/esquire.ui/api/AsEsqTreeNodePipe.spec.ts
D	frontend/src/esquire.ui/api/AsEsqTreeNodePipe.ts
D	frontend/src/esquire.ui/api/EsqContextMenuBuilder.ts
D	frontend/src/esquire.ui/api/EsqDictionaryApi.ts
D	frontend/src/esquire.ui/api/EsqEntityDictionary.ts
D	frontend/src/esquire.ui/api/EsqExplorerCallApi.ts
D	frontend/src/esquire.ui/api/EsqNodeStatusFactory.ts
D	frontend/src/esquire.ui/api/EsqNodeTypeFactory.ts
D	frontend/src/esquire.ui/api/EsqRestApi.ts
D	frontend/src/esquire.ui/api/EsqTreeNode.ts
D	frontend/src/esquire.ui/api/EsqTreeNodeDto.ts
D	frontend/src/esquire.ui/api/ProblemDetail.ts
D	frontend/src/esquire.ui/api/ng-package.json
D	frontend/src/esquire.ui/api/public-api.ts
D	frontend/src/esquire.ui/changes.txt
D	frontend/src/esquire.ui/components/EsqAccessProfileDialog.html
D	frontend/src/esquire.ui/components/EsqAccessProfileDialog.ts
D	frontend/src/esquire.ui/components/EsqDetailsDialog.scss
D	frontend/src/esquire.ui/components/EsqDictionary.ts
D	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.html
D	frontend/src/esquire.ui/components/EsqEntityDetailsDialog.ts
D	frontend/src/esquire.ui/components/EsqExplorerCallApiMill.ts
D	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.html
D	frontend/src/esquire.ui/components/EsqNodeDetailsDialog.ts
D	frontend/src/esquire.ui/components/EsqResizeDirective.ts
D	frontend/src/esquire.ui/components/EsqSingleEntryDialog.html
D	frontend/src/esquire.ui/components/EsqSingleEntryDialog.ts
D	frontend/src/esquire.ui/components/EsqTabIknListComponent.html
D	frontend/src/esquire.ui/components/EsqTabIknListComponent.ts
D	frontend/src/esquire.ui/components/EsqTabIknfTableComponent.html
D	frontend/src/esquire.ui/components/EsqTabIknfTableComponent.ts
D	frontend/src/esquire.ui/components/EsqTabListComponent.html
D	frontend/src/esquire.ui/components/EsqTabListComponent.scss
D	frontend/src/esquire.ui/components/EsqTabListComponent.ts
D	frontend/src/esquire.ui/components/EsqTabStringComponent.html
D	frontend/src/esquire.ui/components/EsqTabStringComponent.scss
D	frontend/src/esquire.ui/components/EsqTabStringComponent.ts
D	frontend/src/esquire.ui/components/EsqUtils.ts
D	frontend/src/esquire.ui/components/ng-package.json
D	frontend/src/esquire.ui/components/public-api.ts
D	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.html
D	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.scss
D	frontend/src/esquire.ui/explorer/flatTree/EsqExplorerComponent.ts
D	frontend/src/esquire.ui/explorer/flatTree/EsqFlatTreeDatasource.ts
D	frontend/src/esquire.ui/explorer/flatTree/EsqListViewDatasource.ts
D	frontend/src/esquire.ui/explorer/flatTree/EsqTreeViewDatasource.ts
D	frontend/src/esquire.ui/explorer/flatTree/loading.16.gif
D	frontend/src/esquire.ui/explorer/flatTree/ng-package.json
D	frontend/src/esquire.ui/explorer/flatTree/public-api.ts
A	frontend/src/explorer/flatTree/acct/AcctOperation.ts
A	frontend/src/explorer/flatTree/acct/EsqAcctCommandHandler.ts
A	frontend/src/explorer/flatTree/acct/EsqAcctDialog.html
A	frontend/src/explorer/flatTree/acct/EsqAcctDialog.scss
A	frontend/src/explorer/flatTree/acct/EsqAcctDialog.ts
A	frontend/src/explorer/flatTree/acct/EsqAcctPicker.html
A	frontend/src/explorer/flatTree/acct/EsqAcctPicker.scss
A	frontend/src/explorer/flatTree/acct/EsqAcctPicker.ts
A	frontend/src/explorer/flatTree/acct/EsqSelectAcctDialog.scss
A	frontend/src/explorer/flatTree/acct/EsqSelectAcctDialog.ts
A	frontend/src/explorer/flatTree/acct/EsqSelectEntityDialog.html
A	frontend/src/explorer/flatTree/acct/EsqTransferDialog.html
A	frontend/src/explorer/flatTree/acct/EsqTransferDialog.ts
D	frontend/src/explorer/flatTree/app-explorer.component.html
D	frontend/src/explorer/flatTree/app-explorer.component.scss
D	frontend/src/explorer/flatTree/app-explorer.component.spec.ts
D	frontend/src/explorer/flatTree/app-explorer.component.ts
A	frontend/src/explorer/flatTree/app-shell.contants.ts
A	frontend/src/explorer/flatTree/app-shell.html
A	frontend/src/explorer/flatTree/app-shell.scss
A	frontend/src/explorer/flatTree/app-shell.ts
M	frontend/src/index.html
M	frontend/src/main.ts
M	frontend/src/rest/.openapi-generator/FILES
M	frontend/src/rest/api/esquire.service.ts
A	frontend/src/rest/model/acctTransactionRequest.ts
A	frontend/src/rest/model/acctTransactionSimple.ts
M	frontend/src/rest/model/esqAccessProfile.ts
A	frontend/src/rest/model/esqColumnHeaderDef.ts
A	frontend/src/rest/model/esqEntity.ts
M	frontend/src/rest/model/esqEntityField.ts
A	frontend/src/rest/model/esqObjectKind.ts
M	frontend/src/rest/model/esqPermission.ts
M	frontend/src/rest/model/esqRole.ts
M	frontend/src/rest/model/esqTreeNode.ts
M	frontend/src/rest/model/models.ts
M	frontend/src/styles.scss
A	frontend/src/test/group1/AcctOperation.spec.ts
A	frontend/src/test/group2/EsqAcctCommandHandler.spec.ts
A	frontend/src/test/group3/AppComponent.spec.ts
A	frontend/src/test/group3/ExplorerComponent.spec.ts
A	frontend/src/test/test.structure.md
M	openapi-generate/esqEsquireApi.yaml
 143 files changed, 21000 insertions(+), 5945 deletions(-)
```

---

*From `v1.2.1` till `v1.2.2`*
