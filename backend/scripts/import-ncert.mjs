import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const ROOT = path.resolve(
  process.cwd(),
  "..",
  "textbooks"
);

const MANIFEST = path.resolve(
  process.cwd(),
  "scripts",
  "ncert-manifest.csv"
);

function safeName(value) {
  return String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .slice(0, 180);
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) {
    return [];
  }

  return lines
    .slice(1)
    .map((line) => {
      const parts =
        line
          .match(
            /(".*?"|[^",]+)(?=\s*,|\s*$)/g
          )
          ?.map((value) =>
            value
              .trim()
              .replace(/^"|"$/g, "")
              .replace(/""/g, '"')
          ) || [];

      return {
        class: parts[0],
        subject: parts[1],
        book: parts[2],
        language: parts[3],
        url: parts[4],
      };
    })
    .filter(
      (row) =>
        row.class &&
        row.subject &&
        row.book &&
        row.url
    );
}

function download(url, destination) {
  execFileSync(
    "curl.exe",
    [
      "-L",
      "--retry",
      "5",
      "--retry-delay",
      "2",
      "--retry-all-errors",
      "--connect-timeout",
      "20",
      "--max-time",
      "180",
      "-A",
      "Mozilla/5.0",
      "-H",
      "Accept: application/pdf,*/*",
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

function validatePdf(filePath) {
  const size = fs.statSync(filePath).size;

  if (size < 10000) {
    return false;
  }

  const fd = fs.openSync(
    filePath,
    "r"
  );

  const buffer =
    Buffer.alloc(5);

  fs.readSync(
    fd,
    buffer,
    0,
    5,
    0
  );

  fs.closeSync(fd);

  return (
    buffer.toString("utf8") ===
    "%PDF-"
  );
}

function sleep(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  );
}

async function main() {
  if (!fs.existsSync(MANIFEST)) {
    throw new Error(
      `Manifest not found: ${MANIFEST}`
    );
  }

  const rows = parseCsv(
    fs.readFileSync(
      MANIFEST,
      "utf8"
    )
  );

  if (!rows.length) {
    throw new Error(
      "Manifest contains no books."
    );
  }

  fs.mkdirSync(ROOT, {
    recursive: true,
  });

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "MEMORYMESH NCERT IMPORTER"
  );
  console.log(
    "========================================"
  );
  console.log(
    "Books:",
    rows.length
  );
  console.log(
    "Destination:",
    ROOT
  );
  console.log("");

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (
    let i = 0;
    i < rows.length;
    i += 1
  ) {
    const row = rows[i];

    const className =
      safeName(
        `Class-${row.class}`
      );

    const subject =
      safeName(row.subject) ||
      "General";

    const language =
      safeName(row.language) ||
      "English";

    const book =
      safeName(row.book) ||
      `Book-${i + 1}`;

    const folder =
      path.join(
        ROOT,
        className,
        subject,
        language
      );

    fs.mkdirSync(folder, {
      recursive: true,
    });

    const destination =
      path.join(
        folder,
        `${book}.pdf`
      );

    process.stdout.write(
      `[${i + 1}/${rows.length}] ${className} / ${subject} / ${book} ... `
    );

    if (
      fs.existsSync(destination) &&
      validatePdf(destination)
    ) {
      console.log(
        "SKIP (already downloaded)"
      );
      skipped += 1;
      continue;
    }

    fs.rmSync(destination, {
      force: true,
    });

    try {
      download(
        row.url,
        destination
      );

      if (!validatePdf(destination)) {
        throw new Error(
          "Downloaded file is not a valid PDF."
        );
      }

      const size =
        fs.statSync(destination)
          .size;

      console.log(
        `OK (${(
          size /
          1024 /
          1024
        ).toFixed(2)} MB)`
      );

      downloaded += 1;

      await sleep(500);
    } catch (error) {
      fs.rmSync(destination, {
        force: true,
      });

      console.log(
        `FAILED: ${
          error.stderr?.toString().trim() ||
          error.message
        }`
      );

      failed += 1;
    }
  }

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "IMPORT COMPLETE"
  );
  console.log(
    "Downloaded:",
    downloaded
  );
  console.log(
    "Skipped:",
    skipped
  );
  console.log(
    "Failed:",
    failed
  );
  console.log(
    "========================================"
  );
}

main().catch((error) => {
  console.error("");
  console.error(
    "Importer failed:",
    error.message
  );
  process.exit(1);
});
