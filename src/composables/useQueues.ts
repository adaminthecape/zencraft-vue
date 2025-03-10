import useQueueStore from "src/pinia/queueStore";
import { ref, onMounted, onBeforeUnmount, Ref } from "vue";
import { Store } from "pinia";

export function useQueues<IActionOpts = Record<string, unknown>>(options: {
  queueKey: string;
  queueAction: (opts: IActionOpts) => void;
}): ({
  queueStore: Store;
  queueKey: Ref<string>;
  updateQueueKey: (newKey: unknown) => void;
})
{
  const queueStore = useQueueStore();

  const queueKey = ref(options.queueKey);

  const queueKeysToDestroy = ref<string[]>([queueKey.value]);

  function setQueue()
  {
    if(queueKey.value)
    {
      queueStore.setQueue(
        queueKey.value,
        options.queueAction as ((opts: unknown) => void)
      );
    }
  }

  onMounted(setQueue);

  onBeforeUnmount(() => queueKeysToDestroy.value.forEach((k) =>
  {
    queueStore.destroyQueue(k);
  }));

  function updateQueueKey(newKey: unknown): void
  {
    if(newKey && typeof newKey === 'string')
    {
      queueKey.value = newKey;
      queueKeysToDestroy.value.push(queueKey.value);
      setQueue();
    }
  }

  return {
    queueStore,
    queueKey,
    updateQueueKey,
  };
};
