import type { BuildingLinkClient } from "./client";
import type { HTMLElement } from "node-html-parser";

/**
 * Enumerates the possible visibility options for documents in BuildingLink
 */
export enum DocumentVisibility {
  Building = "building",
  Unit = "unit",
}

/**
 * Represents a document from BuildingLink's document library.
 * Documents can be either building-wide or unit-specific.
 */
export interface LibraryDocument {
  /** Indicates whether the document belongs to the building or a specific unit */
  visibility: DocumentVisibility;
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
  /** Optional date when the document was last revised */
  revisedOn?: Date;
  /** Optional URL to download the document */
  downloadUrl?: string;
  /** Optional filename of the document */
  fileName?: string;
  /** Optional file ID of the document */
  fileId?: number;
  /** Optional file size of the document */
  fileSize?: number;
}

export class BuildingLinkLibrary {
  private client: BuildingLinkClient;

  constructor(client: BuildingLinkClient) {
    this.client = client;
  }

  /**
   * Parses the file path from a BuildingLink document URL.
   * @param a - The anchor element of the document link
   * @param baseUrl - The base URL of the BuildingLink tenant
   * @returns An object containing the file ID, download URL, and view URL
   */
  getFileInfo(a: HTMLElement, baseUrl: string) {
    // get href
    const link = a.getAttribute("onclick") || a.getAttribute("href") || "";

    // Parse URL parts
    const regex = /[?&]([^=]+)=(\d+)/;
    const [_, paramName, fileId] = link.match(regex) || [];
    const isAptDocument = /documentid/i.test(paramName);

    // Get file paths
    const viewFile = isAptDocument ? "ViewAptDocument" : "viewlibdoc";
    const downloadFile = isAptDocument ? "GetAttachment" : "getFile";
    const visibility = isAptDocument ? DocumentVisibility.Unit : DocumentVisibility.Building;

    // Get file URL
    const getUrl = (filename: string) => new URL(`${filename}.aspx?${paramName}=${fileId}`, baseUrl).toString();

    // Return file listing
    return {
      visibility,
      title: a.text?.trim(),
      fileId: Number(fileId),
      viewUrl: getUrl(viewFile),
      downloadUrl: getUrl(downloadFile),
    } satisfies Partial<LibraryDocument>;
  }

  /**
   * Scrapes a single document's details from BuildingLink.
   * @param fileId - The ID of the document
   * @param visibility - The visibility of the document
   * @returns Promise<LibraryDocument> - A promise that resolves to the document details
   * @private
   */
  async document(fileId: number, visibility: DocumentVisibility) {
    // Build url
    const isBuildingDoc = visibility === DocumentVisibility.Building;
    const aspFile = isBuildingDoc ? "viewlibdoc" : "ViewAptDocument";
    const paramName = isBuildingDoc ? "id" : "documentid";

    // Fetch document
    const pathUrl = `Library/${aspFile}.aspx?${paramName}=${fileId}`;
    const { document, url: viewUrl } = await this.client.fetchTenantPage(pathUrl);

    // Get info rows
    const infoSelector = isBuildingDoc ? "#InfoContainer tr" : ".DocInfo .Inner2 div";
    const infoRows = document.querySelectorAll(infoSelector);

    // Get posted on and tags
    const [postedOnValue, tagsValue] = infoRows.map((el) => el.text?.split(":")[1] || "");

    // Get posted by and posted on
    const [postedBy, postedOn] = postedOnValue.split("on").map((s) => s.trim());

    // Initialize document
    const doc: LibraryDocument = {
      title: document.querySelector("h3")?.textContent?.trim() || "",
      tags: tagsValue.split(":").map((tag) => tag.trim()),
      postedOn: new Date(postedOn),
      visibility,
      postedBy,
      viewUrl,
    };

    // File details
    const fileLink = document.querySelector("a[href^=getFile]:last-child, a[href^=GetAttachment]:last-child");

    if (fileLink) {
      // Get file details
      const { fileId, downloadUrl, title: fileName } = this.getFileInfo(fileLink, viewUrl);

      // Assign file details to document
      Object.assign(doc, { fileId, fileName, downloadUrl, viewUrl });
    }

    return doc;
  }

  /**
   * Retrieves all document links from the BuildingLink library.
   * @param visibility - Optional parameter to filter documents by visibility (building or unit)
   * @param includeFileDetails - Optional parameter to include file details in the returned documents -- MUCH slower (default: false)
   * @yields {Promise<LibraryDocumentListing>} Yields promises that resolve to individual document listings
   */
  async *documents(
    visibility?: DocumentVisibility,
    includeFileDetails = false
  ): AsyncGenerator<Partial<LibraryDocument>> {
    const { document, url } = await this.client.fetchTenantPage("Library/Library.aspx");

    // Get all document links
    const anchors = document.querySelectorAll("tr.rgRow, tr.rgAltRow");

    for (const row of Array.from(anchors)) {
      const fileLink = row.querySelector(".ViewLink a[onclick]");
      if (fileLink) {
        // Yield file link info
        const info = this.getFileInfo(fileLink, url);

        if (!visibility || info.visibility === visibility) {
          yield includeFileDetails ? await this.document(info.fileId!, info.visibility) : info;
        }
      }
    }
  }
}
