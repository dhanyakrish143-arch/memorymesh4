import fs from "fs";
import mammoth from "mammoth";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export async function extractTextFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

export async function extractTextFromDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

export async function extractText(filePath, mimeType) {
  if (mimeType === "application/pdf") {
    return extractTextFromPDF(filePath);
  }
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractTextFromDocx(filePath);
  }
  if (mimeType === "text/plain") {
    return fs.readFileSync(filePath, "utf-8");
  }
  throw new Error(`Unsupported file type: ${mimeType}`);
}