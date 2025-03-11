import { Nullable } from "src/types/generic";
import { item, utils } from "zencraft-core";
import { HelpStore } from "src/pinia/helpStore";
import { useCustomItemStore } from "src/pinia/customItemStore";
import { deriveStoreForItemType } from "../utils/stores";
import { getCurrentSecond } from "src/models/api/ApiInterface";
import {
  closeItem,
  editAndAmend,
  editItem,
  HelpPage,
  HelpStep,
  saveItem,
  sleep,
} from "./HelpPages";

enum TicketType
{
  'bug' = 'bug',
  'feature' = 'feature',
  'chore' = 'chore'
}

enum TicketStatus
{
  'unstarted' = 'unstarted',
  'active' = 'active',
  'review' = 'review',
  'finished' = 'finished',
  'delivered' = 'delivered',
}

type TicketItemCustomProps = {
  title: Nullable<string>;
  description: Nullable<string>;
  deadline: Nullable<number>;
  status: Nullable<TicketStatus>;
  ticketType: Nullable<TicketType>;
  points: Nullable<number>;
  labels: Nullable<Array<TicketItem['id']>>;
  blockers: Nullable<Array<TicketItem['id']>>;
};

type TicketItem = item.Item & TicketItemCustomProps;

function getRandomDeadline()
{
  return Math.floor(
    (Date.now() + 1000 * 60 * 60 * 24 * (Math.random() * 30)) / 1000
  );
}

// Written by AI
export const exampleTickets: TicketItem[] = [
  {
    title: 'Fix login bug',
    description: 'Users are unable to log in due to a server-side validation error. Investigate and resolve the issue.',
    status: TicketStatus.unstarted,
    ticketType: TicketType.bug,
    points: 2,
    labels: [],
    blockers: []
  },
  {
    title: 'Implement user profile page',
    description: 'Create a new user profile page where users can view and edit their personal information.',
    status: TicketStatus.active,
    ticketType: TicketType.feature,
    points: 8,
    labels: [],
    blockers: []
  },
  {
    title: 'Refactor authentication hub',
    description: 'Refactor the authentication hub to improve code readability and maintainability.',
    status: TicketStatus.review,
    ticketType: TicketType.chore,
    points: 5,
    labels: [],
    blockers: []
  },
  {
    title: 'Optimize database queries',
    description: 'Analyze the current database queries and identify areas for optimization. This includes reviewing indexes, query structure, and potential caching mechanisms. The goal is to reduce the query execution time and improve overall application performance. Collaborate with the database administrator and backend team to implement the necessary changes and test the improvements.',
    status: TicketStatus.unstarted,
    ticketType: TicketType.chore,
    points: 8,
    labels: [],
    blockers: []
  },
  {
    title: 'Design new landing page',
    description: 'Create a new design for the landing page that aligns with the latest branding guidelines. The design should be modern, responsive, and user-friendly. Include sections for key features, customer testimonials, and a call-to-action. Work with the marketing team to ensure the content is compelling and with the frontend team to implement the design.',
    status: TicketStatus.unstarted,
    ticketType: TicketType.feature,
    points: 13,
    labels: [],
    blockers: []
  },
  {
    title: 'Fix payment gateway integration',
    description: 'Investigate and resolve issues with the payment gateway integration that are causing transaction failures. This includes reviewing the API documentation, checking the implementation code, and testing different scenarios to identify the root cause. Ensure that the payment process is smooth and reliable for all users.',
    status: TicketStatus.unstarted,
    ticketType: TicketType.bug,
    points: 5,
    labels: [],
    blockers: []
  },
].map((t) => ({
  ...t,
  id: utils.uuid.generateUuid(),
  deadline: getRandomDeadline(),
  updatedAt: Math.floor(Date.now() / 1000),
  createdAt: Math.floor(Date.now() / 1000),
  typeId: 'Ticket'
}));

const hubId = 'a5b48a8a-d120-4f9a-8e17-07eab24a9edf';

async function addExampleTickets(store: HelpStore)
{
  store.router?.push('/admin/items/Ticket');

  const itemStore = useCustomItemStore({})();

  await itemStore.loadDefinitions();

  await sleep.short();

  const itemType = 'Ticket';

  for(const ticket of exampleTickets)
  {
    editItem({
      itemType,
      itemId: ticket.id,
      initialData: ticket,
      options: { isNew: true }
    });
    await sleep.tiny();
    saveItem(ticket.id);
    await sleep.tiny();
    closeItem(ticket.id);
    await sleep.tiny();
  }

  store.router?.push('/admin/items/Field');
  await sleep.tiny();
  store.router?.push('/admin/items/Ticket');
}

async function addTicketDefinition(store: HelpStore, step: HelpStep)
{
  store.router?.push('/admin/items/Archetype');

  store.addTextToStep(
    'This is a form to edit a new Item Definition. We will use this to \
define a Ticket. We can change this later if we need to.',
    step.id
  );

  const itemId = '9815f0db-2909-46a8-9582-fc207366ea82';
  const itemType = 'Archetype';
  const finalData = {
    id: itemId,
    typeId: itemType,
    name: 'TicketPrototype',
    itemType: 'Ticket',
    attachedFields: [
      '7efd8d84-327d-4d78-b2eb-45aee65eef6e',
      '2c4f10d0-b5fb-4e51-8dbf-ce0e5cb3d354',
      '40e58841-0474-4b05-8603-d740a43bd4d6',
      '5459060f-29b1-4849-89d7-42a7049952c4',
      '0a8a5a64-66bb-4707-bb56-d4985c423928',
      '0a726ef2-0117-42a1-aae7-58f6c1bf2877',
      'd1666dcc-5030-4ebe-80d0-fc7d52b05a22',
      '14ac1168-bb6a-4d16-b4b6-921b3f89940a',
      '2e8d9917-d24c-4a51-a23e-5fbcf712e6ba'
    ]
  };

  const emptyData = Object.keys(finalData).reduce((acc, key) =>
  {
    acc[key] = null;

    return acc;
  }, {} as Record<string, unknown>);

  await editAndAmend({
    itemType,
    itemId,
    initialData: emptyData,
    amendments: [
      {
        status: 'Adding name',
        newData: {
          name: finalData.name
        },
        onChanged: () =>
        {
          store.addTextToStep('We will give it a name and an item type, so \
we can separate it from other Items.', step.id);
        }
      },
      {
        status: 'Adding item type',
        newData: {
          itemType: finalData.itemType
        },
        onChanged: () =>
        {
          store.addTextToStep('We will give it some fields ...', step.id);
        }
      },
      ...finalData.attachedFields.map((fieldId, index) => ({
        delay: 200,
        newData: {
          attachedFields: finalData.attachedFields.slice(0, index + 1),
        },
      })),
    ],
  });

  await editAndAmend({
    itemType,
    itemId,
    amendments: [{ newData: finalData }],
    delayFn: sleep.tiny,
  });

  store.addTextToStep('Now we can start using Tickets.', step.id);
}

async function createAllTicketsPage(store: HelpStore, step: HelpStep)
{
  // open the page editor
  store.addTextToStep('This is a form to edit a new Page in the \
current layout.', step.id);

  store.addTextToStep('We will give it a name, which will be \
displayed to users, and a slug, which is used in the URL.', step.id);

  await editAndAmend({
    itemType: 'Page',
    itemId: pageData.allTickets.id,
    initialData: {
      title: '',
      slug: '',
      blockIds: null
    },
    amendments: [
      {
        status: 'Adding name',
        newData: { title: 'All Tickets' },
      },
      {
        status: 'Adding slug',
        newData: { slug: 'all-tickets' },
        onChanged: async () =>
        {
          store.addTextToStep('Now we save the Page, and we can start \
adding Blocks to it.', step.id);
        }
      },
      {
        status: 'Adding block',
        newData: {
          blockIds: [blockDataByPage.allTickets.searchContainer.id]
        },
      },
    ],
  });

  store.router?.push(`/${hubId}/${pageData.allTickets.id}`);
}

const pageData = {
  allTickets: {
    id: 'e3fded76-d57d-4d45-b367-d1ec7bfd1f8f',
    typeId: 'Page',
    updatedAt: 1740581022625,
    createdAt: undefined,
    createdBy: undefined,
    title: 'All Tickets',
    slug: 'all-tickets',
    blockIds: null
  },
  activeBugs: {
    id: '95b74913-7222-4991-b9e6-6d69d00b991e',
    typeId: 'Page',
    updatedAt: getCurrentSecond(),
    createdAt: getCurrentSecond(),
    createdBy: undefined,
    title: 'Active Bugs',
    slug: 'active-bugs',
    blockIds: null
  }
};

const htmlContent = {
  searchResult: "{{#if result}}<div class=\"row items-start justify-between no-wrap q-ma-sm\">\n  <div\n    class=\"flex-col q-pa-sm\"\n    style=\"flex-grow:10;\"\n  >\n    <div class=\"row items-center q-mb-sm\">\n      <div class=\"text-h6\"><span class=\"text-secondary text-bold q-mr-sm\">{{ result.ticketType }}</span>{{ result.title }}</div>\n      <div class=\"q-space\" />\n      {{component 'ItemAvatar' 'itemId' result.id 'itemType' result.typeId 'labelOverride' 'Edit'}}\n    </div>\n    <div class=\"standout-0 q-pa-sm\">{{ result.description }}</div>\n  </div>\n  <div\n    class=\"flex-col q-pa-sm\"\n    style=\"max-width: 400px;flex-grow:0;\"\n  >\n    <div class=\"row no-wrap items-center justify-between standout-1 q-py-xs q-px-sm q-mb-sm\">\n      <span class=\"text-caption text-accent q-mr-sm\">Created</span>\n      <span>{{ date result.createdAt }}</span>\n    </div>\n    <div class=\"row no-wrap items-center justify-between standout-1 q-py-xs q-px-sm q-mb-sm\">\n      <span class=\"text-caption text-accent q-mr-sm\">ID</span>\n      <span>{{ shortenId result.id }}</span>\n    </div>\n    <div class=\"row no-wrap items-center justify-between standout-1 q-py-xs q-px-sm q-mb-sm\">\n      <span class=\"text-caption text-accent q-mr-sm\">Points</span>\n      <span>{{ result.points }}</span>\n    </div>\n    <div class=\"row no-wrap items-center justify-between standout-1 q-py-xs q-px-sm q-mb-sm\">\n      <span class=\"text-caption text-accent q-mr-sm\">Status</span>\n      <span>{{ result.status }}</span>\n    </div>\n    <div class=\"row no-wrap items-center justify-between standout-1 q-py-xs q-px-sm q-mb-sm\">\n      <span class=\"text-caption text-accent q-mr-sm\">Type</span>\n      <span>{{ result.ticketType }}</span>\n    </div>\n    <div class=\"row no-wrap items-center justify-between standout-1 q-py-xs q-px-sm q-mb-sm\">\n      <span class=\"text-caption text-accent q-mr-sm\">Deadline</span>\n      <span>{{ date result.deadline }}</span>\n    </div>\n    <div class=\"row no-wrap items-center justify-between standout-1 q-py-xs q-px-sm q-mb-sm\">\n      <span class=\"text-caption text-accent q-mr-sm\">Updated</span>\n      <span>{{ date result.updatedAt }}</span>\n    </div>\n  </div>\n</div>{{/if}}"
};

const blueprintIds = {
  searchContainer: '3a0740bc-ecf5-4900-af95-737090ecf469',
  searchResult: 'f6324cb3-4464-4931-869d-2a95bd734082',
};

const blockDataByPage = {
  allTickets: {
    searchContainer: {
      id: '241879d6-77a5-45ba-a5cc-ed16a4704ec9',
      typeId: 'Block',
      updatedAt: getCurrentSecond(),
      createdAt: 1740581152,
      createdBy: undefined,
      title: 'Search All',
      blueprintId: blueprintIds.searchContainer,
      childBlocks: [
        { id: 'e3bffc72-e142-40ca-9c79-1f87e0a967f1', col: '0', row: '0' }
      ],
      config: {
        targetItemType: 'Ticket',
        title: 'Search Tickets',
        searchFilters: null
      }
    },
    searchResult: {
      id: 'e3bffc72-e142-40ca-9c79-1f87e0a967f1',
      typeId: 'Block',
      updatedAt: getCurrentSecond(),
      title: 'Ticket Search Result',
      blueprintId: blueprintIds.searchResult,
      config: {
        htmlContent: htmlContent.searchResult
      },
      customClasses: "q-ma-md"
    },
  },
  activeBugs: {
    searchContainer: {
      id: '0b14e8df-58a6-48b8-8a24-89cc3ff4de1f',
      typeId: 'Block',
      updatedAt: getCurrentSecond(),
      createdAt: 1740581152,
      createdBy: undefined,
      title: 'Search All',
      blueprintId: blueprintIds.searchContainer,
      childBlocks: null,
      config: {
        targetItemType: 'Ticket',
        title: 'Search Tickets',
        searchFilters: null
      }
    },
    searchResult: {
      id: 'ff83a94a-7e47-48e3-9c51-a8bad4176320',
      typeId: 'Block',
      updatedAt: getCurrentSecond(),
      title: 'Bug Search Result',
      blueprintId: blueprintIds.searchResult,
      childBlocks: null,
      config: {
        htmlContent: htmlContent.searchResult
      },
      customClasses: "q-ma-md"
    },
  },
};

async function createBugSearchPage(store: HelpStore)
{
  const pageStore = deriveStoreForItemType('Page');
  const hubStore = deriveStoreForItemType('Hub');
  const blockStore = deriveStoreForItemType('Block');

  await pageStore.saveItem({
    id: pageData.activeBugs.id,
    itemType: 'Page',
    isNew: true,
    data: {
      title: 'Bugs In Progress',
      slug: 'bugs-in-progress',
    }
  });

  await sleep.short();

  const existingData = await hubStore.loadItem({ id: hubId, itemType: 'Hub' });
  let pageIds = [pageData.activeBugs.id];

  if(
    existingData &&
    ('pageIds' in existingData) &&
    Array.isArray(existingData.pageIds)
  )
  {
    pageIds = [...existingData.pageIds, pageData.activeBugs.id];
  }

  await editAndAmend({
    itemId: hubId,
    itemType: 'Hub',
    initialData: existingData,
    amendments: [{
      status: 'Adding page to hub',
      statusTimeout: 5000,
      newData: { pageIds },
      onChanged: (newData) =>
      {
        console.log('saved new pageIds!', newData);
      },
    }],
  });

  store.router?.push(`/${hubId}/${pageData.activeBugs.id}`);

  // now we need to add a search block to the page
  await editAndAmend({
    itemId: pageData.activeBugs.id,
    itemType: 'Page',
    initialData: pageData.activeBugs,
    amendments: [
      {
        status: 'Adding search block to page',
        newData: { blockIds: [blockDataByPage.activeBugs.searchContainer.id] },
      }
    ]
  });

  // now add/edit the search block
  await editAndAmend({
    itemId: blockDataByPage.activeBugs.searchContainer.id,
    itemType: 'Block',
    initialData: blockDataByPage.activeBugs.searchContainer,
    amendments: [
      {
        status: 'Adding result block to search block',
        newData: {
          childBlocks: [
            { id: blockDataByPage.activeBugs.searchResult.id, col: 0, row: 0 }
          ]
        },
      }
    ]
  });


  await blockStore.loadItem({
    id: blockDataByPage.activeBugs.searchResult.id,
    itemType: 'Block',
  });

  // now add/edit the search result block
  await editAndAmend({
    itemId: blockDataByPage.activeBugs.searchResult.id,
    itemType: 'Block',
    initialData: blockDataByPage.activeBugs.searchResult,
    amendments: [
      {
        status: 'Adding html content to result block',
        newData: {
          config: {
            htmlContent: htmlContent.searchResult
          }
        },
      }
    ]
  });
}

async function addBasicTicketSearchBlock(store: HelpStore, step: HelpStep)
{
  await store.router?.push(`/${hubId}/${pageData.allTickets.id}`);

  await sleep.short();

  store.addTextToStep('We will add a Search Container block. This \
lets us search for existing tickets.', step.id);

  await sleep.short();

  store.addTextToStep('We will add a Search Container block. This \
lets us search for existing tickets.', step.id);

  await sleep.short();

  await editAndAmend({
    itemType: 'Page',
    itemId: pageData.allTickets.id,
    initialData: pageData.allTickets,
    amendments: [
      {
        status: 'Adding search block to page',
        newData: { blockIds: [blockDataByPage.allTickets.searchContainer.id] },
      }
    ]
  });

  store.addTextToStep('We will configure the block to show all tickets \
available.', step.id);

  await editAndAmend({
    itemType: 'Block',
    itemId: blockDataByPage.allTickets.searchContainer.id,
    initialData: blockDataByPage.allTickets.searchContainer,
    amendments: [
      {
        status: 'Adding result block to search block',
        newData: {
          childBlocks: [
            { id: blockDataByPage.allTickets.searchResult.id, col: 0, row: 0 }
          ]
        },
      }
    ],
  });

  store.addTextToStep('Next, we add a result block to the container, \
so we can have a custom display for each search result.', step.id);

  await editAndAmend({
    itemType: 'Block',
    itemId: blockDataByPage.allTickets.searchResult.id,
    initialData: {
      ...blockDataByPage.allTickets.searchResult,
      config: {
        htmlContent: ''
      }
    },
    amendments: [
      {
        status: 'Adding html content to result block',
        newData: {
          config: {
            htmlContent: htmlContent.searchResult
          }
        },
        onChanged: () =>
        {
          store.addTextToStep('We add some styling and formatting (which can \
be done with HTML/CSS), for a basic user-friendly layout.', step.id);
        }
      }
    ],
  });
}

export const ticketHelpPages: HelpPage[] = [
  {
    id: 1,
    title: 'Basic Setup',
    text: 'First we need to ensure there are users, and those users have \
permission to do things on the platform.',
    steps: [
      {
        id: 0,
        next: 1,
        title: 'Admin Dashboard',
        text: 'Let\'s visit the Admin Dashboard. Click below to go there.',
      },
      {
        prev: 0,
        id: 1,
        next: 2,
        title: 'Users',
        text: 'Here we see some users on the platform. From here, and from \
other dashboard pages, admins can manage users, roles, and permissions.',
        actionCanTriggerMultipleTimes: true,
        action: (store) =>
        {
          store.router?.push('/admin/users');
        },
      },
      {
        prev: 1,
        id: 2,
        next: 3,
        title: 'Permissions',
        text: 'Here we can ensure that only certain users can access the admin \
dashboard, and other parts of the platform. For example, an admin might be \
able to create new Items, but a regular user is not.',
        actionCanTriggerMultipleTimes: true,
        action: (store) =>
        {
          store.router?.push('/admin/permissions');
        },
      },
      {
        prev: 2,
        id: 3,
        next: 4,
        title: 'Fields',
        text: 'Now we need to interact with data. These are Fields, which let \
us interact with individual data properties (or other Items). These are used \
to construct Item Definitions.',
        actionCanTriggerMultipleTimes: true,
        action: (store) =>
        {
          store.router?.push('/admin/items/Field');
        },
      },
      {
        prev: 3,
        id: 4,
        next: 5,
        title: 'Item Definitions',
        text: 'Item Definitions define data structures used on the platform. \
These are constructed using Fields, and contain a list of Fields which make up \
the things you can interact with.',
        actionCanTriggerMultipleTimes: true,
        action: (store) =>
        {
          store.router?.push('/admin/items/Archetype');
        },
      },
      {
        prev: 4,
        id: 5,
        next: 6,
        title: 'Adding an Item Definition',
        text: 'For the purposes of this demo, we will add a new definition for \
a Ticket. This will allow us to track support requests for our made up client.',
        actionCanTriggerMultipleTimes: false,
        action: addTicketDefinition,
      },
      {
        prev: 5,
        id: 6,
        next: 7,
        title: 'Editing Items',
        text: 'Since Items are defined using Fields, we can edit them in a \
similar way using a standard form. This is useful for managing Item data with \
all the fields we have available. You can also make custom layouts to interact \
with data in a more user-friendly way.',
        actionCanTriggerMultipleTimes: true,
        userTriggersAction: true,
        actionCta: 'Edit the Archetype definition',
        action: async (store, step) =>
        {
          store.router?.push('/admin/items/Archetype');

          const itemId = 'ecfda6ee-7d55-47d3-a2fd-da7b621c8679';
          const itemType = 'Archetype';

          editItem({ itemType, itemId });

          store.addTextToStep(
            'You don\'t have to worry about what this means right now. This \
just demonstrates how everything on the system can be edited in a similar way.',
            step.id
          );
        },
      },
      {
        prev: 6,
        id: 7,
        nextPage: 2,
        title: 'Adding Items',
        text: 'Before we continue, we can add some Tickets. These will show up \
later, when we start to display data in a layout.',
        actionCanTriggerMultipleTimes: false,
        userTriggersAction: true,
        actionCta: 'Add Tickets',
        action: addExampleTickets,
      },
    ],
  },
  {
    id: 2,
    title: 'Layouts',
    text: 'Now that we have some data, we can start to display it in a way that \
makes sense to users.',
    steps: [
      {
        id: 0,
        next: 1,
        title: 'Introduction',
        text: 'Layouts define how data is displayed to users. They can be \
customized to show different fields, and in different ways.',
        actionCanTriggerMultipleTimes: true,
        action: (store) =>
        {
          store.router?.push(`/${hubId}/`);
        },
      },
      {
        id: 1,
        prev: 0,
        next: 2,
        title: 'Pages',
        text: 'We have created a default layout for you, but we will need to \
add a Page to it. This Page will give us a place to add Blocks, which are \
the basic parts of a layout. We will add some blocks shortly.',
        actionCanTriggerMultipleTimes: false,
        action: createAllTicketsPage,
      },
      {
        id: 2,
        prev: 1,
        next: 3,
        title: 'Blocks',
        text: 'With our basic layout set up, we can do something more specific \
and useful with our data. Let\'s add some Blocks to the Page we just created.',
        actionCanTriggerMultipleTimes: false,
        action: addBasicTicketSearchBlock,
      },
      {
        prev: 2,
        id: 3,
        next: 4,
        title: 'Customization',
        text: 'We have created a search page for Tickets, but it just shows \
all of them. Let\'s add a page to show only bugs that are in progress.',
        userTriggersAction: true,
        actionCta: 'Create a bug search page',
        actionCanTriggerMultipleTimes: true,
        action: createBugSearchPage,
      },
      {
        prev: 3,
        id: 4,
        nextPage: 3,
        title: 'Moving forward',
        text: 'We now have a basic layout set up. You can customize this to \
your liking, and add more Blocks to display different data. You can also \
create new Pages to display different data sets. In the next section, we will \
look at how to interact with layouts in more detail.',
      },
    ],
  },
  {
    id: 3,
    title: 'More Info',
    text: 'Here are some helpful tips for using the platform.',
    steps: [
      {
        id: 0,
        next: 1,
        title: 'Introduction',
        text: 'Now that we have seen how pages, blocks, and items work, we can \
think about more complex interactions. For example, we can add buttons to \
blocks to trigger actions, or add forms to edit data. There is also a feature \
in development to add custom triggers, which will allow for even more complex \
interactions.',
      },
      {
        prev: 0,
        id: 1,
        nextPage: 4,
        title: 'Possibilities',
        text: 'In this demo, we have created a simple system to track support \
requests. However, this platform can be used for many other things. As an \
example, you could even create a game, in which obtainable objects (i.e. loot) \
are stored as Items, and the player\'s inventory is a Page. This is just one \
example; essentially anything which can be represented with data can be \
configured in this platform.',
      },
    ],
  },
  {
    id: 4,
    title: 'Technical Info',
    text: 'More technically advanced information about the platform and how it works.',
    steps: [
      {
        id: 0,
        next: 1,
        title: 'Introduction',
        text: 'Now that we have seen how pages, blocks, and items work, we can \
think about more complex interactions. For example, we can add buttons to \
blocks to trigger actions, or add forms to edit data. There is also a feature \
in development to add custom triggers, which will allow for even more  complex \
interactions.',
      },
      {
        prev: 0,
        id: 1,
        next: 2,
        title: 'Possibilities',
        text: 'In this demo, we have created a simple system to track support \
requests. However, this platform can be used for many other things. As an \
example, you could even create a game, in which obtainable objects (i.e. loot) \
are stored as Items, and the player\'s inventory is a Page. This is just one \
example; essentially anything which can be represented with data can be \
configured in this platform.',
      },
      {
        prev: 1,
        id: 2,
        next: 3,
        title: 'Tech Stack',
        text: 'Let\'s take a look at the tech stack used to build this platform. \
The front end is built with Vue.js and Quasar, and the back end is built with \
Node.js and Express. The database is configurable; for this demo, we are using \
local storage, which is a fast (but limited) storage solution which only exists \
on your computer. Other versions of this platform connect to an Express API, \
which then connects to a MySQL database. It is also possible to connect to a \
the cloud via Firebase Firestore. The architecture of the platform allows for \
changing between storage solutions at will, so multiple solutions can be used \
at once for different types of data.',
      },
      {
        prev: 2,
        id: 3,
        next: 4,
        title: 'Items',
        text: 'The Item system is the core of the platform. Any complex (JSON) \
data can be stored as an Item. The basis for this is in code is the Item class, \
which contains a few essential methods and properties common to any Item, but \
can be extended to include custom methods and properties. For example, the \
Archetype class is a subclass of Item which contains a list of Fields, \
which are used to define the structure of a custom Item. By keeping the data \
structure consistent, we can ensure that everywhere we use Items, we can \
interact with them in a similar way.',
      },
      {
        prev: 3,
        id: 4,
        next: 5,
        title: 'Archetypes',
        text: 'The Archetype is, at its core, an Item with a list of \
Fields. These Fields determine the shape of data that can be stored with the \
Item. Only the Fields specified on an Archetype will allow data to be \
stored, and their validation options determine what data will be rejected. \
In this way, we can both prevent users from seeing bad data, and ensure that \
only valid data is stored. This makes the back end and front end easier to \
reconcile, and greatly reduces the number of potential bugs.',
      },
      {
        prev: 4,
        id: 5,
        next: 6,
        title: 'State Management',
        text: 'This app uses Pinia for state management, which allows for a \
centralized store of data which can be accessed from anywhere in the app. \
In order to work with Items, which can be very generic, we have created a \
Pinia store factory which can create a store for any Item type. This is \
essentially reusable code which gives us access to all the basic necessities \
for manipulating and caching Items in the front end, which also allows for \
custom logic to be added for specific Item types.',
      },
    ],
  },
];
