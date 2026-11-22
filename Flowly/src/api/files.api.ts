import { uploadImageFile } from './client';

export async function uploadOperationPhoto(fileUri: string): Promise<{ url: string }> {
  return uploadImageFile(fileUri);
}

