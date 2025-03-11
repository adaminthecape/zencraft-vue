import { HelpStore } from "src/pinia/helpStore";
import useQueueStore from "src/pinia/queueStore";
import { checkDataSource } from "src/models/api/DataSource";
import { Notify } from "quasar";
import { dbFilters } from "zencraft-core";
import { IndexedDbInterface } from "src/models/api/IndexedDbInterface";
import { ContextReference, ItemToEdit } from "src/types/generic";

export type HelpStep = {
  id: number;
  title: string;
  text: string;
  action?: (
    helpStore: HelpStore,
    targetStep: HelpStep
  ) => void | Promise<void>;
  userTriggersAction?: boolean;
  actionCta?: string;
  actionCanTriggerMultipleTimes?: boolean;
  next?: number;
  nextPage?: number;
  prev?: number;
  skip?: number;
  restart?: number;
  end?: number;
};

export type HelpPage = {
  id: number;
  title: string;
  text: string;
  steps: HelpStep[];
};

let queueStore: ReturnType<typeof useQueueStore> | undefined = undefined;

export function getQueueStore(): typeof queueStore
{
  if(!queueStore)
  {
    queueStore = useQueueStore();
  }

  return queueStore;
}

/**
 * Display a status message as a toast notification.
 * @param message
 * @param timeout
 */
export function setStatus(message: string, timeout?: number)
{
  Notify.create({
    message,
    icon: 'fas fa-clock',
    timeout: timeout ?? 5000,
    color: 'primary',
    position: 'bottom',
  });
}

export function queueAction(name: string, data: Record<string, unknown>)
{
  getQueueStore()?.addToQueue(name, data);
}

export function editItem(opts: ItemToEdit): void
{
  queueAction('edit_items', {
    ...opts,
    options: opts.options ?? { persistent: true },
  });
}

export function amendItem(opts: {
  itemId: string;
  newData?: Record<string, unknown>;
  actions?: {
    amend?: boolean;
    save?: boolean;
    close?: boolean;
  };
}): void
{
  if(opts?.itemId)
  {
    queueAction(`amend_item_form_${opts.itemId}`, {
      data: opts.newData,
      actions: !opts.actions ? {
        amend: true,
      } : {
        amend: opts.actions.amend,
        save: opts.actions.save,
        close: opts.actions.close,
      },
    });
  }
}

export function saveItem(itemId: string): void
{
  amendItem({ itemId, actions: { save: true }, });
}

export function closeItem(itemId: string): void
{
  amendItem({ itemId, actions: { close: true } });
}

export async function sleepMs(ms?: number): Promise<void>
{
  return new Promise((r) => setTimeout(r, ms ?? 0));
}

export type SleepFn = (ms?: number) => Promise<void>;
export const sleep: {
  ms: SleepFn;
  tiny: SleepFn;
  short: SleepFn;
  medium: SleepFn;
  long: SleepFn;
} = {
  ms: sleepMs,
  tiny: async () => sleepMs(250),
  short: async () => sleepMs(1000),
  medium: async () => sleepMs(2000),
  long: async () => sleepMs(4000),
};

/**
 * Open a form, and edit its data in multiple steps. This is intended to be a
 * visual representation of how a user might interact with the platform.
 * @param opts
 */
export async function editAndAmend(opts: {
  itemId: string;
  itemType: string;
  initialData?: Record<string, unknown>;
  amendments?: Array<{
    newData: Record<string, unknown>;
    onChanged?: (newData: Record<string, unknown>) => void | Promise<void>;
    delay?: number;
    status?: string;
    statusTimeout?: number;
  }>;
  delay?: number;
  delayFn?: SleepFn;
  doNotSave?: boolean;
  doNotClose?: boolean;
})
{
  const { itemId, itemType, initialData, amendments } = opts;
  const delay = opts.delayFn ?? (
    opts.delay ? () => sleep.ms(opts.delay) : sleep.medium
  );

  editItem({ id: itemId, typeId: itemType, initialData });
  await sleep.short();

  if(Array.isArray(amendments) && amendments.length)
  {
    for await(const amendment of amendments)
    {
      if(amendment.status)
      {
        setStatus(amendment.status, amendment.statusTimeout);
      }

      amendItem({ itemId, newData: amendment.newData });

      if(typeof amendment.onChanged === 'function')
      {
        const hookRes = amendment.onChanged(amendment.newData);

        if(hookRes instanceof Promise)
        {
          await hookRes;
        }
      }

      if(typeof amendment.delay === 'number')
      {
        await sleep.ms(amendment.delay);
      }
      else
      {
        await delay();
      }
    }
  }

  if(!opts.doNotSave)
  {
    saveItem(itemId);
    await delay();
  }

  if(!opts.doNotClose)
  {
    closeItem(itemId);
    await delay();
  }
}

async function getShouldImportEssentialData(): Promise<boolean>
{
  const dataSource = checkDataSource();

  if(dataSource.isIndexedDb)
  {
    const idb = new IndexedDbInterface({});

    const archetypes = await idb.selectMultiple({
      itemType: 'Archetype',
      filters: [{
        key: 'typeId',
        operator: dbFilters.DbFilterOperator.isEqual,
        value: 'Archetype',
      }]
    });

    return (archetypes?.results?.length > 0);
  }

  return false;
}

export const defaultHelpPages: HelpPage[] = [
  {
    id: 0,
    title: 'Welcome to the Help Wizard',
    text: 'This is the help wizard. It will guide you through the features of this page.',
    steps: [
      {
        id: 0,
        next: 1,
        title: 'Welcome!',
        text: 'Welcome to Zencraft! This wizard will guide you through some of \
the available features and how to use them. This platform is designed to be \
configured as anything which can represent data. That means it can be a CRM, \
a project management tool, a task tracker, or anything else you can think of.',
        action: async (store, step) =>
        {
          if(await getShouldImportEssentialData())
          {
            store.addTextToStep('We need to add some basic data to begin. \
Click "Next Page" below to get started.', step.id);

            step.next = 1;
            step.nextPage = undefined;
          }
        }
      },
      {
        id: 1,
        nextPage: 1,
        title: 'Add basic data',
        text: 'Click the button below to add some essential data to the platform.',
        userTriggersAction: false,
        actionCanTriggerMultipleTimes: false,
        actionCta: 'Import essential data',
        action: async (store: HelpStore, step: HelpStep) =>
        {
          await sleep.short();
          store.addTextToStep('For this demo, we will be storing the data \
locally, meaning you won\'t have to send your data to me for any reason.', step.id);
          const queueKey = 'upsert_default_data';
          queueAction(queueKey, { action: 'open' });
          await sleep.medium();
          queueAction(queueKey, { action: 'start' });
          await sleep.short();
          queueAction(queueKey, { action: 'destroy' });
        },
      },
    ],
  },
];
