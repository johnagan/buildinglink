import { BuildingLinkClient } from "../src/client";
import { LibraryDocument } from "../src/library";

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
    for await (const doc of client.library.listDocuments()) {
      expect(doc.fileName).toBeDefined();
      expect(doc.fileId).toBeDefined();
      expect(doc.downloadUrl).toBeDefined();
      expect(doc.viewUrl).toBeDefined();
      expect(doc.title).toBeDefined();
      expect(doc.tags).toBeDefined();
      expect(doc.postedBy).toBeDefined();
      expect(doc.postedOn).toBeDefined();

      break;
    }
  });
});
