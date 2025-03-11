import { Ref, ref } from "vue";

export default function useBlockPreviewModal(): ({
  getShouldShowBlockPreviewModal: () => boolean;
  toggleShouldShowBlockPreviewModal: (val?: boolean) => void;
  shouldShowBlockPreviewModal: Ref<boolean>;
})
{
  const blockPreviewModalStorageKey = 'showBlockPreviewModal';
  function getShouldShowBlockPreviewModal(): boolean
  {
    const val = localStorage.getItem(blockPreviewModalStorageKey);

    return (val && [true, 'true'].includes(val)) ? true : false;
  }
  function toggleShouldShowBlockPreviewModal(val?: boolean)
  {
    if(typeof val === 'boolean')
    {
      localStorage.setItem(blockPreviewModalStorageKey, `${val}`);
    }
    else
    {
      localStorage.setItem(
        blockPreviewModalStorageKey,
        `${!getShouldShowBlockPreviewModal()}`
      );
    }

    shouldShowBlockPreviewModal.value = getShouldShowBlockPreviewModal();
  }
  const shouldShowBlockPreviewModal = ref(getShouldShowBlockPreviewModal());

  return {
    getShouldShowBlockPreviewModal,
    toggleShouldShowBlockPreviewModal,
    shouldShowBlockPreviewModal,
	};
}
