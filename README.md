# 🏢 BuildingLink Client

This is an unofficial TypeScript client for logging into and scraping BuildingLink content.

## 🚀 Getting Started

Install the package using your favorite package manager.

```bash
# Using npm
npm install buildinglink
```

## 🎮 Usage

This client is essentially a wrapper around the native fetch API, which does an auto-login as needed and stores session cookies for you.

```typescript
import { BuildingLink } from "buildinglink";

const client = new BuildingLink({
  username: "buildinglink_username",
  password: "buildinglink_password",
});

// Get Deliveries
const url = "https://www.buildinglink.com/V2/Tenant/Deliveries/Deliveries.aspx";
const response = await client.fetch(url);

// Shorthand for tenant pages
const response = await client.page("Deliveries/Deliveries.aspx");
```

## 📦 Available Modules

| Module        | Method                            | Description                                               |
| ------------- | --------------------------------- | --------------------------------------------------------- |
| Library       | `getLibrary()`                    | Access documents from the BuildingLink Library            |
| Announcements | `getAnnouncements()`              | Access announcements from the BuildingLink                |
| Events        | `getEvents(from: Date, to: Date)` | Access events from the BuildingLink Calendar              |
| Occupant      | `getOccupant()`                   | Access the current occupant's profile                     |
| Buildings     | `getBuildings()`                  | Access buildings associated with the BuildingLink account |
| User          | `getUser()`                       | Access the current user signed into BuildingLink          |
| Vendors       | `getVendors()`                    | Access preferred vendors from the BuildingLink            |
| Deliveries    | `getDeliveries()`                 | Access deliveries from the BuildingLink                   |

## 📝 Scraping HTML

Since it's likely you'll be using this client for scraping, the response also includes a parsed version of the HTML document using `node-html-parser`. You can access it on html responses from the `document` property.

```typescript
const { document } = await client.page("Deliveries/Deliveries.aspx");

document.querySelectorAll(".delivery-item").forEach((item) => {
  const deliveryId = item.getAttribute("data-delivery-id");
  const deliveryDate = item.querySelector(".delivery-date")?.textContent;
  console.log(`Delivery ID: ${deliveryId}, Date: ${deliveryDate}`);
});
```

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
