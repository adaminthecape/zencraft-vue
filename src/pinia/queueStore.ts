import { defineStore } from 'pinia';

type QueueHandlerData<IQueueItem> = {
  queueInterval: ReturnType<typeof setInterval> | undefined;
  queueCallbacks: Record<string, (queueItem: IQueueItem) => void>;
  queueKeys: string[];
  queues: Record<string, IQueueItem[]>;
  pollingRate: number;
};

class QueueHandler<IQueueItem = unknown> implements QueueHandlerData<IQueueItem>
{
  public queueInterval: ReturnType<typeof setInterval> | undefined;
  public queueCallbacks: Record<string, (queueItem: IQueueItem) => void>;
  public queueKeys: string[];
  public queues: Record<string, IQueueItem[]>;
  public pollingRate: number;

  constructor()
  {
    this.pollingRate = 250;
    this.queues = {};
    this.queueKeys = [];
    this.queueCallbacks = {};
  }

  public static getItem(name: string): string | null
  {
    return localStorage.getItem(name);
  }

  public static setItem(name: string, value: string): void
  {
    localStorage.setItem(name, value);
  }

  public static removeItem(name: string): void
  {
    localStorage.removeItem(name);
  }

  public getIsQueueActive(key: string)
  {
    return this.queueKeys.includes(key);
  }

  public getQueue(key: string)
  {
    return this.queues[key];
  }

  public toQueueKey(key: string): string
  {
    if(!key.startsWith('queue__'))
    {
      return `queue__${key}`;
    }

    return key;
  }

  public getParsedQueue(queueKey: string): Array<IQueueItem>
  {
    let queue: string[];

    try
    {
      queue = JSON.parse(QueueHandler.getItem(queueKey) || '[]');
    }
    catch(e)
    {
      queue = [];
    }

    return queue || [];
  }

  public consumeQueueItem(queueKey: string): void
  {
    const queue = this.getParsedQueue(queueKey);

    if(queue?.length)
    {
      const nextItem = queue.shift();

      // immediately save the rest once plucked
      QueueHandler.setItem(queueKey, JSON.stringify(queue));

      if(nextItem)
      {
        if(this.queueCallbacks[queueKey])
        {
          this.queueCallbacks[queueKey](nextItem);
        }
      }
    }
  }

  public watch(opts: {
    verbose?: boolean;
    pollingRate?: number;
  }): void
  {
    const { pollingRate } = opts;

    if(this.queueInterval && (this.pollingRate === pollingRate))
    {
      return;
    }

    if(this.queueInterval)
    {
      clearInterval(this.queueInterval);
    }

    this.pollingRate = pollingRate ?? 250;

    this.queueInterval = setInterval(() =>
    {
      if(!(Array.isArray(this.queueKeys) && this.queueKeys.length))
      {
        return;
      }

      for(const key of this.queueKeys)
      {
        this.consumeQueueItem(key);
      }
    }, this.pollingRate);
  }

  public setQueue(
    key: string,
    callback: (queueItem: IQueueItem) => void,
    opts?: {
      verbose?: boolean;
      pollingRate?: number;
    }
  ): boolean
  {
    const log = opts?.verbose ? console.log : () =>
    {
      // do nothing
    };

    log('Set queue:', key);

    const queueKey = this.toQueueKey(key);

    if(this.getIsQueueActive(queueKey))
    {
      log(`Queue ${key} is already being watched`);

      return false;
    }

    this.queueKeys.push(queueKey);
    this.queues[queueKey] = [];
    this.queueCallbacks[queueKey] = callback;

    log(`Queue ${key} is now being watched`);

    QueueHandler.setItem(queueKey, '[]');

    // ignored if already watching at this rate
    this.watch({
      verbose: opts?.verbose,
      pollingRate: opts?.pollingRate ?? this.pollingRate,
    });

    return true;
  }

  public destroyQueue(key: string): boolean
  {
    const queueKey = this.toQueueKey(key);

    if(!this.getIsQueueActive(queueKey))
    {
      return false;
    }

    this.queueKeys = this.queueKeys.filter((k) => k !== queueKey);
    delete this.queues[queueKey];
    delete this.queueCallbacks[queueKey];

    QueueHandler.removeItem(queueKey);

    return true;
  }

  public addToQueue(key: string, newItem: IQueueItem): boolean
  {
    const queueKey = this.toQueueKey(key);

    if(!this.getQueue(queueKey))
    {
      console.warn(`Failed to add to queue ${key}`);
      return false;
    }

    const queue = this.getParsedQueue(queueKey);

    queue.push(newItem);
    QueueHandler.setItem(queueKey, JSON.stringify(queue));

    return true;
  }
}

const useQueueStore = defineStore('queueStore', {
  state: () =>
  ({
    handler: new QueueHandler(),
  }),
  getters: {
    getIsQueueActive: (state) => (key: string) => state.handler.queueKeys.includes(key),
    getQueue: (state) => (key: string) => state.handler.queues[key],
  },
  actions: {
    toQueueKey(key: string): string
    {
      return this.handler.toQueueKey(key);
    },
    getParsedQueue(queueKey: string): Array<unknown>
    {
      return this.handler.getParsedQueue(queueKey);
    },
    consumeQueueItem(queueKey: string): void
    {
      this.handler.consumeQueueItem(queueKey);
    },
    watch(opts: {
      verbose?: boolean;
      pollingRate?: number;
    }): void
    {
      this.handler.watch(opts);
    },
    setQueue(
      key: string,
      callback: (queueItem: unknown) => void,
      opts?: {
        verbose?: boolean;
        pollingRate?: number;
      }
    ): boolean
    {
      return this.handler.setQueue(key, callback, opts);
    },
    destroyQueue(key: string): boolean
    {
      return this.handler.destroyQueue(key);
    },
    addToQueue(key: string, newItem: unknown): boolean
    {
      return this.handler.addToQueue(key, newItem);
    },
  },
});

export default useQueueStore;
