/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BedTempRequest } from '../models/BedTempRequest';
import type { ExtrudeRequest } from '../models/ExtrudeRequest';
import type { FileListResponse } from '../models/FileListResponse';
import type { HomeRequest } from '../models/HomeRequest';
import type { InfoResponse } from '../models/InfoResponse';
import type { JobResponse } from '../models/JobResponse';
import type { PrintheadMoveRequest } from '../models/PrintheadMoveRequest';
import type { RetractRequest } from '../models/RetractRequest';
import type { StatusResponse } from '../models/StatusResponse';
import type { StepperRequest } from '../models/StepperRequest';
import type { StorageResponse } from '../models/StorageResponse';
import type { ToolTempRequest } from '../models/ToolTempRequest';
import type { VersionResponse } from '../models/VersionResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Get version information
     * @returns VersionResponse Version info
     * @throws ApiError
     */
    public static getVersion(): CancelablePromise<VersionResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/version',
        });
    }
    /**
     * Get printer info
     * @returns InfoResponse Printer info
     * @throws ApiError
     */
    public static getInfo(): CancelablePromise<InfoResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/info',
        });
    }
    /**
     * Get printer status with telemetry
     * @returns StatusResponse Printer status
     * @throws ApiError
     */
    public static getStatus(): CancelablePromise<StatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/status',
        });
    }
    /**
     * Get current job
     * @returns JobResponse Current job information
     * @throws ApiError
     */
    public static getJob(): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/job',
        });
    }
    /**
     * Stop print job
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static stopJob(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/job/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Pause print job
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static pauseJob(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/job/{id}/pause',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Resume print job
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static resumeJob(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/job/{id}/resume',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Move printhead
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static movePrinthead(
        requestBody: PrintheadMoveRequest,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/printer/printhead',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `Printer busy or not ready`,
            },
        });
    }
    /**
     * Home printer axes
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static homeAxes(
        requestBody: HomeRequest,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/printer/home',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `Printer busy`,
            },
        });
    }
    /**
     * Enable or disable stepper motors
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static controlSteppers(
        requestBody: StepperRequest,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/printer/stepper',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Set nozzle temperature
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static setNozzleTemp(
        requestBody: ToolTempRequest,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/printer/tool',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `Printer busy`,
            },
        });
    }
    /**
     * Set bed temperature
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static setBedTemp(
        requestBody: BedTempRequest,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/printer/bed',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `Printer busy`,
            },
        });
    }
    /**
     * Extrude filament
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static extrudeFilament(
        requestBody: ExtrudeRequest,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/printer/tool/extrude',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `Nozzle too cold or printer busy`,
            },
        });
    }
    /**
     * Retract filament
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static retractFilament(
        requestBody: RetractRequest,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/printer/tool/retract',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `Nozzle too cold or printer busy`,
            },
        });
    }
    /**
     * Get available storage locations
     * @returns StorageResponse List of storages
     * @throws ApiError
     */
    public static getStorages(): CancelablePromise<StorageResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/storage',
        });
    }
    /**
     * Get file or folder info
     * @param storage Storage path (e.g., "local" or "usb")
     * @param path File or folder path
     * @returns FileListResponse File/folder info
     * @throws ApiError
     */
    public static getFiles(
        storage: string,
        path: string,
    ): CancelablePromise<FileListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/files/{storage}/{path}',
            path: {
                'storage': storage,
                'path': path,
            },
        });
    }
    /**
     * Start print from file
     * @param storage
     * @param path
     * @returns void
     * @throws ApiError
     */
    public static startPrint(
        storage: string,
        path: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/files/{storage}/{path}',
            path: {
                'storage': storage,
                'path': path,
            },
        });
    }
    /**
     * Delete file
     * @param storage
     * @param path
     * @returns void
     * @throws ApiError
     */
    public static deleteFile(
        storage: string,
        path: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/files/{storage}/{path}',
            path: {
                'storage': storage,
                'path': path,
            },
        });
    }
}
