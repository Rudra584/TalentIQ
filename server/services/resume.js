import fs from 'node:fs/promises';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
export async function extractResumeText(path,mime){if(mime==='application/pdf'){const result=await pdf(await fs.readFile(path));return result.text.slice(0,100000);}if(mime==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'){const result=await mammoth.extractRawText({path});return result.value.slice(0,100000);}return '';}
