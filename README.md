## 🔥 Zencraft Intro
This is a data-driven no-code layout builder (or CMS-lite).

That means that any data you can represent with a spreadsheet (or JSON data) can be generated, manipulated, and stored (using the core package), and the front-end package is a system which interprets the `Block`, `Blueprint`, and `Archetype` classes into a layout builder system, with customisable layouts in the user-facing area, and an admin dashboard which allows admins to manage all existing data.

Note that this is not a production-ready system; it is a collection of interfaces which fulfill various features of a full-stack app. It is a personal project I created to hone and demonstrate my programming skills. It is fully functional, but it lacks security and monitoring features which would be relevant in a production system.

## 💡 Demo
There is a live demo available, which stores all data locally, and does not connect to an API. You are free to use it and change the data as you please, though your data will be limited to that particular device and browser. I am working to provide a secure cloud-based solution.

See the project in action at: https://www.adam-in-the-cape.web.app/

## 📊 Key Features
The core library (`zencraft-core`) contains:
- Database interfaces which manage data storage, filtering, and pagination, and connects to a storage solution of your choice (can be an external API, a MySQL database, Firebase, a cache, etc)
- Item handlers which manage retrieving, mutating, and storing JSON data objects of any shape, including validation according to a customisable set of fields
- Handlers for user permissions and access roles (role-based access control) - these permissions are tied to a user, a permission type, and (optionally) an ID, so they can be applied to almost anything on the system and used as you see fit
- A robust set of generic utilities
- Minimal dependencies - only `dotenv`, `mysql2`, `rimraf`, `ts-node`, `tsup`, `typescript`, and firebase.

The front-end app (`zencraft-vue`) contains:
- An admin dashboard to manage users, permissions, access roles, and all Items on the platform, including paginated and filtered searches
- A user-facing area with customisable layouts, driven by data from Items
- A clearly defined paradigm for adding additional components used in layouts
- An extensible, type-safe basic Pinia store which can provide caching and custom state logic for any Item type (plus 8 further Pinia stores, used for various core Item types, which extend this)
- A tutorial wizard with an easy system for adding new tutorials and/or demonstrations
- Some unnecessary code which was very fun to write, but can be ignored

## 🚀 Quick Start
1. Clone:
```bash
git clone https://github.com/adaminthecape/zencraft-core.git
git clone https://github.com/adaminthecape/zencraft-vue.git
```

2. Build:
```bash
cd zencraft-core
npm install
cd ../zencraft-vue
npm install
```

3. Run:
```bash
cd zencraft-vue
npm run dev
```

## 🤖 Workings
The core library (`zencraft-core`) contains:
- Database interfaces
    - A generic database interface which defines the basic types; this allows consistency between all database handlers so they can be hot-swapped
    - Handlers for database filters and pagination, so you don't have to guess at how to use them
    - Database handlers for:
        - MySQL
        - Firebase (Firestore/RTDB)
        - In-memory database
        - ~~IndexedDB via Dexie.js~~ (disabled due to RAM issues)
    - These can be further extended to, for example, implement a database handler which references a local cache, while working exactly the same way as other database handlers, and can be swapped to on the fly
- JSON data handlers
    - The base `Item` class provides a way to work with a standardised JSON data structure, containing essential data such as a unique ID, an item type, created date, updated date, etc. This is intended to be used with any  complex data structure on the platform. This standardised interface makes data handling very easy, regardless of the data shape or its source.
    - Some additional classes are provided which extend the `Item` class, and are essentially used to make customised layouts possible and easy.
    - The `Archetype` and `CustomItem` classes can be combined to validate incoming data according to customisable `Field` array. This means that you can define your Fields, attach them to an Item archetype, and use that custom Item anywhere without worrying about its data being incorrect - it will always follow the data structure defined by its Fields. This makes cross-environment data validation easy as well; you can simply send the requested changes to your API, have the API set the data with its handler, and any invalid data in the request will be ignored (or can be handled as you specify).
- User permission handlers
    - The `UserPermissions` class provides an interface for a permissions table which contains, essentially, passkeys tied to a user, an action, and (optionally) a scope. This is _not_ implemented within the core package, but is used in a separate (non-public) API. This is because a permissions system is opinionated and is designed to reject actions, whereas the data handling logic needs to be consistent and unrestricted. You may implement user permissions yourself if desired - you just need to give it a database handler which can access your stored permissions, and it provides methods for validating and assigning those permissions. There is also an `AccessRole` class, which is a simple RBAC implementation that uses the `UserPermissions` class to map a single passkey to a set of passkeys. In effect, a role is a bundle of permissions. This means that any number of roles can be created, with any combination of permissions, in any scope, such as a user who is allowed to view a single page and comment in a subset of discussions on that page. By assigning multiple permissions to a single role, the number of permission checks can be kept to a minimum.
- Utilities
    - Some generic tools and utilities are provided, to fulfill simple functions. Normally one would use external dependencies, but these are simple enough for dependencies to not be worth it; for example, validating a UUID, or generating a SQL-safe date.

The front-end app (`zencraft-vue`) contains:
- An admin dashboard to manage users, permissions, etc
    - In the dashboard, admins can view active users, suspend users, assign or suspend permissions, and change users' access roles.
    - Additionally, admins can view all Items on the platform, and create new ones, change existing ones, or simply search through tabulated data.
- A user-facing area with customisable layouts, driven by data from Items
    - In the user area, admins can create Hubs (which contain Pages), Pages (which contain Blocks), and Blocks, which render the selected component with the selected configuration.
    - Blocks can be styled with CSS (inline or with existing classes), and can accept Handlebars input as configuration, meaning almost any kind of data display is possible to create, not only what is provided with the built-in components. Data can be fetched (and automatically cached) in HTML components, making it possible to even create custom search components on the fly.
    - Making new layouts and layout components is easy, and clearly documented.
- A clearly defined paradigm for adding additional components used in layouts
- An extensible, type-safe basic Pinia store which can provide caching and custom state logic for any Item type (plus 8 further Pinia stores, used for various core Item types, which extend this)
- A tutorial wizard
    - The demo uses a tutorial wizard (not based on any external package), which uses a common pattern to open forms to edit items, demonstrating in real-time how an admin might construct the platform. This is built so that it can be modified as needed, so new tutorials can be easily created, or automated routines which modify Items programmatically.

## 📄 License
This package uses the MIT license.

All the code was written by me (Adam) as of March 2025.

## 🤝 Contributions
I would love for you to contribute, fork, or otherwise use this project for your 
needs. Please let me know that you've done so, and I will be happy to help you 
as much as I'm able to.
