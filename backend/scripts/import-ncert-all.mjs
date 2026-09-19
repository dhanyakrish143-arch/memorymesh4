import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const ROOT = path.resolve(process.cwd(), "..", "textbooks");

const NCERT =
  "https://ncert.nic.in";

const CATALOG =
  `${NCERT}/textbook.php`;

const FORCE =
  process.argv.includes("--force");

const CHECK =
  process.argv.includes("--check");

const MIN_CLASS = 5;
const MAX_CLASS = 12;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function safeName(value) {
  return String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .slice(0, 180);
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function classFromCode(code) {
  const first = code[0].toLowerCase();

  const map = {
    a: 1,
    b: 2,
    c: 3,
    d: 4,
    e: 5,
    f: 6,
    g: 7,
    h: 8,
    i: 9,
    j: 10,
    k: 11,
    l: 12,
  };

  return map[first] ?? null;
}

function languageFromCode(code) {
  const second = code[1]?.toLowerCase();

  const map = {
    e: "English",
    h: "Hindi",
    u: "Urdu",
  };

  return map[second] || "Other";
}

function parseCatalog(html) {
  const books = new Map();

  /*
    NCERT exposes textbook selectors containing links such as:

      textbook.php?jemh1=...
      textbook.php?jesc1=...

    The first character identifies the class and the second
    character identifies the language.

    We collect the unique book IDs and later obtain the
    complete-book ZIP URL from the same NCERT naming scheme.
  */

  const patterns = [
    /textbook\.php\?([a-z]{4,5}\d)/gi,
    /textbook\.php%3F([a-z]{4,5}\d)/gi,
  ];

  for (const pattern of patterns) {
    let match;

    while ((match = pattern.exec(html)) !== null) {
      const code = match[1].toLowerCase();

      const classNumber =
        classFromCode(code);

      if (
        !classNumber ||
        classNumber < MIN_CLASS ||
        classNumber > MAX_CLASS
      ) {
        continue;
      }

      books.set(code, {
        code,
        classNumber,
        language: languageFromCode(code),
      });
    }
  }

  /*
    Also inspect complete-book ZIP links.

    Example:
      leac1dd.zip
      lhch1dd.zip
      jemh1dd.zip
  */

  const zipPattern =
    /(?:https?:\/\/)?(?:www\.)?ncert\.nic\.in\/textbook\/pdf\/([a-z]{4,5}\d)dd\.zip/gi;

  let zipMatch;

  while ((zipMatch = zipPattern.exec(html)) !== null) {
    const code = zipMatch[1].toLowerCase();

    const classNumber =
      classFromCode(code);

    if (
      !classNumber ||
      classNumber < MIN_CLASS ||
      classNumber > MAX_CLASS
    ) {
      continue;
    }

    books.set(code, {
      code,
      classNumber,
      language: languageFromCode(code),
    });
  }

  return [...books.values()];
}

async function fetchText(url) {
  const tempFile = path.join(
    ROOT,
    ".cache",
    "ncert-catalog.html"
  );

  fs.mkdirSync(
    path.dirname(tempFile),
    { recursive: true }
  );

  fs.rmSync(
    tempFile,
    { force: true }
  );

  try {
    execFileSync(
      "curl.exe",
      [
        "-L",
        "--fail",
        "--retry",
        "5",
        "--retry-delay",
        "2",
        "--retry-all-errors",
        "--connect-timeout",
        "30",
        "--max-time",
        "120",
        "-A",
        "Mozilla/5.0 MemoryMesh NCERT importer",
        "-H",
        "Accept: text/html,application/xhtml+xml",
        "-o",
        tempFile,
        url,
      ],
      {
        stdio: "pipe",
        windowsHide: true,
      }
    );

    if (!fs.existsSync(tempFile)) {
      throw new Error(
        "NCERT catalog was not downloaded."
      );
    }

    const html =
      fs.readFileSync(
        tempFile,
        "utf8"
      );

    if (!html.trim()) {
      throw new Error(
        "NCERT catalog response was empty."
      );
    }

    return html;
  } catch (error) {
    const stderr =
      error.stderr?.toString().trim();

    throw new Error(
      stderr ||
      error.message ||
      "Unable to download NCERT catalog."
    );
  } finally {
    fs.rmSync(
      tempFile,
      { force: true }
    );
  }
}

function download(url, destination) {
  execFileSync(
    "curl.exe",
    [
      "-L",
      "--fail",
      "--retry",
      "5",
      "--retry-delay",
      "2",
      "--retry-all-errors",
      "--connect-timeout",
      "30",
      "--max-time",
      "600",
      "-A",
      "Mozilla/5.0 MemoryMesh NCERT importer",
      "-o",
      destination,
      url,
    ],
    {
      stdio: "pipe",
      windowsHide: true,
    }
  );
}

function validZip(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const size =
    fs.statSync(filePath).size;

  if (size < 10000) {
    return false;
  }

  const fd =
    fs.openSync(filePath, "r");

  const buffer =
    Buffer.alloc(4);

  fs.readSync(
    fd,
    buffer,
    0,
    4,
    0
  );

  fs.closeSync(fd);

  const signature =
    buffer.toString("binary");

  return (
    signature === "PK\u0003\u0004" ||
    signature === "PK\u0005\u0006" ||
    signature === "PK\u0007\u0008"
  );
}

function extractZip(zip, destination) {
  fs.mkdirSync(destination, {
    recursive: true,
  });

  execFileSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `Expand-Archive -LiteralPath '${zip.replace(/'/g, "''")}' -DestinationPath '${destination.replace(/'/g, "''")}' -Force`,
    ],
    {
      stdio: "pipe",
      windowsHide: true,
    }
  );
}

function findPdfs(folder) {
  const result = [];

  function walk(current) {
    for (const entry of fs.readdirSync(
      current,
      { withFileTypes: true }
    )) {
      const full =
        path.join(current, entry.name);

      if (entry.isDirectory()) {
        walk(full);
      } else if (
        entry.isFile() &&
        entry.name.toLowerCase().endsWith(".pdf")
      ) {
        result.push(full);
      }
    }
  }

  walk(folder);

  return result;
}

function chapterNumberFromFilename(file) {
  const base =
    path.basename(file, ".pdf")
      .toLowerCase();

  /*
    NCERT chapter files commonly look like:

      jesc101.pdf
      jesc102.pdf
      jemh101.pdf

    The final two digits identify the chapter.
  */

  const match =
    base.match(/(\d{2})$/);

  if (!match) {
    return null;
  }

  const number =
    Number(match[1]);

  if (
    number < 1 ||
    number > 99
  ) {
    return null;
  }

  return number;
}

function chapterNameFromPdf(file, chapterNumber) {
  /*
    Keep a stable display name even when the PDF itself
    cannot be text-extracted.

    Learn.jsx can display:
      Chapter 1
      Chapter 2
      ...
    
    A later metadata pass can replace these with exact
    NCERT chapter titles.
  */

  return `Chapter ${chapterNumber}`;
}

function guessSubjectFromCode(code) {
  const middle =
    code.slice(2, 4).toLowerCase();

  const map = {
    mh: "Mathematics",
    sc: "Science",
    ss: "Social Science",
    en: "English",
    hi: "Hindi",
    sans: "Sanskrit",
  };

  if (map[middle]) {
    return map[middle];
  }

  /*
    Some NCERT codes are not semantically obvious.
    We retain a generic subject until metadata is known.
  */

  return "NCERT";
}

function removeOldPrelims(folder) {
  if (!fs.existsSync(folder)) {
    return;
  }

  for (const file of fs.readdirSync(folder)) {
    if (
      file.toLowerCase().endsWith("ps.pdf")
    ) {
      fs.rmSync(
        path.join(folder, file),
        { force: true }
      );
    }
  }
}

async function main() {
  console.log("");
  console.log(
    "=================================================="
  );
  console.log(
    " MEMORYMESH NCERT CLASS 5–12 IMPORTER"
  );
  console.log(
    "=================================================="
  );
  console.log("");

  console.log(
    "Reading current NCERT catalog..."
  );

  const html =
    await fetchText(CATALOG);

  const books =
    parseCatalog(html);

  if (!books.length) {
    throw new Error(
      "No Class 5–12 NCERT books were discovered."
    );
  }

  const filtered =
    books.filter(
      (book) =>
        book.classNumber >= MIN_CLASS &&
        book.classNumber <= MAX_CLASS
    );

  console.log(
    `Discovered ${filtered.length} NCERT book IDs.`
  );

  if (CHECK) {
    console.log("");
    console.log(
      "CHECK MODE — no downloads will occur."
    );
    console.log("");

    for (const book of filtered) {
      console.log(
        `Class ${book.classNumber} | ${book.language} | ${book.code}`
      );
    }

    console.log("");
    return;
  }

  fs.mkdirSync(ROOT, {
    recursive: true,
  });

  let downloadedBooks = 0;
  let skippedBooks = 0;
  let failedBooks = 0;
  let chapterFiles = 0;

  for (
    let index = 0;
    index < filtered.length;
    index++
  ) {
    const book =
      filtered[index];

    const zipName =
      `${book.code}dd.zip`;

    const zipUrl =
      `${NCERT}/textbook/pdf/${zipName}`;

    const classFolder =
      `Class-${book.classNumber}`;

    const subject =
      safeName(
        guessSubjectFromCode(book.code)
      );

    const language =
      safeName(book.language);

    const destinationFolder =
      path.join(
        ROOT,
        classFolder,
        subject,
        language
      );

    const zipFolder =
      path.join(
        ROOT,
        ".cache"
      );

    fs.mkdirSync(
      destinationFolder,
      { recursive: true }
    );

    fs.mkdirSync(
      zipFolder,
      { recursive: true }
    );

    const zipPath =
      path.join(
        zipFolder,
        zipName
      );

    process.stdout.write(
      `[${index + 1}/${filtered.length}] ` +
      `Class ${book.classNumber} / ` +
      `${subject} / ${language} / ` +
      `${book.code} ... `
    );

    try {
      if (
        !fs.existsSync(zipPath) ||
        !validZip(zipPath) ||
        FORCE
      ) {
        fs.rmSync(zipPath, {
          force: true,
        });

        download(
          zipUrl,
          zipPath
        );

        if (!validZip(zipPath)) {
          throw new Error(
            "NCERT response was not a ZIP file."
          );
        }

        downloadedBooks += 1;
      } else {
        skippedBooks += 1;
      }

      const tempFolder =
        path.join(
          zipFolder,
          `${book.code}-extract`
        );

      fs.rmSync(
        tempFolder,
        {
          recursive: true,
          force: true,
        }
      );

      extractZip(
        zipPath,
        tempFolder
      );

      const pdfs =
        findPdfs(tempFolder)
          .filter(
            (file) =>
              !file
                .toLowerCase()
                .includes("prelims")
          )
          .map((file) => ({
            file,
            chapterNumber:
              chapterNumberFromFilename(file),
          }))
          .filter(
            (item) =>
              Number.isInteger(
                item.chapterNumber
              )
          )
          .sort(
            (a, b) =>
              a.chapterNumber -
              b.chapterNumber
          );

      if (!pdfs.length) {
        /*
          Some books may expose only a complete PDF.
          Keep it instead of silently losing the book.
        */

        const allPdfs =
          findPdfs(tempFolder);

        if (allPdfs.length) {
          const fallback =
            allPdfs[0];

          const target =
            path.join(
              destinationFolder,
              `${safeName(book.code)}-complete.pdf`
            );

          fs.copyFileSync(
            fallback,
            target
          );

          chapterFiles += 1;

          console.log(
            `OK — complete PDF (${allPdfs.length} PDF file)`
          );
        } else {
          console.log(
            "NO CHAPTER PDF FOUND"
          );
        }

        fs.rmSync(
          tempFolder,
          {
            recursive: true,
            force: true,
          }
        );

        continue;
      }

      removeOldPrelims(
        destinationFolder
      );

      for (
        const item of pdfs
      ) {
        const output =
          path.join(
            destinationFolder,
            `${String(
              item.chapterNumber
            ).padStart(2, "0")}_${safeName(
              chapterNameFromPdf(
                item.file,
                item.chapterNumber
              )
            )}.pdf`
          );

        fs.copyFileSync(
          item.file,
          output
        );

        chapterFiles += 1;
      }

      console.log(
        `OK — ${pdfs.length} chapters`
      );

      fs.rmSync(
        tempFolder,
        {
          recursive: true,
          force: true,
        }
      );

      await sleep(250);
    } catch (error) {
      console.log(
        `FAILED: ${
          error.stderr?.toString().trim() ||
          error.message
        }`
      );

      failedBooks += 1;
    }
  }

  console.log("");
  console.log(
    "=================================================="
  );
  console.log(
    " IMPORT COMPLETE"
  );
  console.log(
    "=================================================="
  );
  console.log(
    `Books downloaded : ${downloadedBooks}`
  );
  console.log(
    `Books skipped    : ${skippedBooks}`
  );
  console.log(
    `Books failed     : ${failedBooks}`
  );
  console.log(
    `Chapter PDFs     : ${chapterFiles}`
  );
  console.log(
    `Destination      : ${ROOT}`
  );
  console.log(
    "=================================================="
  );
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error(
    "NCERT IMPORTER FAILED:"
  );
  console.error(
    error.stack || error.message
  );
  process.exit(1);
});

