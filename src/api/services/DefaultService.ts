/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Camera } from '../models/Camera';
import type { CameraConfig } from '../models/CameraConfig';
import type { CameraConfigSet } from '../models/CameraConfigSet';
import type { FileInfo } from '../models/FileInfo';
import type { FirmwareFileInfo } from '../models/FirmwareFileInfo';
import type { FolderInfo } from '../models/FolderInfo';
import type { Info } from '../models/Info';
import type { Job } from '../models/Job';
import type { PrintFileInfo } from '../models/PrintFileInfo';
import type { PrusaLinkPackage } from '../models/PrusaLinkPackage';
import type { StatusCamera } from '../models/StatusCamera';
import type { StatusJob } from '../models/StatusJob';
import type { StatusPrinter } from '../models/StatusPrinter';
import type { StatusStorage } from '../models/StatusStorage';
import type { StatusTransfer } from '../models/StatusTransfer';
import type { Storage } from '../models/Storage';
import type { Transfer } from '../models/Transfer';
import type { Version } from '../models/Version';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * api version information
     * @returns Version OK
     * @throws ApiError
     */
    public static getApiVersion(): CancelablePromise<Version> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/version',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * printer information
     * @returns Info OK
     * @throws ApiError
     */
    public static getApiV1Info(): CancelablePromise<Info> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/info',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * printer, job and transfer telemetry info
     * All values except printer are optional
     * @returns any OK
     * @throws ApiError
     */
    public static getApiV1Status(): CancelablePromise<{
        job?: StatusJob;
        printer: StatusPrinter;
        transfer?: StatusTransfer;
        storage?: StatusStorage;
        camera?: StatusCamera;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/status',
        });
    }
    /**
     * job info
     * Returns info about current job
     * @returns Job OK
     * @throws ApiError
     */
    public static getApiV1Job(): CancelablePromise<Job> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/job',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * stop job
     * Stop job with given id
     * @param id job id
     * @returns void
     * @throws ApiError
     */
    public static deleteApiV1Job(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/job/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * pause job
     * Pause job with given id
     * @param id job id
     * @returns void
     * @throws ApiError
     */
    public static putApiV1JobPause(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/job/{id}/pause',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * resume job
     * Resume job with given id
     * @param id job id
     * @returns void
     * @throws ApiError
     */
    public static putApiV1JobResume(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/job/{id}/resume',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * continue job
     * Continue in job with given id after timelapse capture
     * @param id job id
     * @returns void
     * @throws ApiError
     */
    public static putApiV1JobContinue(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/job/{id}/continue',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * storage info
     * Returns info about each available file storage (e.g. SD Card or local storage)
     * @param acceptLanguage Defines a language of the response
     * @returns any OK
     * @throws ApiError
     */
    public static getApiV1Storage(
        acceptLanguage?: string,
    ): CancelablePromise<{
        storage_list?: Array<Storage>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/storage',
            headers: {
                'Accept-Language': acceptLanguage,
            },
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * transfer info
     * Returns info about current transfer
     * @returns Transfer OK
     * @throws ApiError
     */
    public static getApiV1Transfer(): CancelablePromise<Transfer> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/transfer',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * stop transfer
     * Stop transfer with given id
     * @param id transfer id
     * @returns void
     * @throws ApiError
     */
    public static deleteApiV1Transfer(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/transfer/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * File or folder metadata
     * @param storage The target storage
     * @param path Path to the file
     * @param acceptLanguage Defines a language of the response
     * @param accept Preferred content-type of response - application/json or text/html, all other are returned as text/plain
     * @returns any OK
     * @throws ApiError
     */
    public static getApiV1Files(
        storage: string,
        path: string,
        acceptLanguage?: string,
        accept: string = 'text/plain',
    ): CancelablePromise<(FileInfo | PrintFileInfo | FirmwareFileInfo | FolderInfo)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/files/{storage}/{path}',
            path: {
                'storage': storage,
                'path': path,
            },
            headers: {
                'Accept-Language': acceptLanguage,
                'Accept': accept,
            },
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * upload file or create folder
     * @param storage The target storage
     * @param path Path to the file
     * @param acceptLanguage Defines a language of the response
     * @param accept Preferred content-type of response - application/json or text/html, all other are returned as text/plain
     * @param contentLength Length of file to upload
     * @param contentType Type of uploaded media
     * @param printAfterUpload Whether to start printing the file after upload
     * @param overwrite Whether to overwrite already existing files
     * @param requestBody
     * @returns any Created
     * @throws ApiError
     */
    public static putApiV1Files(
        storage: string,
        path: string,
        acceptLanguage?: string,
        accept: string = 'text/plain',
        contentLength?: number,
        contentType: string = 'application/octet-stream',
        printAfterUpload: '?0' | '?1' = '?0',
        overwrite: '?0' | '?1' = '?0',
        requestBody?: Blob,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/files/{storage}/{path}',
            path: {
                'storage': storage,
                'path': path,
            },
            headers: {
                'Accept-Language': acceptLanguage,
                'Accept': accept,
                'Content-Length': contentLength,
                'Content-Type': contentType,
                'Print-After-Upload': printAfterUpload,
                'Overwrite': overwrite,
            },
            body: requestBody,
            mediaType: 'application/octet-stream',
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * Start print of file if there's no print job running
     * Body is ignored
     * @param storage The target storage
     * @param path Path to the file
     * @param acceptLanguage Defines a language of the response
     * @param accept Preferred content-type of response - application/json or text/html, all other are returned as text/plain
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiV1Files(
        storage: string,
        path: string,
        acceptLanguage?: string,
        accept: string = 'text/plain',
        requestBody?: any,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/files/{storage}/{path}',
            path: {
                'storage': storage,
                'path': path,
            },
            headers: {
                'Accept-Language': acceptLanguage,
                'Accept': accept,
            },
            body: requestBody,
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * file presence and state check
     * @param storage The target storage
     * @param path Path to the file
     * @param acceptLanguage Defines a language of the response
     * @param accept Preferred content-type of response - application/json or text/html, all other are returned as text/plain
     * @returns string OK
     * @throws ApiError
     */
    public static headApiV1Files(
        storage: string,
        path: string,
        acceptLanguage?: string,
        accept: string = 'text/plain',
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/api/v1/files/{storage}/{path}',
            path: {
                'storage': storage,
                'path': path,
            },
            headers: {
                'Accept-Language': acceptLanguage,
                'Accept': accept,
            },
            responseHeader: 'Read-Only',
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * Delete a file or folder
     * @param storage The target storage
     * @param path Path to the file
     * @param acceptLanguage Defines a language of the response
     * @param accept Preferred content-type of response - application/json or text/html, all other are returned as text/plain
     * @param force Whether to force delete non-empty folder
     * @returns void
     * @throws ApiError
     */
    public static deleteApiV1Files(
        storage: string,
        path: string,
        acceptLanguage?: string,
        accept: string = 'text/plain',
        force: '?0' | '?1' = '?0',
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/files/{storage}/{path}',
            path: {
                'storage': storage,
                'path': path,
            },
            headers: {
                'Accept-Language': acceptLanguage,
                'Accept': accept,
                'Force': force,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * Get a list of active cameras and its properties
     * @returns Camera OK
     * @throws ApiError
     */
    public static getApiV1Cameras(): CancelablePromise<Array<Camera>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/cameras',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * List of cameras in intended order
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static putApiV1Cameras(
        requestBody?: Array<string>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/cameras',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Get current settings and properties of specific camera
     * @param id ID of the camera
     * @returns CameraConfig OK
     * @throws ApiError
     */
    public static getApiV1Cameras1(
        id: string,
    ): CancelablePromise<CameraConfig> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/cameras/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Setup a new camera or fix a broken one
     * @param id ID of the camera
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiV1Cameras(
        id: string,
        requestBody?: CameraConfigSet,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/cameras/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Delete a camera
     * @param id ID of the camera
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiV1Cameras(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/cameras/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Return a captured image from the default camera
     * @returns binary OK
     * @throws ApiError
     */
    public static getApiV1CamerasSnap(): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/cameras/snap',
            errors: {
                304: `Not Modified`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Return a captured image from the camera with a given id
     * @param id ID of the camera
     * @returns binary OK
     * @throws ApiError
     */
    public static getApiV1CamerasSnap1(
        id: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/cameras/{id}/snap',
            path: {
                'id': id,
            },
            errors: {
                304: `Not Modified`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Make a snapshot with the camera
     * Can be manually done only during camera initialization or in manual mode
     * @param id ID of the camera
     * @param requestBody
     * @returns binary OK
     * @throws ApiError
     */
    public static postApiV1CamerasSnap(
        id: string,
        requestBody?: any,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/cameras/{id}/snap',
            path: {
                'id': id,
            },
            body: requestBody,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                408: `Request Timeout`,
                409: `Conflict`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Set new settings to a working camera
     * @param id ID of the camera
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static patchApiV1CamerasConfig(
        id: string,
        requestBody?: CameraConfigSet,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/cameras/{id}/config',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Reset settings of a camera
     * @param id ID of the camera
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiV1CamerasConfig(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/cameras/{id}/config',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Register a camera to Connect
     * @param id ID of the camera
     * @returns any OK
     * @throws ApiError
     */
    public static postApiV1CamerasConnection(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/cameras/{id}/connection',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                408: `Request Timeout`,
                409: `Conflict`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Un-register a camera from Connect
     * @param id ID of the camera
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiV1CamerasConnection(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/cameras/{id}/connection',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Retrieve information about available update of given environment
     * @param env The target environment (prusalink or system) for update
     * @returns any OK
     * @throws ApiError
     */
    public static getApiV1Update(
        env: 'prusalink',
    ): CancelablePromise<PrusaLinkPackage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/update/{env}',
            path: {
                'env': env,
            },
            errors: {
                401: `Unauthorized`,
                409: `Bad Request`,
            },
        });
    }
    /**
     * Update given environment
     * @param env The target environment (prusalink or system) for update
     * @returns any OK
     * @throws ApiError
     */
    public static postApiV1Update(
        env: 'prusalink',
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/update/{env}',
            path: {
                'env': env,
            },
            errors: {
                401: `Unauthorized`,
                409: `Bad Request`,
            },
        });
    }
    /**
     * Control printhead movement in XYZ axes
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiPrinterPrinthead(
        requestBody?: {
            jog?: {
                command?: string;
                'x'?: number;
                'y'?: number;
                'z'?: number;
            };
            home?: {
                command?: string;
                axes?: Array<string>;
            };
            speed?: {
                command?: string;
                factor?: number;
            };
            feedrate?: {
                command?: string;
                factor?: number;
            };
            disable_steppers?: {
                command?: string;
            };
        },
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/printer/printhead',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * Control extruder
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiPrinterTool(
        requestBody?: {
            target?: {
                command?: string;
                targets?: {
                    tool0?: number;
                };
            };
            offset?: {
                command?: string;
                offsets?: {
                    tool0?: number;
                };
            };
            select?: {
                command?: string;
                tool?: string;
            };
            extrude?: {
                command?: string;
                amount?: number;
            };
            retract?: {
                command?: string;
                amount?: number;
            };
            flowrate?: {
                command?: string;
                amount?: number;
            };
        },
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/printer/tool',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * Control bed temperature
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiPrinterBed(
        requestBody?: {
            command?: string;
            target?: number;
        },
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/printer/bed',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
}
