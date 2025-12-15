/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BedOffsetCommand } from '../models/BedOffsetCommand';
import type { BedTargetCommand } from '../models/BedTargetCommand';
import type { Camera } from '../models/Camera';
import type { CameraConfig } from '../models/CameraConfig';
import type { CameraConfigSet } from '../models/CameraConfigSet';
import type { FileInfo } from '../models/FileInfo';
import type { FirmwareFileInfo } from '../models/FirmwareFileInfo';
import type { FolderInfo } from '../models/FolderInfo';
import type { Info } from '../models/Info';
import type { Job } from '../models/Job';
import type { PrintFileInfo } from '../models/PrintFileInfo';
import type { PrintheadDisableSteppersCommand } from '../models/PrintheadDisableSteppersCommand';
import type { PrintheadFeedrateCommand } from '../models/PrintheadFeedrateCommand';
import type { PrintheadHomeCommand } from '../models/PrintheadHomeCommand';
import type { PrintheadJogCommand } from '../models/PrintheadJogCommand';
import type { PrintheadSpeedCommand } from '../models/PrintheadSpeedCommand';
import type { PrusaLinkPackage } from '../models/PrusaLinkPackage';
import type { StatusCamera } from '../models/StatusCamera';
import type { StatusJob } from '../models/StatusJob';
import type { StatusPrinter } from '../models/StatusPrinter';
import type { StatusStorage } from '../models/StatusStorage';
import type { StatusTransfer } from '../models/StatusTransfer';
import type { Storage } from '../models/Storage';
import type { ToolExtrudeCommand } from '../models/ToolExtrudeCommand';
import type { ToolFlowrateCommand } from '../models/ToolFlowrateCommand';
import type { ToolOffsetCommand } from '../models/ToolOffsetCommand';
import type { ToolSelectCommand } from '../models/ToolSelectCommand';
import type { ToolTargetCommand } from '../models/ToolTargetCommand';
import type { Transfer } from '../models/Transfer';
import type { Version } from '../models/Version';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Get API version information
     * Returns version information for PrusaLink API and firmware.
     *
     * **Use Cases:**
     * - Initial connection: Verify API compatibility
     * - Feature detection: Check capabilities field
     * - Debug logging: Include version info in bug reports
     *
     * **Polling:** This is static information. Only fetch once on app startup.
     *
     * **Note:** No authentication required for this endpoint.
     *
     * @returns Version Version information retrieved successfully
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
     * Get printer information
     * Returns static information about the printer hardware and configuration.
     *
     * **Information Includes:**
     * - Printer name and model (e.g., "Original Prusa MK3S+")
     * - Serial number
     * - Network information (hostname, IP)
     * - SD card presence
     * - MMU (multi-material unit) status
     *
     * **Use Cases:**
     * - Display printer name in UI header
     * - Identify printer in multi-printer setup
     * - Feature detection (MMU, SD card support)
     *
     * **Polling:** This is mostly static. Only fetch once on app startup, or when
     * configuration might change (rare).
     *
     * **Note:** Serial number should not be displayed publicly for privacy reasons.
     *
     * @returns Info Printer information retrieved successfully
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
     * Get complete printer status (telemetry)
     * Returns real-time status of printer, including temperatures, position,
     * current job progress, and file transfers.
     *
     * **This is the PRIMARY POLLING ENDPOINT** for live printer monitoring.
     *
     * **Status Includes:**
     * - **printer** (required): State, temps (nozzle/bed), axis positions, fan speed
     * - **job** (optional): Current job progress, time remaining, file being printed
     * - **transfer** (optional): File upload/download progress
     * - **storage** (optional): Storage space usage
     * - **camera** (optional): Camera status if available
     *
     * **Adaptive Polling Strategy (CRITICAL for performance):**
     * - **Printing:** Poll every 2000ms (2 seconds) for smooth progress updates
     * - **Idle:** Poll every 5000ms (5 seconds) to conserve CPU
     * - **Offline:** Stop polling, retry connection every 5s
     *
     * **Connection Handling:**
     * - First failure: Silent retry after 1s
     * - Second failure: Retry after 2s, show toast notification
     * - Third failure: Show "PrusaLink Offline" banner, stop polling
     * - Recovery: Auto-resume polling when connection restored
     *
     * **Temperature Fields:**
     * - All temperatures in Celsius (°C)
     * - Accuracy: ±1°C typical
     * - `actual`: Current measured temperature
     * - `target`: Desired temperature (0 = heater off)
     *
     * **Position Fields:**
     * - All positions in millimeters (mm)
     * - Only available when printer is idle (not moving)
     * - May be null during printing or movement
     *
     * **Performance Note:** This endpoint is called frequently. Optimize parsing
     * and state updates on client side.
     *
     * @returns any Status retrieved successfully
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
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Get current job information
     * Returns information about the currently active print job, if any.
     *
     * **Job States:**
     * - `IDLE`: No job active
     * - `PRINTING`: Job is actively printing
     * - `PAUSED`: Job is paused
     * - `FINISHED`: Job completed successfully
     * - `STOPPED`: Job was cancelled/stopped
     * - `ERROR`: Job failed with error
     *
     * **Polling:** Client should poll this endpoint every 2-5 seconds while job is active
     * to get updated progress, time remaining, and state.
     *
     * **Returns 204 (No Content)** when no job is active.
     *
     * @returns Job Job information retrieved successfully
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
     * Stop/cancel print job
     * Immediately stops and cancels the print job with the specified ID.
     *
     * **Behavior:**
     * - Stops all movement and heating
     * - Retracts filament (if configured)
     * - Job state transitions to `STOPPED`
     * - Cannot be resumed after stopping
     *
     * **State Requirements:**
     * - Job must be in `PRINTING` or `PAUSED` state
     * - Returns 409 Conflict if job is already finished or stopped
     *
     * **Safety Note:** This is a destructive operation. Always prompt user for
     * confirmation before calling.
     *
     * @param id Unique job identifier
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
                409: `Conflict - Job cannot be stopped (wrong state)`,
            },
        });
    }
    /**
     * Pause print job
     * Pauses the active print job, allowing it to be resumed later.
     *
     * **Behavior:**
     * - Stops all movement immediately
     * - Maintains current temperatures
     * - Job state transitions to `PAUSED`
     * - Progress and time elapsed are preserved
     *
     * **State Requirements:**
     * - Job must be in `PRINTING` state
     * - Returns 409 Conflict if job is not currently printing
     *
     * **Use Case:** User wants to temporarily pause print to inspect progress,
     * change filament color, or handle other issues.
     *
     * @param id Unique job identifier
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
                409: `Conflict - Job cannot be paused (wrong state)`,
            },
        });
    }
    /**
     * Resume paused print job
     * Resumes a previously paused print job from where it left off.
     *
     * **Behavior:**
     * - Waits for temperatures to stabilize (if changed)
     * - Resumes movement from last position
     * - Job state transitions back to `PRINTING`
     * - Continues from previous progress percentage
     *
     * **State Requirements:**
     * - Job must be in `PAUSED` state
     * - Returns 409 Conflict if job is not paused
     *
     * **Timing:** May take 30-60 seconds to resume if temperatures need to reheat.
     *
     * @param id Unique job identifier
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
                409: `Conflict - Job cannot be resumed (wrong state)`,
            },
        });
    }
    /**
     * Continue job after timelapse
     * Continues print job after a timelapse photo capture has paused it.
     *
     * **Behavior:**
     * - Used specifically for timelapse workflow
     * - Similar to resume, but for timelapse-triggered pauses
     * - Job state transitions back to `PRINTING`
     *
     * **State Requirements:**
     * - Job must be paused for timelapse capture
     * - Returns 409 Conflict if not in correct state
     *
     * **Note:** This is a specialized endpoint for timelapse features.
     * Most applications will use `/pause` and `/resume` instead.
     *
     * @param id Unique job identifier
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
                409: `Conflict - Job cannot be continued (wrong state)`,
            },
        });
    }
    /**
     * List available storage locations
     * Returns information about each available file storage location.
     *
     * **Storage Types:**
     * - `local`: Internal storage (built-in flash/SD card)
     * - `sdcard`: External SD card (if present)
     *
     * **Use Cases:**
     * - Initial app load: Check what storage is available
     * - File browser: Show storage selection menu
     * - Upload destination: Select target storage
     *
     * **Note:** Storage list is relatively static. No need to poll frequently.
     *
     * @param acceptLanguage Defines a language of the response
     * @returns any Storage locations retrieved successfully
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
     * Get file/folder metadata or download file
     * Multi-purpose endpoint for file operations:
     *
     * **With Accept: application/json:**
     * - Returns file or folder metadata
     * - For folders: Returns FolderInfo with children array
     * - For files: Returns PrintFileInfo with size, date, thumbnails
     *
     * **For file download:**
     * - Set Accept header to file's content type
     * - Returns file content as binary stream
     *
     * **Thumbnails:**
     * - Available via `refs.thumbnail` field in file metadata
     * - Cached on client side (LRU cache recommended)
     * - Multiple sizes may be available
     *
     * **Folder Navigation:**
     * - Use path="/" to list root directory
     * - Folders have `children` array in response
     * - Files are sorted: folders first, then alphabetically
     *
     * @param storage Storage location identifier (e.g., "local", "sdcard")
     * @param path Path to the file or folder within the storage.
     * Use "/" for root directory listing.
     *
     * @param acceptLanguage Defines a language of the response
     * @param accept Preferred content-type of response:
     * - `application/json`: Get file/folder metadata
     * - File download: Use file's actual content type
     *
     * @returns any File or folder metadata retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Files(
        storage: string,
        path: string,
        acceptLanguage?: string,
        accept: string = 'application/json',
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
                404: `Not Found`,
            },
        });
    }
    /**
     * upload file or create folder
     * @param storage Storage location identifier (e.g., "local", "sdcard")
     * @param path Path to the file or folder within the storage.
     * Use "/" for root directory listing.
     *
     * @param acceptLanguage Defines a language of the response
     * @param accept Preferred content-type of response:
     * - `application/json`: Get file/folder metadata
     * - File download: Use file's actual content type
     *
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
        accept: string = 'application/json',
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
     * Start printing a file
     * Initiates a print job for the specified file.
     *
     * **Behavior:**
     * - Validates file is a valid GCODE file
     * - Checks no other job is currently active
     * - Begins heating bed and nozzle to target temperatures
     * - Starts print when temperatures stabilize
     *
     * **State Requirements:**
     * - Printer must be in IDLE state
     * - No active print job
     * - File must be a PRINT_FILE type
     *
     * **Error Conditions:**
     * - 404: File not found
     * - 409: Printer busy (job already running)
     *
     * **Note:** Request body is ignored. File path from URL parameters is used.
     *
     * **Timing:** May take 2-5 minutes for temperatures to reach targets before
     * print actually begins. Poll `/api/v1/job` to monitor state.
     *
     * @param storage Storage location identifier (e.g., "local", "sdcard")
     * @param path Path to the file or folder within the storage.
     * Use "/" for root directory listing.
     *
     * @param acceptLanguage Defines a language of the response
     * @param accept Preferred content-type of response:
     * - `application/json`: Get file/folder metadata
     * - File download: Use file's actual content type
     *
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiV1Files(
        storage: string,
        path: string,
        acceptLanguage?: string,
        accept: string = 'application/json',
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
                409: `Conflict - Printer busy or invalid file type`,
            },
        });
    }
    /**
     * file presence and state check
     * @param storage Storage location identifier (e.g., "local", "sdcard")
     * @param path Path to the file or folder within the storage.
     * Use "/" for root directory listing.
     *
     * @param acceptLanguage Defines a language of the response
     * @param accept Preferred content-type of response:
     * - `application/json`: Get file/folder metadata
     * - File download: Use file's actual content type
     *
     * @returns string OK
     * @throws ApiError
     */
    public static headApiV1Files(
        storage: string,
        path: string,
        acceptLanguage?: string,
        accept: string = 'application/json',
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
     * Permanently deletes a file or folder from storage.
     *
     * **Behavior:**
     * - Files: Immediately deleted
     * - Empty folders: Deleted immediately
     * - Non-empty folders: Requires `Force: ?1` header
     *
     * **Safety Checks:**
     * - Cannot delete currently printing file (returns 409)
     * - Cannot delete read-only files (returns 409)
     * - Non-empty folders require explicit force flag
     *
     * **Warning:** This operation is irreversible. Deleted files cannot be recovered.
     * Always prompt user for confirmation before calling.
     *
     * **Storage Impact:** Freed space becomes available immediately.
     *
     * @param storage Storage location identifier (e.g., "local", "sdcard")
     * @param path Path to the file or folder within the storage.
     * Use "/" for root directory listing.
     *
     * @param acceptLanguage Defines a language of the response
     * @param accept Preferred content-type of response:
     * - `application/json`: Get file/folder metadata
     * - File download: Use file's actual content type
     *
     * @param force Force deletion of non-empty folders.
     * Values according to RFC8941/3.3.6:
     * - `?0`: False (default) - Reject non-empty folders
     * - `?1`: True - Delete folder and all contents recursively
     *
     * @returns void
     * @throws ApiError
     */
    public static deleteApiV1Files(
        storage: string,
        path: string,
        acceptLanguage?: string,
        accept: string = 'application/json',
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
                409: `Conflict - Cannot delete:
                - File is currently being printed
                - Folder is not empty and Force=?0
                - File or folder is read-only
                `,
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
     * Control printhead movement, speed, and steppers
     * Accepts commands for printhead control. The API uses a flat command structure
     * with discriminated unions based on the `command` field.
     *
     * **Commands:**
     * - `jog`: Move printhead in X/Y/Z axes (relative movement)
     * - `home`: Home one or more axes to endstops
     * - `speed`: Set print speed factor (percentage)
     * - `feedrate`: Set feedrate factor (percentage, alias for speed)
     * - `disable_steppers`: Disable all stepper motors
     *
     * **Note:** 503 responses indicate printer is busy (steppers disabled), but the
     * command is queued and will execute when steppers wake up.
     *
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiPrinterPrinthead(
        requestBody: (PrintheadJogCommand | PrintheadHomeCommand | PrintheadSpeedCommand | PrintheadFeedrateCommand | PrintheadDisableSteppersCommand),
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/printer/printhead',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
                503: `Service Unavailable - Printer busy (steppers disabled), command queued`,
            },
        });
    }
    /**
     * Control extruder (nozzle) temperature and extrusion
     * Accepts commands for extruder/nozzle control. The API uses a flat command structure
     * with discriminated unions based on the `command` field.
     *
     * **Commands:**
     * - `target`: Set target temperature for nozzle (requires nested targets object)
     * - `offset`: Set temperature offset (requires nested offsets object)
     * - `select`: Select active tool (for multi-extruder printers)
     * - `extrude`: Extrude filament by specified amount (mm)
     * - `flowrate`: Set extrusion flowrate factor (percentage)
     *
     * **Note:** For `extrude` command, use negative amounts to retract.
     *
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiPrinterTool(
        requestBody: (ToolTargetCommand | ToolOffsetCommand | ToolSelectCommand | ToolExtrudeCommand | ToolFlowrateCommand),
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/printer/tool',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
                503: `Service Unavailable - Printer busy, command queued`,
            },
        });
    }
    /**
     * Control heated bed temperature
     * Accepts commands for bed temperature control. The API uses a flat command structure
     * with discriminated unions based on the `command` field.
     *
     * **Commands:**
     * - `target`: Set target temperature for heated bed (°C)
     * - `offset`: Set temperature offset (°C)
     *
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiPrinterBed(
        requestBody: (BedTargetCommand | BedOffsetCommand),
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/printer/bed',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
                503: `Service Unavailable - Printer busy, command queued`,
            },
        });
    }
}
