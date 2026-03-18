/**
 * Fast Track Upload - Jobs API Client
 * Spec: 006-boss-office-upload
 * Per contracts/job.yaml
 */

import { CreateJobResponse } from '../lib/upload/types';

// ========== API CONFIGURATION ==========

const API_BASE_URL = '/api/boss';

// ========== ERROR MESSAGES ==========

const API_ERRORS = {
  NETWORK: 'Upload failed. Check connection and try again.',
  STORAGE: 'Storage unavailable. Try again later.',
  INVALID_TYPE: 'Wrong file type. Use PDF, DOCX, TXT, or MD.',
  FILE_TOO_LARGE: 'File too large. Split it.',
  FILE_EMPTY: 'File is empty. Upload a document with content.',
  UNKNOWN: 'Upload failed. Try again.'
};

// ========== API FUNCTIONS ==========

/**
 * Create a new Job by uploading a file
 *
 * @param file - The file to upload
 * @returns Promise resolving to the created Job
 * @throws Error with user-friendly message on failure
 */
export async function createJob(file: File): Promise<CreateJobResponse> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(mapApiError(response.status, errorData));
    }

    return await response.json();

  } catch (error) {
    // Network error (fetch failed)
    if (error instanceof TypeError) {
      throw new Error(API_ERRORS.NETWORK);
    }

    // Re-throw mapped errors
    throw error;
  }
}

// ========== ERROR MAPPING ==========

interface ApiErrorResponse {
  error?: string;
  code?: string;
}

function mapApiError(status: number, data: ApiErrorResponse): string {
  // Map by status code
  switch (status) {
    case 400:
      // Validation errors
      if (data.code === 'INVALID_FILE_TYPE') {
        return API_ERRORS.INVALID_TYPE;
      }
      if (data.code === 'FILE_EMPTY') {
        return API_ERRORS.FILE_EMPTY;
      }
      return data.error || API_ERRORS.UNKNOWN;

    case 413:
      return API_ERRORS.FILE_TOO_LARGE;

    case 500:
      if (data.code === 'STORAGE_ERROR') {
        return API_ERRORS.STORAGE;
      }
      return API_ERRORS.UNKNOWN;

    default:
      return data.error || API_ERRORS.UNKNOWN;
  }
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Get a Job by ID
 *
 * @param jobId - The job ID to fetch
 * @returns Promise resolving to the Job
 */
export async function getJob(jobId: string): Promise<CreateJobResponse> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);

  if (!response.ok) {
    throw new Error('Job not found');
  }

  return await response.json();
}

/**
 * List all Jobs
 *
 * @returns Promise resolving to array of Jobs
 */
export async function listJobs(): Promise<CreateJobResponse[]> {
  const response = await fetch(`${API_BASE_URL}/jobs`);

  if (!response.ok) {
    throw new Error('Failed to fetch jobs');
  }

  return await response.json();
}
