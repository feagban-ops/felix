// File validation utilities for secure file uploads

// Magic bytes for common image types
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
}

const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8MB

export interface FileValidationResult {
  valid: boolean
  mimeType?: string
  error?: string
}

export async function validateUploadedFile(
  file: File | Buffer,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
): Promise<FileValidationResult> {
  try {
    // Check file size
    const fileSize = file instanceof File ? file.size : file.length
    if (fileSize > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'Fichier trop volumineux (max 8 Mo)',
      }
    }

    if (fileSize === 0) {
      return {
        valid: false,
        error: 'Fichier vide',
      }
    }

    // Get buffer for magic bytes check
    const buffer = file instanceof File ? await file.arrayBuffer() : file
    const uint8Array = new Uint8Array(buffer instanceof ArrayBuffer ? buffer : buffer.buffer)

    // Check magic bytes
    let detectedMimeType: string | undefined

    for (const [mimeType, magicBytes] of Object.entries(MAGIC_BYTES)) {
      if (uint8Array.length >= magicBytes.length) {
        const matches = magicBytes.every((byte, index) => uint8Array[index] === byte)
        if (matches) {
          detectedMimeType = mimeType
          break
        }
      }
    }

    if (!detectedMimeType) {
      return {
        valid: false,
        error: 'Type de fichier non supporté',
      }
    }

    // Check if detected type is allowed
    if (!allowedTypes.includes(detectedMimeType)) {
      return {
        valid: false,
        error: 'Type de fichier non autorisé',
      }
    }

    // If it's a File object, also check the declared type matches
    if (file instanceof File && file.type && file.type !== detectedMimeType) {
      return {
        valid: false,
        error: 'Type de fichier déclaré incorrect',
      }
    }

    return {
      valid: true,
      mimeType: detectedMimeType,
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Erreur lors de la validation du fichier',
    }
  }
}

export function generateRandomFileName(originalName: string): string {
  const extension = originalName.split('.').pop() || 'bin'
  const randomString = crypto.randomUUID().replace(/-/g, '')
  return `${randomString}.${extension}`
}

export function getUserStoragePath(userId: string): string {
  return `${userId}/`
}

export function getSafeFilePath(userId: string, fileName: string): string {
  const storagePath = getUserStoragePath(userId)
  const safeFileName = generateRandomFileName(fileName)
  return `${storagePath}${safeFileName}`
}
