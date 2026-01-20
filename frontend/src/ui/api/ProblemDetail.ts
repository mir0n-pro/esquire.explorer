/*
*  Esquire frameworks (tm)
*  Esquire Explorer
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
*/

import { EsqEntityLayer } from "@mir0n-pro/esquire.ui/api";

// rfc9457-problem.model.ts
export interface ProblemDetail {
  type: string;        // URI identifying the error type
  traceId: string;    // Correlation ID for backend logs
  title: string;       // Short, human-readable summary
  status: number;     // HTTP status code
  detail: string;     // Detailed, actionable explanation
  instance?: string;   // URI identifying the specific occurrence
  
  errors?: Array<{     // Common extension for validation errors
    name?: string;
    reason: string;
    pointer?: string;  // JSON Pointer to the invalid field
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
        nullable: false, layer: 0, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: ''
      },
      {
        name: "title", sort: 1, label: "title", type: "string", tooltip: "Short, human-readable summary",
        nullable: false, layer: 0, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: ''
      },
      {
        name: "type", sort: 2, label: "type", type: "string", tooltip: "URI identifying the error type",
        nullable: false, layer: 0, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: ''
      },
      {
        name: "traceId", sort: 3, label: "traceId", type: "string", tooltip: "A cross-system trace ID",
        nullable: false, layer: 0, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: ''
      },
  ]},
  { title: "Details",
    fields: [
      {
        name: "detail", sort: 0, label: "detail", type: "string", tooltip: "Detailed, actionable explanation",
        nullable: false, layer: 1, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: ''
      },
      {
        name: "instance", sort: 1, label: "instance", type: "string", tooltip: "URI identifying the specific occurrence",
        nullable: false, layer: 1, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: ''
      },
      {
        name: "timestamp", sort: 2, label: "timestamp", type: "string", tooltip: "Error timestamp in UTC timezone",
        nullable: false, layer: 1, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: ''
      },
      {
        name: "requestId", sort: 3, label: "requestId", type: "string", tooltip: "End-client request ID",
        nullable: false, layer: 1, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: ''
      },
      {
        name: "correlationId", sort: 4, label: "correlationId", type: "string", tooltip: "Server internal correlation ID",
        nullable: false, layer: 1, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: ''
      },
      {
        name: "processingTime", sort: 5, label: "processingTime", type: "string", tooltip: "Only for Gateway errors: Total time the system spent on the request before the error occurred",
        nullable: false, layer: 1, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: ''
      },
  ]},
  { title: "Stack Trace",
    fields: [
      {
        name: "stackTrace", sort: 0, label: "Stack Trace", type: "tabstring", tooltip: "Root cause stack trace.",
        nullable: false, layer: 2, readwrite: 1, format: "",
        listvalues: [], nullmeaning: '', validation: ''
      },
  ]}
] as const;

