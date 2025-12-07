/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FileInfo = {
    name?: string;
    display_name?: string;
    path?: string;
    size?: number;
    m_timestamp?: number;
    type?: FileInfo.type;
    refs?: {
        download?: string;
        icon?: string;
        thumbnail?: string;
    };
};
export namespace FileInfo {
    export enum type {
        FOLDER = 'FOLDER',
        PRINT_FILE = 'PRINT_FILE',
        FILE = 'FILE',
        FIRMWARE = 'FIRMWARE',
        MOUNT = 'MOUNT',
    }
}

