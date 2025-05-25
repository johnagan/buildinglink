import { z } from "zod";
import { HTMLElement } from "node-html-parser";

/**
 * Represents a document from BuildingLink's document library.
 * Documents can be either building-wide or unit-specific.
 */
export const BuildingLinkLibraryDocumentSchema = z.object({
  /** The title of the document */
  title: z.string(),
  /** Array of categories associated with the document */
  categories: z.array(z.string()),
  /** Name or identifier of the user who posted the document */
  postedBy: z.string().optional(),
  /** Date when the document was posted */
  postedOn: z.date(),
  /** Date when the document was last revised */
  revisedOn: z.date().optional(),
  /** URL where the document can be viewed */
  viewUrl: z.string(),
  /** URL where the document can be downloaded */
  downloadUrl: z.string().optional(),
  /** Optional filename of the document */
  fileName: z.string().optional(),
  /** Optional file ID of the document */
  fileId: z.number().optional(),
  /** Optional file bytes of the document */
  fileBytes: z.instanceof(Uint8Array).optional(),
});

export type BuildingLinkLibraryDocument = z.infer<
  typeof BuildingLinkLibraryDocumentSchema
>;

/**
 * Represents the BuildingLink library, containing both building-wide and unit-specific documents.
 */
export const BuildingLinkLibrary = z.object({
  /** Array of documents belonging to the building */
  aptDocuments: z.array(BuildingLinkLibraryDocumentSchema),
  /** Array of documents belonging to a specific unit */
  buildingDocuments: z.array(BuildingLinkLibraryDocumentSchema),
});

export type BuildingLinkLibrary = z.infer<typeof BuildingLinkLibrary>;

/**
 * Parses a date from a string
 * @param date - The date string
 * @returns The date
 */
const parseDate = (date: string | undefined) => {
  return date ? new Date(date) : undefined;
};

/**
 * Adds a category to the list of categories
 * @param categories - The list of categories
 * @param row - The row
 */
const addCategory = (categories: string[], row: HTMLElement) => {
  const category =
    row.querySelector("td:nth-child(2)")?.textContent?.trim() || "";
  if (category) {
    const cleanCategory = category
      .replace(/\s*\(\d+(?:\s+\w+)?\)\s*$/, "")
      .trim();
    categories.push(cleanCategory);
  }
};

/**
 * Parses a document from a table cell
 * @param table - The table
 * @param url - The URL of the library
 */
export function parseDocumentFromTable({
  table,
  url,
}: {
  table?: HTMLElement;
  url: string;
}): BuildingLinkLibraryDocument[] {
  const documents: BuildingLinkLibraryDocument[] = [];

  // If no table, return empty array
  if (!table) {
    return documents;
  }

  // Determine if the document is an apt document
  const isAptDocument = table.id === "GridAptDocumentsCon";

  // Get the rows
  const rows = table.querySelectorAll("tr.rgRow, tr.rgAltRow");

  for (const row of rows) {
    // Get the document link
    const link = row.querySelector("a[onclick]");

    // If no link, skip
    if (!link) continue;

    // Get the document's file id
    const title = link.textContent?.trim() || "";
    const onclick = link.getAttribute("onclick");
    const match = onclick?.match(/(?:id|documentId)=(\d+)/);
    const fileId = match ? match[1] : undefined;

    // If no file id, skip
    if (!fileId) continue;

    // Get the view and download pages
    const viewPage = isAptDocument
      ? `ViewAptDocuments.aspx?documentid=${fileId}`
      : `viewlibdoc.aspx?id=${fileId}`;
    const downloadPage = isAptDocument
      ? `GetAttachment.aspx?documentId=${fileId}`
      : `getFile.aspx?id=${fileId}`;

    // Get the cells
    const cells = row.querySelectorAll("td");

    // Get the posted on and revised on dates
    const postedOn = parseDate(cells[2].textContent?.trim())!;
    const revisedOn = parseDate(cells[3].textContent?.trim());

    // Get the categories
    const categories: string[] = [];

    // For apt documents, the category is in the second cell
    if (isAptDocument) {
      addCategory(categories, row);
    } else {
      let currentRow = row;
      while (currentRow.previousElementSibling) {
        currentRow = currentRow.previousElementSibling;
        if (currentRow.classList.contains("rgGroupHeader")) {
          addCategory(categories, currentRow);
        }
      }
    }

    // Create the document
    const doc: BuildingLinkLibraryDocument = {
      title,
      postedOn,
      revisedOn,
      categories,
      fileId: parseInt(fileId),
      viewUrl: new URL(viewPage, url).toString(),
      downloadUrl: new URL(downloadPage, url).toString(),
    };

    if (doc) {
      documents.push(doc);
    }
  }

  return documents;
}

/**
 * Parses the BuildingLink library from an HTML document.
 * @param document - The HTML document
 * @param url - The URL of the library
 * @returns The BuildingLink library
 */
export function parseLibrary(
  document: HTMLElement,
  url: string
): BuildingLinkLibrary {
  const aptTable = document.querySelector("#GridAptDocumentsCon") || undefined;
  const buildingTable = document.querySelector("#LibraryGridView") || undefined;

  return {
    aptDocuments: parseDocumentFromTable({ table: aptTable, url }),
    buildingDocuments: parseDocumentFromTable({ table: buildingTable, url }),
  };
}
