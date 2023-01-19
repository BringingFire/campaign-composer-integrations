import { ModuleData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/packages.mjs';
import { DefaultApi } from 'campaign-composer-api';
import CampaignComposerBrowser from './apps/composer';
import CampaignComposerJournalBrowser from './apps/journal';
import CampaignComposerSceneBrowser from './apps/scene';

export interface CCModuleData extends Game.ModuleData<ModuleData> {
  composerBrowser: CampaignComposerBrowser;
  client: DefaultApi;
}
