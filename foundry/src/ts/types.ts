import { ModuleData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/packages.mjs';
import { DefaultApi } from 'campaign-composer-api';
import CampaignComposerBrowser from './journal';

export interface CCModuleData extends Game.ModuleData<ModuleData> {
  browser: CampaignComposerBrowser;
  client: DefaultApi;
}
