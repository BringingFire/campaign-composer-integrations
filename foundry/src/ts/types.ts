import { ModuleData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/packages.mjs';
import { DefaultApi } from 'campaign-composer-api';
import CampaignComposerJournalBrowser from './journal';
import CampaignComposerSceneBrowser from './scene';

export interface CCModuleData extends Game.ModuleData<ModuleData> {
  journalBrowser: CampaignComposerJournalBrowser;
  sceneBrowser: CampaignComposerSceneBrowser;
  client: DefaultApi;
}
