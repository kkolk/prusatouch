/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PrinterStatus = {
    state?: PrinterStatus.state;
    temp_nozzle?: number;
    target_nozzle?: number;
    temp_bed?: number;
    target_bed?: number;
    axis_x?: number;
    axis_y?: number;
    axis_z?: number;
    flow?: number;
    speed?: number;
    fan_hotend?: number;
    fan_print?: number;
};
export namespace PrinterStatus {
    export enum state {
        IDLE = 'IDLE',
        BUSY = 'BUSY',
        PRINTING = 'PRINTING',
        PAUSED = 'PAUSED',
        FINISHED = 'FINISHED',
        STOPPED = 'STOPPED',
        ERROR = 'ERROR',
        ATTENTION = 'ATTENTION',
        READY = 'READY',
    }
}

