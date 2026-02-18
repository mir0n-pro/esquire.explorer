
/*
*  Esquire frameworks (tm)
* 
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 02/17/2026 mir0n added formatNumber and parseNumber static methods
*/
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

}
