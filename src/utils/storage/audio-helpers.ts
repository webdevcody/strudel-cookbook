import {
  getPresignedAudioUploadUrlFn,
  getPresignedCoverImageUploadUrlFn,
} from "~/fn/audio-storage";
import { getAudioDuration, formatDuration } from "../audio-duration";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface AudioUploadResult {
  audioKey: string;
  duration: string; // formatted duration like "2:34"
  durationSeconds: number; // raw duration in seconds
  songId: string;
}

export interface CoverImageUploadResult {
  coverKey: string;
}

export async function uploadAudioWithPresignedUrl(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<AudioUploadResult> {
  // Calculate audio duration first
  const durationSeconds = await getAudioDuration(file);
  const duration = formatDuration(durationSeconds);

  // Get presigned URL from server
  const { presignedUrl, audioKey, songId } = await getPresignedAudioUploadUrlFn({
    data: { 
      fileName: file.name, 
      contentType: file.type 
    },
  });

  // Create XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress: UploadProgress = {
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        };
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          audioKey,
          duration,
          durationSeconds,
          songId,
        });
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Upload failed: Network error"));
    };

    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}

export async function uploadCoverImageWithPresignedUrl(
  songId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<CoverImageUploadResult> {
  // Get presigned URL from server
  const { presignedUrl, coverKey } = await getPresignedCoverImageUploadUrlFn({
    data: { 
      songId,
      fileName: file.name, 
      contentType: file.type 
    },
  });

  // Create XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress: UploadProgress = {
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        };
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          coverKey,
        });
      } else {
        reject(new Error(`Cover image upload failed: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Cover image upload failed: Network error"));
    };

    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}