/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
* 04/01/2026 mir0n  initial: command handler registry for calle() dispatcher
*                   added confirmNotImplemented callback for unregistered commands
*/
import { EsqEntityCommandHandler, EsqEntityCommandContext, EsqNodeCommandContext } from '../../api/EsqEntityCommandHandler';

/**
 * Registry for entity command handlers
 * Manages handler registration and command dispatching
 */
export class EsqCommandHandlerRegistry {
  private handlers: EsqEntityCommandHandler[] = [];
  private confirmNotImplemented?: (cmd: string) => Promise<void>;

  /**
   * Set callback for handling unregistered commands
   */
  setNotImplementedHandler(callback: (cmd: string) => Promise<void>): void {
    this.confirmNotImplemented = callback;
  }

  /**
   * Register a command handler
   * Handlers are checked in registration order
   */
  register(handler: EsqEntityCommandHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Find the first handler that can process the command
   */
  findHandler(cmd: string): EsqEntityCommandHandler | undefined {
    return this.handlers.find(h => h.canHandle(cmd));
  }

  /**
   * Execute command with node context (from call())
   * Shows "Not implemented" dialog if no handler found
   */
  async executeWithNode(cmd: string, context: EsqNodeCommandContext): Promise<void> {
    var handler = this.findHandler(cmd);
    if (!handler) {
      if (this.confirmNotImplemented) {
        await this.confirmNotImplemented(cmd);
      } else {
        throw new Error(`No handler registered for command: ${cmd}`);
      }
      return;
    }
    return handler.executeWithNode(context);
  }

  /**
   * Execute command with entity context (from calle())
   * Shows "Not implemented" dialog if no handler found
   */
  async executeWithEntity(cmd: string, context: EsqEntityCommandContext): Promise<void> {
    var handler = this.findHandler(cmd);
    if (!handler) {
      if (this.confirmNotImplemented) {
        await this.confirmNotImplemented(cmd);
      } else {
        throw new Error(`No handler registered for command: ${cmd}`);
      }
      return;
    }
    return handler.executeWithEntity(context);
  }
}
