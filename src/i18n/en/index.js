// This is just an example,
// so you can safely delete all default props below

export default {
  branding: {
    app: {
      name: 'Zencraft',
      description: 'A platform for creating and managing content',
    }
  },
  social: {
    actions: {
      share: 'Share',
      follow: 'Follow',
    },
    facebook: {
      title: 'Facebook'
    },
    instagram: {
      title: 'Instagram'
    },
  },
  firebase: {
    title: 'Firebase',
    config: {
      open: 'Set firebase config',
      applied: 'Firebase config applied',
      error: 'Firebase config error',
      unavailable: 'No Firebase config active',
      fields: {
        apiKey: 'API Key',
        authDomain: 'Auth Domain',
        databaseURL: 'Database URL',
        projectId: 'Project ID',
        storageBucket: 'Storage Bucket',
        messagingSenderId: 'Messaging Sender ID',
        appId: 'App ID',
        measurementId: 'Measurement ID',
      },
    },
  },
  generic: {
    buttons: {
      isEditing: 'Editing',
      edit: 'Edit',
      save: 'Save',
      delete: 'Delete',
      open: 'Open',
      close: 'Close',
      reset: 'Reset',
      submit: 'Submit',
      cancel: 'Cancel',
    },
  },
  user: {
    controls: {
      settings: 'Settings',
      themeMode: {
        current: 'Currently in {mode} mode',
        toggle: 'Toggle theme',
      },
      editMode: {
        isOn: 'Currently on',
        isOff: 'Currently off',
        toggle: 'Toggle edit mode',
      },
    },
  },
  layouts: {
    userFacingLayout: {
      title: 'Welcome',
    },
    adminDashboard: {
      title: 'Admin Dashboard',
    },
  },
  notifications: {},
  login: {
    goHome: 'Home',
    logIn: 'Log In',
    logOut: 'Log Out',
    register: 'Register',
    username: 'Username',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    submit: 'Log In',
    confirmPassword: 'Confirm Password',
    toast: {
      failure: 'Login failed',
      success: 'Logged in successfully'
    }
  },
  admin: {
    userPermissions: {
      title: 'Permissions',
      permissionStatus: {
        0: 'Unverified',
        1: 'Suspended',
        2: 'Active',
        3: 'Banned',
        4: 'Withdrawn',
      }
    },
    blocks: {
      controls: {
        edit: 'Edit',
        delete: 'Remove',
        printDebug: 'Log context',
      },
    },
  },
  forms: {
    itemFilters: {
      configure: 'Configure filters',
      rules: {
        addRule: 'Add a rule',
        addGroup: 'Add a group',
        title: 'Filter rules',
        group: 'Group',
        noRules: 'No filter rules defined',
        noGroupRules: 'No group rules defined',
      },
    },
    repeaters: {
      itemTitle: 'Item {index}',
      noItems: 'No items',
      add: 'Add',
      remove: 'Remove',
      confirmRemove: 'Confirm removal',
      showMore: 'Show {count} more',
    },
    itemInput: {
      confirmRemove: 'Confirm removal',
      tooltips: {
        searchFields: 'Search for an item to add ({itemType})',
        clearSelection: 'Clear selection',
      },
      noSelection: 'No selection',
    },
  },
  items: {
    id: 'ID: {id}',
    editingItem: 'Editing {title}',
  },
  tables: {
    actions: {
      title: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
    },
    permissions: {
      title: 'Permissions',
    },
    users: {
      title: 'Users',
    },
  },
  tours: {
    title: 'Tours',
    fields: {
      tourId: 'Tour ID',
      year: 'Year'
    }
  },
  bookings: {
    title: 'Bookings',
    fields: {
      tourId: 'Tour ID',
      year: 'Year'
    }
  },
  blocks: {
    library: {
      title: 'View All Blocks',
      selectBlock: 'Select',
      moreInfo: 'Info',
    },
    types: {
      testBlock: {
        title: 'Testing Block',
        description: 'An example of a block, created to prove the concept of a \
block library',
      },
      headlessItemSearch: {
        title: 'Item Search Container',
        description: 'Search for Items of a given ItemType, with predefined \
search filters, and custom displays for results or controls as desired.',
      },
      paletteTester: {
        title: 'Palette Tester',
        description: 'Test different colour palettes in the app.',
      },
      itemAvatar: {
        title: 'Item Avatar',
        description: 'Show a clickable chip with a title showing one field \
from an Item, which opens an editing form when clicked.',
      },
      tourCard: {
        title: 'Tour Card',
        description: 'Show basic information about a Tour.',
      },
      contextProvider: {
        title: 'Container',
        description: 'Contains other blocks.',
      },
      contextSelector: {
        title: 'Context Selector',
        description: 'Use a specified Block to choose an Item for the context \
container the Context Selector block is inside.',
      },
      itemInput: {
        title: 'Item Selector',
        description: 'Use an input to select an Item to use for context.',
      },
      itemFieldValue: {
        title: 'Item Field Value',
        description: 'Display data from an Item according to its field key.',
      },
      contextVoid: {
        title: 'Context Void',
        description: 'When placed inside a Context Provider, this will nullify \
the provided context, letting you override or ignore it as desired.',
      },
      tableColumns: {
        title: 'Table',
        description: 'Display descendant blocks in a table layout.',
      },
      fieldValueContextProvider: {
        title: 'Field Value Context Container',
        description: 'Provide a field value to descendants as context.',
      },
      itemListValue: {
        title: 'Item List Value',
        description: 'Display lists of information using custom layouts.',
      },
      fieldInput: {
        title: 'Field Input',
        description: 'Provides a way to modify the data for a given field of an Item.'
      },
      clickableList: {
        title: 'Clickable List',
        description: 'Displays a list of values, each of which can be clicked, \
which can be used with a Context Selector to manage values on the page.'
      },
      htmlContent: {
        title: "HTML",
        description: "Add custom HTML content, with the ability to reference context Item data."
      },
      newItemContext: {
        title: "New Item Context",
        description: "Provides context to the Page for a new Item of the specified type."
      },
      createNewItemAvatar: {
        title: "New Item Avatar",
        description: "Show an Item Avatar which, when clicked, opens a form to create a new Item of the specified type."
      }
    }
  },
  tutorial: {
    insertDefaults: {
      title: 'Insert Default Data',
      caption: 'We need to insert some default data into the database. This only needs to run once. Running it again is mostly harmless, though it may overwrite some changes you have made.',
    },
    pages: {},
    popovers: {
      test1: {
        title: 'Test 1',
        content: 'This is the first test popover',
      },
      addBlockButton: {
        title: 'Add Block Button',
        content: 'This button lets you add a Block to the page or container. \
Clicking this button will open the Block Library, where you can select a Block \
Definition which your new block will use.',
      },
      addPageButton: {
        title: 'Add Page Button',
        content: 'This button lets you add a Page to the current Module.',
      },
      editPageButton: {
        title: 'Edit Page Button',
        content: 'This button lets you edit the target Page.',
      },
    },
  },
  unknown: 'Unknown',
}
