/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JobStatus } from './JobStatus';
import type { PrinterStatus } from './PrinterStatus';
import type { StorageStatus } from './StorageStatus';
export type StatusResponse = {
    printer: PrinterStatus;
    job?: JobStatus;
    storage?: StorageStatus;
};

