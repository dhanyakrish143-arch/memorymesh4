import fs from "fs";
import path from "path";

const ROOT = path.resolve(
  process.cwd(),
  "..",
  "textbooks"
);

const SUPPORTED = [
  ".pdf"
];

function walk(dir) {
  const results = [];

  for (const entry of fs.readdirSync(
    dir,
    { withFileTypes: true }
  )) {
    const fullPath =
      path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
      continue;
    }

    if (
      SUPPORTED.includes(
        path.extname(entry.name)
          .toLowerCase()
      )
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

function clean(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function extractMetadata(filePath) {
  const relative =
    path.relative(ROOT, filePath);

  const parts =
    relative.split(path.sep);

  const fileName =
    path.basename(
      filePath,
      path.extname(filePath)
    );

  let className =
    "Unknown";

  let subject =
    "General";

  let language =
    "English";

  if (parts.length >= 3) {
    className =
      clean(parts[0]);

    subject =
      clean(parts[1]);

    if (parts.length >= 4) {
      language =
        clean(parts[2]);
    }
  }

  return {
    className,
    subject,
    language,
    book: clean(fileName),
    filePath,
    relativePath: relative,
  };
}

async function main() {
  if (!fs.existsSync(ROOT)) {
    throw new Error(
      `Textbook folder not found: ${ROOT}`
    );
  }

  const files = walk(ROOT);

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "MEMORYMESH LOCAL TEXTBOOK IMPORTER"
  );
  console.log(
    "========================================"
  );
  console.log(
    "Folder:",
    ROOT
  );
  console.log(
    "PDF files found:",
    files.length
  );
  console.log("");

  if (files.length === 0) {
    console.log(
      "No PDFs found."
    );
    console.log("");
    console.log(
      "Put your PDFs inside folders such as:"
    );
    console.log(
      "textbooks/Class-10/Science/English/"
    );
    return;
  }

  const books =
    files.map(extractMetadata);

  for (
    let i = 0;
    i < books.length;
    i += 1
  ) {
    const book = books[i];

    console.log(
      `[${i + 1}/${books.length}]`
    );
    console.log(
      "Class:",
      book.className
    );
    console.log(
      "Subject:",
      book.subject
    );
    console.log(
      "Language:",
      book.language
    );
    console.log(
      "Book:",
      book.book
    );
    console.log(
      "File:",
      book.relativePath
    );
    console.log("");
  }

  const output =
    path.resolve(
      process.cwd(),
      "textbook-catalog.json"
    );

  fs.writeFileSync(
    output,
    JSON.stringify(
      books.map((book) => ({
        class: book.className,
        subject: book.subject,
        language: book.language,
        book: book.book,
        file: book.relativePath
      })),
      null,
      2
    ),
    "utf8"
  );

  console.log(
    "Catalog written to:"
  );
  console.log(output);

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "IMPORT SCAN COMPLETE"
  );
  console.log(
    "========================================"
  );
}

main().catch((error) => {
  console.error(
    "Importer failed:",
    error.message
  );
  process.exit(1);
});
