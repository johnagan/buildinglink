# 🏢 BuildingLink Client

This is an unofficial TypeScript client for logging into and scraping BuildingLink content. Since BuildingLink doesn't have an official API and I other examples in GitHub used puppeteer, I decided to create a lightweight client for my own needs.

## 🚀 Getting Started

Install the package using your favorite package manager. We recommend `pnpm` because it's fast and efficient, just like your building's concierge (hopefully).

```bash
# Using npm
npm install buildinglink

# Using yarn
yarn add buildinglink

# Using pnpm (our favorite!)
pnpm add buildinglink
```

## 🎮 Usage

This client is essentially a wrapper around the native fetch API, which does an auto-login as needed and stores session cookies for you.

```typescript
import { BuildingLinkClient } from "buildinglink";

const client = new BuildingLinkClient({
  username: "buildinglink_username",
  password: "buildinglink_password",
});

// Get Deliveries
const url = "https://www.buildinglink.com/V2/Tenant/Deliveries/Deliveries.aspx";
const response = await client.fetch(url);

// Shorthand for tenant pages
const response = await client.fetchTenantPage("Deliveries/Deliveries.aspx");
```

Since it's likely you'll be using this client for scraping, the response also includes a parsed version of the HTML document using `node-html-parser`. You can access it on html responses from the `document` property.

```typescript
const { document } = await client.fetchTenantPage("Deliveries/Deliveries.aspx");

document.querySelectorAll(".delivery-item").forEach((item) => {
  const deliveryId = item.getAttribute("data-delivery-id");
  const deliveryDate = item.querySelector(".delivery-date")?.textContent;
  console.log(`Delivery ID: ${deliveryId}, Date: ${deliveryDate}`);
});
```

## 📦 Available Modules

### 📚 Library Module

The Library module allows you to access documents from the BuildingLink document library.

```typescript
import { BuildingLinkClient, DocumentVisibility } from "buildinglink";

const client = new BuildingLinkClient({
  username: "buildinglink_username",
  password: "buildinglink_password",
});

// documents() is an async generator function, so you can use it with for await
// to iterate through all documents (basic information only)
for await (const doc of client.library.documents()) {
  console.log(`Document Title: ${doc.title}`);
  console.log(`Document Visibility: ${doc.visibility}`);
  console.log(`View URL: ${doc.viewUrl}`);
}

// Only return building documents
for await (const doc of client.library.documents(DocumentVisibility.Building)) {
  console.log(`Building Document: ${doc.title}`);
}

// Only return unit documents
for await (const doc of client.library.documents(DocumentVisibility.Unit)) {
  console.log(`Building Document: ${doc.title}`);
}

// Get full details for documents (slower, but more information)
for await (const doc of client.library.documents(DocumentVisibility.Building, true)) {
  console.log(`Document: ${doc.title}`);
  console.log(`Posted By: ${doc.postedBy}`);
  console.log(`Posted On: ${doc.postedOn.toLocaleDateString()}`);
  console.log(`Tags: ${doc.tags.join(", ")}`);
  console.log(`Download URL: ${doc.downloadUrl}`);
}

// Get a specific document by ID and visibility
const buildingDoc = await client.library.document(12345, DocumentVisibility.Building);
const unitDoc = await client.library.document(67890, DocumentVisibility.Unit);

// Download a document file
if (buildingDoc.downloadUrl) {
  const response = await client.fetch(buildingDoc.downloadUrl);
  const fileBuffer = await response.arrayBuffer();
  // Now you can save or process the file
  console.log(`Downloaded ${buildingDoc.fileName}, size: ${fileBuffer.byteLength} bytes`);
}
```

### Document Properties

The `LibraryDocument` interface provides the following properties:

| Property    | Type               | Description                                            |
| ----------- | ------------------ | ------------------------------------------------------ |
| visibility  | DocumentVisibility | Whether the document is building-wide or unit-specific |
| title       | string             | The title of the document                              |
| tags        | string[]           | Array of tags associated with the document             |
| postedBy    | string             | Name of the user who posted the document               |
| postedOn    | Date               | Date when the document was posted                      |
| viewUrl     | string             | URL where the document can be viewed                   |
| revisedOn   | Date (nullable)    | Date when the document was last revised                |
| downloadUrl | string (nullable)  | URL to download the document                           |
| fileId      | number (nullable)  | File ID of the document                                |
| fileName    | string (nullable)  | Filename of the document                               |
| fileSize    | number (nullable)  | File size of the document                              |

## 🧪 Testing

```bash
# Run tests
pnpm test

# Watch mode for development
pnpm test:watch

# Get that sweet, sweet coverage report
pnpm test:coverage
```

## 🤝 Contributing

Found a bug? Want to add a feature? We'd love your help!

1. Fork it
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazingness'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT - Because sharing is caring! See [LICENSE](LICENSE) for more details.

## ⭐️ Show Your Support

If this package helped you automate your BuildingLink tasks, give it a star!

---

Made with ❤️ and ☕️ by a human who got tired of clicking through BuildingLink manually.
