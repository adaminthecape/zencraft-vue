import { Nullable } from 'src/types/generic';
import { defineStore, Store } from 'pinia';
import { Router, useRouter } from 'vue-router';
import { ticketHelpPages } from 'src/logic/help/TicketHelpPages';
import { defaultHelpPages, HelpPage, HelpStep } from 'src/logic/help/HelpPages';

export type HelpStore = Store & {
  router: ReturnType<typeof useRouter> | undefined;
  isModalOpen: boolean;
  allPages: HelpPage[];
  getCurrentPageData: HelpPage | undefined;
  getCurrentStepData: HelpStep | undefined;
  setPage: (value: number) => void;
  setStep: (newStepId: number) => void;
  canCurrentActionTrigger: () => boolean;
  setCurrentActionTriggered: () => void;
  runCurrentStepAction: () => void | Promise<void>;
  resetWizard: () => void;
  nextStep: () => void;
  prevStep: () => void;
  nextPage: () => void;
  prevPage: () => void;
  saveState: () => void;
  restoreState: () => void;
  toggleModal: (value?: boolean) => void;
  getIsAwaitingAction: (page: number, step: number) => boolean;
  setAwaitingAction: (value: boolean, page?: number, step?: number) => void;
  runActionIfAutomatic: () => void;
  addTextToStep: (text: string, stepId?: number, addIfExisting?: boolean) => void;
  isHelpActive: boolean;
  triggeredActions: Record<string, Record<string, number>>;
  awaitingActions: Record<`${number}-${number}`, boolean>;
  currentStepOnPage: number;
  currentHelpPage: number;
  isOverlayMode: boolean;
  isOverlayActive: boolean;
  toggleOverlayMode: () => void;
  runIfNotOverlayMode: (fn: (e?: unknown) => void) => ((e?: unknown) => void);
};

function getAnchor(name: string): Nullable<Element>
{
	const anchor = document.getElementById(`anchor__${name}`);

	console.log('anchor:', anchor);

	return anchor;
}

type HelpStoreRootState = {
  router: Router | undefined;
  isModalOpen: boolean;
  isOverlayMode: boolean;
  allPages: HelpPage[];
  currentHelpPage: number;
  currentStepOnPage: number;
  triggeredActions: Record<string, Record<string, number>>;
  /** [`{page#}-{step#}`]: [is being awaited] */
  awaitingActions: Record<`${number}-${number}`, boolean>;
};

const useHelpStore = (storeOpts: {
  router?: Router;
}) => defineStore('helpStore', {
	state: (): HelpStoreRootState =>
		({
			router: storeOpts.router,
			isModalOpen: false,
			isOverlayMode: false,
			allPages: [...defaultHelpPages, ...ticketHelpPages],
			currentHelpPage: 0,
			currentStepOnPage: 0,
			triggeredActions: {},
			awaitingActions: {},
		}),
	getters: {
		isHelpActive: (state) => state.currentHelpPage > 0,
		isOverlayActive: (state) => !!state.isOverlayMode,
		getCurrentPageData: (state) => state.allPages[state.currentHelpPage],
		getCurrentStepData: (state) =>
		{
			return state.allPages[state.currentHelpPage]?.steps?.find((step) => (
				step.id === state.currentStepOnPage
			));
		},
		getIsAwaitingAction: (state) => (page: number, step: number) =>
		{
			return state.awaitingActions[`${page}-${step}`];
		}
	},
	actions: {
		toggleModal(value?: boolean)
		{
			this.isModalOpen = typeof value === 'boolean' ?
				value :
				!this.isModalOpen;
		},
		saveState()
		{
			localStorage.setItem('help_store_state', JSON.stringify({
				isModalOpen: this.isModalOpen,
				triggeredActions: this.triggeredActions,
				currentHelpPage: this.currentHelpPage,
				currentStepOnPage: this.currentStepOnPage,
			}));
		},
		restoreState()
		{
			const stateString = localStorage.getItem('help_store_state');

			if(!stateString) return;

			try
			{
				const storedState = JSON.parse(stateString);

				if(!storedState) return;

				if(storedState.currentHelpPage && (
					storedState.currentHelpPage !== this.currentHelpPage
				))
				{
					this.setPage(storedState.currentHelpPage);
				}

				if(storedState.currentStepOnPage && (
					storedState.currentStepOnPage !== this.currentStepOnPage
				))
				{
					this.setStep(storedState.currentStepOnPage);
				}
			}
			catch(e)
			{
				console.log((e as Error)?.message);
				// do nothing
			}
		},
		setPage(value: number, firstOrLastStep: 'first' | 'last' = 'first')
		{
			let step = 0;

			if(firstOrLastStep === 'last')
			{
				step = (this.allPages[value]?.steps?.length ?? 0) - 1;
			}

			this.currentHelpPage = value;
			this.setStep(step);
			this.saveState();
		},
		setStep(newStepId: number)
		{
			this.currentStepOnPage = newStepId;
			this.saveState();
			this.runActionIfAutomatic();
		},
		canCurrentActionTrigger()
		{
			if(!this.getCurrentStepData?.actionCanTriggerMultipleTimes)
			{
				return !(
					this.triggeredActions[this.currentHelpPage]?.[this.currentStepOnPage]
				);
			}

			return true;
		},
		setCurrentActionTriggered()
		{
			const page = this.currentHelpPage;
			const step = this.currentStepOnPage;

			if(!this.triggeredActions[page])
			{
				this.triggeredActions[page] = {};
			}

			if(!this.triggeredActions[page][step])
			{
				this.triggeredActions[page][step] = 1;
			}
			else
			{
				this.triggeredActions[page][step] += 1;
			}
		},
		setAwaitingAction(value = true, page?: number, step?: number): void
		{
			if(!page && (page !== 0))
			{
				page = this.currentHelpPage;
			}

			if(!step && (step !== 0))
			{
				step = this.currentStepOnPage;
			}

			this.awaitingActions[`${page}-${step}`] = value;
		},
		async runCurrentStepAction()
		{
			if(!this.getCurrentStepData?.action)
			{
				return;
			}

			// check if already triggered (if it can only be triggered once)
			if(!this.canCurrentActionTrigger())
			{
				return;
			}

			this.setCurrentActionTriggered();
			const actionResult = this.getCurrentStepData.action(
        this as HelpStore,
        this.getCurrentStepData
			);

			if(actionResult instanceof Promise)
			{
				this.setAwaitingAction(true, this.currentHelpPage, this.currentStepOnPage);
				await actionResult;
				this.setAwaitingAction(false, this.currentHelpPage, this.currentStepOnPage);
			}
		},
		async runActionIfAutomatic()
		{
			if(this.getCurrentStepData && !this.getCurrentStepData.userTriggersAction)
			{
				await this.runCurrentStepAction();
			}
		},
		resetWizard()
		{
			this.setPage(0);
			this.setStep(0);
			this.triggeredActions = {};
			this.saveState();
		},
		nextStep()
		{
			const maxSteps = (
				this.allPages[this.currentHelpPage]?.steps?.length ?? 0
			);

			const next = this.getCurrentStepData?.next ?? (
				(this.currentStepOnPage ?? 0) + 1
			);

			if(Number.isInteger(next) && (next <= maxSteps))
			{
				this.setStep(next as number);
			}
		},
		prevStep()
		{
			const prev = this.getCurrentStepData?.prev ?? (
				(this.currentStepOnPage ?? 0) + 1
			);

			if(Number.isInteger(prev) && (prev >= 0))
			{
				this.setStep(prev as number);
			}
		},
		nextPage()
		{
			const maxPages = this.allPages.length;
			const next = this.currentHelpPage + 1;

			if((next < maxPages) && (this.currentHelpPage !== next))
			{
				this.setPage(next);
			}
		},
		prevPage()
		{
			const prev = this.currentHelpPage - 1;

			if((prev >= 0) && (this.currentHelpPage !== prev))
			{
				this.setPage(prev, 'last');
			}
		},
		addTextToStep(text: string, stepId?: number, addIfExisting?: boolean): void
		{
			if(!stepId && (stepId !== 0))
			{
				stepId = this.currentStepOnPage;
			}

			const step = this.allPages[this.currentHelpPage]?.steps?.find((s) => (
				s.id === stepId
			));

			if(step)
			{
				if(step.text.includes(text) && !addIfExisting)
				{
					return;
				}

				step.text = `${step.text}\r\n\r\n${text}`;
			}
		},
		toggleOverlayMode()
		{
			this.isOverlayMode = !this.isOverlayMode;
		},
		runIfNotOverlayMode(fn: ((e: unknown) => void))
		{
			if(this.isOverlayActive)
			{
				return (() =>
				{
					// do nothing
				});
			}

			return ((e: unknown) =>
			{
				fn(e);
			});
		},
	},
});

export default useHelpStore;
