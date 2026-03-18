/**
 * Fast Track Upload - Job Model
 * Spec: 006-boss-office-upload
 * Per contracts/job.yaml
 */

// ========== ENUMS ==========

/**
 * Supported file types
 */
export enum FileType {
  PDF = 'PDF',
  DOCX = 'DOCX',
  TXT = 'TXT',
  MD = 'MD'
}

/**
 * Job lifecycle states
 */
export enum JobStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  FAILED_SEND = 'FAILED_SEND'  // NEW (spec 007): Submission to Factory failed
}

// ========== INTERFACES ==========

/**
 * Job entity - represents a document upload
 */
export interface Job {
  job_id: string;
  original_filename: string;
  file_type: FileType;
  file_size_bytes: number;
  file_storage_key: string;
  created_at: Date;
  status: JobStatus;
  // NEW (spec 007): Factory submission fields
  submitted_at?: Date;       // When successfully sent to Factory
  last_attempt_at?: Date;    // When last send was attempted
  failure_reason?: string;   // Error description when FAILED_SEND
}

/**
 * Job creation input
 */
export interface CreateJobInput {
  original_filename: string;
  file_type: FileType;
  file_size_bytes: number;
  file_storage_key: string;
}

/**
 * Job API response
 */
export interface JobResponse {
  job_id: string;
  original_filename: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
  status: string;
  // NEW (spec 007): Factory submission fields
  submitted_at?: string;      // ISO 8601 if submitted
  last_attempt_at?: string;   // ISO 8601 if attempted
  failure_reason?: string;    // Present if FAILED_SEND
}

// ========== MONGOOSE SCHEMA (if using MongoDB) ==========

/**
 * MongoDB schema definition for Job collection
 * Collection: fast_track_tools.jobs
 *
 * Indexes:
 * - job_id: unique
 * - status: standard
 * - created_at: descending
 */
export const JobSchema = {
  job_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  original_filename: {
    type: String,
    required: true,
    maxlength: 255
  },
  file_type: {
    type: String,
    required: true,
    enum: Object.values(FileType)
  },
  file_size_bytes: {
    type: Number,
    required: true,
    min: 1,
    max: 10 * 1024 * 1024 // 10MB
  },
  file_storage_key: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(JobStatus),
    default: JobStatus.DRAFT
  },
  // NEW (spec 007): Factory submission fields
  submitted_at: {
    type: Date,
    required: false,
    default: null
  },
  last_attempt_at: {
    type: Date,
    required: false,
    default: null
  },
  failure_reason: {
    type: String,
    required: false,
    default: null,
    maxlength: 500
  }
};

// ========== VALIDATION ==========

/**
 * Validate file type string
 */
export function isValidFileType(type: string): type is FileType {
  return Object.values(FileType).includes(type as FileType);
}

/**
 * Validate job status string
 */
export function isValidJobStatus(status: string): status is JobStatus {
  return Object.values(JobStatus).includes(status as JobStatus);
}

// ========== FACTORY FUNCTIONS ==========

/**
 * Create a new Job entity
 */
export function createJob(input: CreateJobInput, jobId: string): Job {
  return {
    job_id: jobId,
    original_filename: input.original_filename,
    file_type: input.file_type,
    file_size_bytes: input.file_size_bytes,
    file_storage_key: input.file_storage_key,
    created_at: new Date(),
    status: JobStatus.DRAFT
  };
}

/**
 * Convert Job to API response format
 */
export function jobToResponse(job: Job): JobResponse {
  const response: JobResponse = {
    job_id: job.job_id,
    original_filename: job.original_filename,
    file_type: job.file_type,
    file_size_bytes: job.file_size_bytes,
    created_at: job.created_at.toISOString(),
    status: job.status
  };

  // NEW (spec 007): Include optional submission fields if present
  if (job.submitted_at) {
    response.submitted_at = job.submitted_at.toISOString();
  }
  if (job.last_attempt_at) {
    response.last_attempt_at = job.last_attempt_at.toISOString();
  }
  if (job.failure_reason) {
    response.failure_reason = job.failure_reason;
  }

  return response;
}
