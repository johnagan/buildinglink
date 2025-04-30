import type { BuildingLinkClient } from "./client";
import type { HTMLElement } from "node-html-parser";

/**
 * Represents a document from BuildingLink's document library.
 * Documents can be either building-wide or unit-specific.
 */
export interface LibraryDocument {
  /** Indicates whether the document belongs to the building or a specific unit */
  isAptDocument: boolean;
  /** The title of the document */
  title: string;
  /** Array of tags associated with the document */
  tags: string[];
  /** Name or identifier of the user who posted the document */
  postedBy: string;
  /** Date when the document was posted */
  postedOn: Date;
  /** URL where the document can be viewed */
  viewUrl: string;
  /** Optional URL to download the document */
  downloadUrl?: string;
  /** Optional filename of the document */
  fileName?: string;
  /** Optional file ID of the document */
  fileId?: number;
}

export class BuildingLinkLibrary {
  private client: BuildingLinkClient;

  constructor(client: BuildingLinkClient) {
    this.client = client;
  }

  /**
   * Scrapes a single document's details from BuildingLink.
   * @param filePath - The file path of the document
   * @returns Promise<LibraryDocument> - A promise that resolves to the document details
   * @private
   */
  async readDocument(filePath: string) {
    const { document, url: viewUrl } = await this.client.fetchTenantPage(`Library/${filePath}`);

    // Get info rows
    const infoRows = document.querySelectorAll("#InfoContainer tr, .DocInfo .Inner2 div");

    // Get posted on and tags
    const [postedOnValue, tagsValue] = infoRows.map((el) => el.text?.split(":")[1] || "");

    // Get posted by and posted on
    const [postedBy, postedOn] = postedOnValue.split("on").map((s) => s.trim());

    // Determine if the document is an apt document
    const isAptDocument = /documentid/i.test(viewUrl);

    // Initialize document
    const doc: LibraryDocument = {
      title: document.querySelector("h3")?.textContent?.trim() || "",
      tags: tagsValue.split(":").map((tag) => tag.trim()),
      postedOn: new Date(postedOn),
      isAptDocument,
      postedBy,
      viewUrl,
    };

    // File details
    const fileLink = document.querySelector("a[href^=getFile]:last-child, a[href^=GetAttachment]:last-child");

    if (fileLink) {
      // Get file URL
      const { baseUrl } = this.client.options;

      // get download url
      const downloadHref = fileLink.getAttribute("href")!;
      doc.downloadUrl = new URL(downloadHref, viewUrl).toString();

      // Get file name
      doc.fileName = fileLink.text?.trim();

      // Extract the file id
      const regex = /[?&][^=]+=(\d+)/;
      const [_, id] = downloadHref.match(regex) || [];
      doc.fileId = Number(id);
    }

    return doc;
  }

  /**
   * Retrieves all document links from the BuildingLink library.
   * @yields {Promise<LibraryDocumentListing>} Yields promises that resolve to individual document listings
   */
  async *listDocuments(): AsyncGenerator<Partial<LibraryDocument>> {
    const { document } = await this.client.fetchTenantPage("Library/Library.aspx");

    // Get all document links
    const anchors = document.querySelectorAll("tr.rgRow, tr.rgAltRow");
    for (const row of anchors) {
      // Look for a file link
      const fileLink = row.querySelector(".ViewLink a[onclick]");

      if (fileLink) {
        // Get the url of the document
        // can be viewlibdoc or ViewAptDocument
        const match = fileLink.getAttribute("onClick")!.match(/popWin\('([^']+\.aspx\?(?:documentId|id)=\d+)'/);
        if (match) {
          // Fetch the document page
          yield await this.readDocument(match[1]);
        }
      }
    }
  }
}
