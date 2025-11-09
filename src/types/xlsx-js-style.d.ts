declare module "xlsx-js-style" {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [key: string]: WorkSheet };
  }

  export interface WorkSheet {
    [key: string]: any;
  }

  export interface CellObject {
    t: string; // Type
    v: any; // Value
    r?: string; // Rich Text
    h?: string; // HTML
    w?: string; // Formatted text
    s?: any; // Style
  }

  export interface Range {
    s: { c: number; r: number };
    e: { c: number; r: number };
  }

  export interface Sheet2JSONOpts {
    raw?: boolean;
    range?: any;
    header?: "A" | number | string[];
    dateNF?: string;
    defval?: any;
    blankrows?: boolean;
  }

  export function read(data: any, opts?: any): WorkBook;
  export function readFile(filename: string, opts?: any): WorkBook;
  export function writeFile(wb: WorkBook, filename: string, opts?: any): void;
  export function write(wb: WorkBook, opts?: any): any;

  export const utils: {
    book_new(): WorkBook;
    book_append_sheet(wb: WorkBook, ws: WorkSheet, name?: string): void;
    json_to_sheet<T>(data: T[], opts?: Sheet2JSONOpts): WorkSheet;
    sheet_to_json<T>(sheet: WorkSheet, opts?: Sheet2JSONOpts): T[];
    aoa_to_sheet(data: any[][], opts?: any): WorkSheet;
  };
}
