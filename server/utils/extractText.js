import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

export const extractResumeText = async (file) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const buffer = fs.readFileSync(file.path);
  let text = '';

  if (ext === '.pdf') text = (await pdf(buffer)).text || '';
  else if (ext === '.docx') text = (await mammoth.extractRawText({ buffer })).value || '';
  else throw new Error('Only PDF or DOCX files are supported.');

  text = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 200) {
    throw new Error('Could not read enough text. Please upload a text-based (not scanned/image) resume.');
  }
  return text;
};
