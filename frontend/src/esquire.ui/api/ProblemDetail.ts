/*
*  Esquire frameworks (tm)
*  Esquire Explorer
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 02/17/2026 mir0n nullable changed from boolean to string
*                  added personal, minmax fields to dictionary
* 03/03/2026 mir0n  title and detail field types changed from 'string' to 'text'
* 03/06/2026 mir0n  errors[] shape updated to match backend EsqValidationError payload
*                   added "Validation Errors" tab with errors field (tabstring, nullable)
*/

import { EsqEntityLayer } from "./EsqEntityDictionary";

// rfc9457-problem.model.ts
export interface ProblemDetail {
  type: string;        // URI identifying the error type
  traceId: string;    // Correlation ID for backend logs
  title: string;       // Short, human-readable summary
  status: number;     // HTTP status code
  detail: string;     // Detailed, actionable explanation
  instance?: string;   // URI identifying the specific occurrence
  
  errors?: Array<{     // EsqValidationError entries from backend
    fieldName: string;
    fieldLabel: string;
    message: string;
    tabIndex: string;  // tab index as string from backend
  }>

  timestamp?:string;
  requestId?:string;
  correlationId?:string;
  processingTime?:string;
  stackTrace?:string;
}

export const problemDetailDictionary:EsqEntityLayer[] = [
  { title: "Generic",
    fields: [
      {
        name: "status", sort: 0, label: "status", type: "string", tooltip: "HTTP status code",
        nullable: 'N', layer: 0, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: '', personal: '', minmax:''
      },
      {
        name: "title", sort: 1, label: "title", type: "text", tooltip: "Short, human-readable summary",
        nullable: 'N', layer: 0, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: '', personal: '', minmax:'100'
      },
      {
        name: "type", sort: 2, label: "type", type: "string", tooltip: "URI identifying the error type",
        nullable: 'N', layer: 0, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: '', personal: '', minmax:''
      },
      {
        name: "traceId", sort: 3, label: "traceId", type: "string", tooltip: "A cross-system trace ID",
        nullable: 'N', layer: 0, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: '', personal: '', minmax:''
      },
  ]},
  { title: "Details",
    fields: [
      {
        name: "detail", sort: 0, label: "detail", type: "text", tooltip: "Detailed, actionable explanation",
        nullable: 'N', layer: 1, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: '', personal: '', minmax:'200'
      },
      {
        name: "instance", sort: 1, label: "instance", type: "string", tooltip: "URI identifying the specific occurrence",
        nullable: 'N', layer: 1, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: '', personal: '', minmax:''
      },
      {
        name: "timestamp", sort: 2, label: "timestamp", type: "string", tooltip: "Error timestamp in UTC timezone",
        nullable: 'N', layer: 1, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: '', personal: '', minmax:''
      },
      {
        name: "requestId", sort: 3, label: "requestId", type: "string", tooltip: "End-client request ID",
        nullable: 'N', layer: 1, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: '', personal: '', minmax:''
      },
      {
        name: "correlationId", sort: 4, label: "correlationId", type: "string", tooltip: "Server internal correlation ID",
        nullable: 'N', layer: 1, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: '', personal: '', minmax:''
      },
      {
        name: "processingTime", sort: 5, label: "processingTime", type: "string", tooltip: "Only for Gateway errors: Total time the system spent on the request before the error occurred",
        nullable: 'N', layer: 1, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: '', personal: '', minmax:''
      },
  ]},
  { title: "Stack Trace",
    fields: [
      {
        name: "stackTrace", sort: 0, label: "Stack Trace", type: "tabstring", tooltip: "Root cause stack trace.",
        nullable: 'N', layer: 2, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: '', personal: '', minmax:''
      },
  ]},
    { title: "Errors",
        fields: [
            {
                name: "errors", sort: 0, label: "Errors", type: "tabstring", tooltip: "Validation errors in raw format.",
                nullable: 'y', layer: 3, readwrite: 1, format: "",
                listvalues: [], nullmeaning: '', validation: '', personal: '', minmax:''
            },
        ]}
] as const;

