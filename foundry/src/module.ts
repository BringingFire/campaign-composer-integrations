import * as api from 'campaign-composer-api';
import { moduleName } from './constants';
import CampaignComposerBrowser from './journal';
import BridgeSettings from './settings';
import './style.scss';
import { CCModuleData } from './types';

let module: CCModuleData;

Hooks.once('init', () => {
  if (!(game instanceof Game)) {
    throw 'game singleton not initialized';
  }

  console.log('Initializing Campaign Composer bridge');

  BridgeSettings.registerSettings();

  module = game.modules.get(moduleName) as CCModuleData;
  module.browser = new CampaignComposerBrowser();

  module.client = new api.DefaultApi(
    new api.Configuration({
      basePath: BridgeSettings.apiUrl,
      apiKey: BridgeSettings.apiKey,
    }),
  );
});

Hooks.on('renderJournalDirectory', (_: Application, html: any, __: any) => {
  if (!(game instanceof Game)) {
    throw 'game singleton not initialized';
  }

  if (!game.user!.isGM) {
    return;
  }

  const button = $(`<button class="cc-journal-button" type="button">
    <img class="cc-journal-button-icon" src="modules/${moduleName}/assets/icons/bf-bw.png" title="Campaign Composer"/>
  </button>`);
  button.on('click', (_) => {
    module.browser.render(true);
  });
  html.find('.directory-header .action-buttons').append(button);
});
