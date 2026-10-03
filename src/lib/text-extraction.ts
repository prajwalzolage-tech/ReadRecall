// src/lib/text-extraction.ts
// Real file type validation by magic bytes, text extraction (PDF, DOCX, TXT), and content hashing

import crypto from 'crypto';
import mammoth from 'mammoth';

/**
 * Validate real file type by inspecting magic bytes
 */
export function validateMagicBytes(buffer: Buffer): {
  valid: boolean;
  mimeType?: string;
  extension?: string;
  error?: string;
} {
  if (!buffer || buffer.length < 4) {
    return { valid: false, error: 'File is empty or corrupt' };
  }

  // PDF: %PDF (0x25, 0x50, 0x44, 0x46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return {
      valid: true,
      mimeType: 'application/pdf',
      extension: 'pdf',
    };
  }

  // DOCX: PK\x03\x04 (ZIP container)
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return {
      valid: true,
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
    };
  }

  // Plain Text: Must be valid printable UTF-8 without non-whitespace control characters
  let isBinary = false;
  const sampleLength = Math.min(buffer.length, 1024);
  for (let i = 0; i < sampleLength; i++) {
    const byte = buffer[i];
    // Check for null bytes or control codes
    if (byte === 0 || (byte < 7 && byte !== 9 && byte !== 10 && byte !== 13)) {
      isBinary = true;
      break;
    }
  }

  if (!isBinary) {
    return {
      valid: true,
      mimeType: 'text/plain',
      extension: 'txt',
    };
  }

  return {
    valid: false,
    error: 'Unsupported file format. Please upload a PDF, DOCX, or TXT file.',
  };
}

/**
 * Extract raw text from supported file buffers
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    return extractPdfText(buffer);
  }

  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/docx'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }

  throw new Error(`Unsupported mimeType: ${mimeType}`);
}

/**
 * Extract PDF text and check for scanned or encrypted documents
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfModule = await import('pdf-parse');
    const PDFParse =
      (pdfModule as any).PDFParse || (pdfModule as any).default || pdfModule;

    let text = '';
    let totalPages = 1;

    if (typeof PDFParse === 'function' && PDFParse.prototype?.getText) {
      // Class-based API
      const parser = new PDFParse({ data: buffer });
      const result: any = await parser.getText();
      text = result.text || '';
      totalPages = result.total || result.pages?.length || 1;
    } else if (typeof PDFParse === 'function') {
      // Functional legacy API
      const data: any = await (PDFParse as any)(buffer);
      text = data.text || '';
      totalPages = data.numpages || 1;
    } else {
      // Fallback text extraction from raw PDF streams
      const raw = buffer.toString('latin1');
      const matches = raw.match(/\(([^)]+)\)\s*Tj/g) || [];
      text = matches.map((m) => m.slice(1, -3)).join(' ');
    }

    // Check for scanned PDF (< 20 characters per page)
    if (totalPages > 0 && text.trim().length / totalPages < 20) {
      throw new Error(
        'This appears to be a scanned PDF. Please upload a text-based PDF.'
      );
    }

    return text;
  } catch (error: any) {
    if (
      error.name === 'PasswordException' ||
      error.message?.toLowerCase().includes('password') ||
      error.message?.toLowerCase().includes('encrypted')
    ) {
      throw new Error(
        'This PDF is password-protected. Please upload an unencrypted file.'
      );
    }
    throw error;
  }
}

/**
 * Compute SHA-256 hash of cleaned text for deduplication
 */
export function computeHash(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}
