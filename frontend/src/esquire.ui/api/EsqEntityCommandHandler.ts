/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/01/2026 mir0n  initial: command handler interface and context type for calle() refactoring
*/
import { MatDialog } from '@angular/material/dialog';
import { EsqRestApi } from './EsqRestApi';
import { EsqDictionaryApi } from './EsqDictionaryApi';
import { EsqExplorerCallApi, EsqExplorerHost } from './EsqExplorerCallApi';
import { EsqAccessProfile } from './EsqAccessProfile';
import { EsqTreeNode } from './EsqTreeNode';

export enum SelectMode {
    None       = 0,  // no refresh, no select
    Refresh    = 1,  // refresh tree, no select
    SelectTree = 2,  // refresh + select entity in tree
    SelectList = 3,  // refresh + select entity in list
}

/**
 * Context object passed to entity command handlers (calle() path)
 */
export interface EsqEntityCommandContext {
  // Command parameters
  cmd: string;
  subCmd: string|null;
  entityId: string;
  entityName: string;
  entityKind: number;
  accessProfile: EsqAccessProfile | null;
  selectMode: SelectMode;

  // Service dependencies
  dialog: MatDialog;
  restApi: EsqRestApi;
  dictionaryApi: EsqDictionaryApi;
  callApi: EsqExplorerCallApi;
  host?: EsqExplorerHost;
  userId: string;
}

/**
 * Context object passed to node command handlers (call() path)
 */
export interface EsqNodeCommandContext {
  // Command parameters
  cmd: string;
  subCmd: string|null;
  node: EsqTreeNode;
  accessProfile: EsqAccessProfile | null;
  selectMode: SelectMode;

  // Service dependencies
  dialog: MatDialog;
  restApi: EsqRestApi;
  dictionaryApi: EsqDictionaryApi;
  callApi: EsqExplorerCallApi;
  host?: EsqExplorerHost;
  userId: string;
}

/**
 * Interface for entity command handlers
 * Handlers process both call() and calle() commands dispatched through EsqExplorerCallApiMill
 */
export interface EsqEntityCommandHandler {
  /**
   * Check if this handler can process the given command
   */
  canHandle(cmd: string): boolean;

  /**
   * Execute the command with node-based context (from call())
   */
  executeWithNode(context: EsqNodeCommandContext): Promise<void>;

  /**
   * Execute the command with entity-based context (from calle())
   */
  executeWithEntity(context: EsqEntityCommandContext): Promise<void>;
}
