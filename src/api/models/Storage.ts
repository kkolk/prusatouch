/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Storage = {
    /**
     * Name of the storage, based on selected language
     */
    name?: string;
    /**
     * Storage source
     */
    type: Storage.type;
    /**
     * Path to storage (not display path)
     */
    path: string;
    /**
     * Size of all print files in bytes
     */
    print_files?: number;
    /**
     * Size of all system files in bytes
     */
    system_files?: number;
    /**
     * System free space in bytes
     */
    free_space?: number;
    /**
     * System total space in bytes
     */
    total_space?: number;
    /**
     * Whether the storage is available or not
     */
    available: boolean;
    /**
     * Whether the storage is read only
     */
    read_only?: boolean;
};
export namespace Storage {
    /**
     * Storage source
     */
    export enum type {
        LOCAL = 'LOCAL',
        SDCARD = 'SDCARD',
        USB = 'USB',
    }
}

