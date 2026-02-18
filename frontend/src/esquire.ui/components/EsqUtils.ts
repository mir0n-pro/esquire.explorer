
/*
*  Esquire frameworks (tm)
* 
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 02/17/2026 mir0n added formatNumber and parseNumber static methods
*                  added validateFields for Save validation
*                  added deepCopy, getChangedFields methods
*/
import {EsqEntityLayer} from 'src/esquire.ui/api/EsqEntityDictionary';
import {EsqValidationError} from './EsqValidationError';
export class EsqUtils {
 public static DEBUG:boolean = false;
 public static DELAY:boolean = false;
  private constructor () {}

  public static log(...par:any) {
    if (this.DEBUG) {
      console.log(...par);
    }
  }

  public static async logDelay(ms:number,...par:any): Promise<void> {
    if (this.DEBUG) {
      console.log(...par);
    }
    if (this.DELAY) {
      await this.delay(ms);
    }
  }
  
  public static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format number using pattern string.
   * # = optional digit, 0 = required digit, , = use thousand separators
   * Examples: #,##0.## (default), #,##0.00, 0, 0.00, #,##0.####
   */
  public static formatNumber(value: any, format?: string): string {
    if (value == null || value === '') return '';
    const num = Number(value);
    if (isNaN(num)) return String(value);

    const fmt = format || '#,##0.##';
    const useGrouping = fmt.includes(',');
    const dotIndex = fmt.indexOf('.');
    let minDecimals = 0;
    let maxDecimals = 0;

    if (dotIndex >= 0) {
      const decimalPart = fmt.substring(dotIndex + 1);
      maxDecimals = decimalPart.length;
      minDecimals = (decimalPart.match(/0/g) || []).length;
    }

    return num.toLocaleString('en-US', {
      useGrouping: useGrouping,
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals
    });
  }

  public static parseNumber(formatted: string): number | null {
    if (!formatted) return null;
    const cleaned = formatted.replace(/,/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  }

  public static validateFields(details: any, dictionary: EsqEntityLayer[]): EsqValidationError | null {
    var ret: EsqValidationError | null = null;
    for (var tabIndex = 0; tabIndex < dictionary.length && !ret; tabIndex++) {
      var tab = dictionary[tabIndex];
      for (var fi = 0; fi < tab.fields.length && !ret; fi++) {
        var field = tab.fields[fi];
        if (field.readwrite < 3) {
          continue;
        }
        var value = details[field.name];
        // required: non-nullable fields must have a value
        if (field.nullable !== 'Y') {
          if (value == null || value === '') {
            ret = { fieldName: field.name, fieldLabel: field.label, message: field.label + ' is required', tabIndex: tabIndex };
          }
        }
        // string pattern validation
        if (!ret && field.validation && (field.type === 'string' || field.type === 'String')) {
          if (value != null && value !== '') {
            var regex = new RegExp(field.validation);
            if (!regex.test(value)) {
              ret = { fieldName: field.name, fieldLabel: field.label, message: field.label + ' has invalid format', tabIndex: tabIndex };
            }
          }
        }
        // number min/max validation
        if (!ret && field.type === 'number' && field.minmax && field.minmax.includes(',')) {
          if (value != null && value !== '') {
            var parts = field.minmax.split(',');
            var min = Number(parts[0]);
            var max = Number(parts[1]);
            var num = Number(value);
            if (!isNaN(num) && (num < min || num > max)) {
              ret = { fieldName: field.name, fieldLabel: field.label, message: field.label + ' must be between ' + min + ' and ' + max, tabIndex: tabIndex };
            }
          }
        }
      }
    }
    return ret;
  }

  public static deepCopy(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  public static getChangedFields(original: any, current: any): Record<string, any> | null {
    if (!original || !current) return null;
    var changes: Record<string, any> = {};
    var hasChanges: boolean = false;
    for (var key in current) {
      if (current.hasOwnProperty(key)) {
        var origVal = original[key];
        var currVal = current[key];
        if (typeof currVal !== 'object' && origVal !== currVal) {
          changes[key] = currVal;
          hasChanges = true;
        }
      }
    }
    return hasChanges ? changes : null;
  }

}
