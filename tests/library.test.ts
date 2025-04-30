import { BuildingLinkClient } from "../src/client";
import { DocumentVisibility, LibraryDocument } from "../src/library";

import { config } from "dotenv";
config({ path: ".env.test" });

const { BUILDINGLINK_USERNAME, BUILDINGLINK_PASSWORD } = process.env;

describe("BuildingLink Library", () => {
  if (!BUILDINGLINK_USERNAME || !BUILDINGLINK_PASSWORD) {
    throw new Error("Missing environment variables: BUILDINGLINK_USERNAME or BUILDINGLINK_PASSWORD");
  }

  let client: BuildingLinkClient;

  beforeAll(() => {
    // Initialize client with test credentials
    client = new BuildingLinkClient({
      username: BUILDINGLINK_USERNAME!,
      password: BUILDINGLINK_PASSWORD!,
    });
  });

  it("can get library listings", async () => {
    const library: Partial<LibraryDocument>[] = [];
    for await (const doc of client.library.documents()) {
      library.push(doc);
    }
    expect(library.length).toBeGreaterThan(0);
  });

  // Building visibility tests
  it("can filter building library listings", async () => {
    const library: Partial<LibraryDocument>[] = [];
    for await (const doc of client.library.documents(DocumentVisibility.Building)) {
      library.push(doc);
    }

    // Check that all documents are building documents
    expect(library.length).toBeGreaterThan(0);
    expect(library.every((doc) => doc.visibility === DocumentVisibility.Building)).toBe(true);
  });

  it("can get building document", async () => {
    for await (const info of client.library.documents(DocumentVisibility.Building)) {
      expect(info).toBeDefined();
      expect(info.visibility).toBe(DocumentVisibility.Building);

      const doc = await client.library.document(info.fileId!, DocumentVisibility.Building);
      expect(doc).toBeDefined();
      expect(doc!.visibility).toBe(DocumentVisibility.Building);
      break;
    }
  });

  it("can get building document with file details", async () => {
    for await (const doc of client.library.documents(DocumentVisibility.Building, true)) {
      expect(doc).toBeDefined();
      expect(doc.visibility).toBe(DocumentVisibility.Building);
      expect(doc.fileId).toBeDefined();
      expect(doc.downloadUrl).toBeDefined();
      expect(doc.fileName).toBeDefined();
      break;
    }
  });

  // Unit visibility tests
  it("can filter unit library listings", async () => {
    const library: Partial<LibraryDocument>[] = [];
    for await (const doc of client.library.documents(DocumentVisibility.Unit)) {
      library.push(doc);
    }

    // Check that all documents are unit documents
    expect(library.length).toBeGreaterThan(0);
    expect(library.every((doc) => doc.visibility === DocumentVisibility.Unit)).toBe(true);
  });

  it("can get unit document", async () => {
    for await (const info of client.library.documents(DocumentVisibility.Unit)) {
      expect(info).toBeDefined();
      expect(info.visibility).toBe(DocumentVisibility.Unit);

      const doc = await client.library.document(info.fileId!, DocumentVisibility.Unit);
      expect(doc).toBeDefined();
      expect(doc!.visibility).toBe(DocumentVisibility.Unit);
      break;
    }
  });

  it("can get unit document with file details", async () => {
    for await (const doc of client.library.documents(DocumentVisibility.Unit, true)) {
      expect(doc).toBeDefined();
      expect(doc.visibility).toBe(DocumentVisibility.Unit);
      expect(doc.fileId).toBeDefined();
      expect(doc.downloadUrl).toBeDefined();
      expect(doc.fileName).toBeDefined();
      break;
    }
  });
});
