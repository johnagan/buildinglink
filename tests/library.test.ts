import { BuildingLinkClient } from '../src/client';
import { DocumentVisibility, LibraryDocument } from '../src/library';

import { config } from 'dotenv';
config({ path: '.env.test' });

const { BUILDINGLINK_USERNAME, BUILDINGLINK_PASSWORD } = process.env;

describe('BuildingLink Library', () => {
  if (!BUILDINGLINK_USERNAME || !BUILDINGLINK_PASSWORD) {
    throw new Error('Missing environment variables: BUILDINGLINK_USERNAME or BUILDINGLINK_PASSWORD');
  }

  let client: BuildingLinkClient;

  beforeAll(() => {
    // Initialize client with test credentials
    client = new BuildingLinkClient({
      username: BUILDINGLINK_USERNAME!,
      password: BUILDINGLINK_PASSWORD!
    });
  });

  it('can get library listings', async () => {
    const library: Partial<LibraryDocument>[] = [];
    for await (const doc of client.library.documents()) {
      library.push(doc);
    }
    expect(library.length).toBeGreaterThan(0);
  });

  for (const visibility of [DocumentVisibility.Building, DocumentVisibility.Unit]) {
    // Filtered listings
    it(`can filter ${visibility} library listings`, async () => {
      const library: Partial<LibraryDocument>[] = [];
      for await (const doc of client.library.documents(visibility!)) {
        library.push(doc);
      }

      // Check that all documents are building documents
      expect(library.length).toBeGreaterThan(0);
      expect(library.every(doc => doc.visibility === visibility)).toBe(true);
    });

    // Document details for filtered visibility
    it(`can get ${visibility} document`, async () => {
      for await (const info of client.library.documents(visibility)) {
        expect(info).toBeDefined();
        expect(info.visibility).toBe(visibility);

        const doc = await client.library.document(info.fileId!, visibility);
        expect(doc).toBeDefined();
        expect(doc!.visibility).toBe(visibility);
        break;
      }
    });

    // Document details for filtered visibility with file details
    it(`can get ${visibility} document with file details`, async () => {
      for await (const doc of client.library.documents(visibility, true)) {
        expect(doc).toBeDefined();
        expect(doc.visibility).toBe(visibility);
        expect(doc.fileId).toBeDefined();
        expect(doc.downloadUrl).toBeDefined();
        expect(doc.fileName).toBeDefined();
        break;
      }
    });
  }
});
