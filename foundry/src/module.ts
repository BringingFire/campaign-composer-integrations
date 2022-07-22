import './styles/style.scss';
import { moduleName } from './ts/constants';
import CampaignComposerJournalBrowser from './ts/journal';
import CampaignComposerSceneBrowser from './ts/scene';
import BridgeSettings from './ts/settings';
import { CCModuleData } from './ts/types';

let module: CCModuleData;

Hooks.once('init', () => {
  if (!(game instanceof Game)) {
    throw 'game singleton not initialized';
  }

  console.log('Initializing Campaign Composer bridge');

  BridgeSettings.registerSettings();

  module = game.modules.get(moduleName) as CCModuleData;
  module.journalBrowser = new CampaignComposerJournalBrowser();
  module.sceneBrowser = new CampaignComposerSceneBrowser();
  BridgeSettings.updateModuleClient();
});

Hooks.on('renderJournalDirectory', (_: Application, html: JQuery) => {
  if (!(game instanceof Game)) {
    throw 'game singleton not initialized';
  }

  if (!game.user!.isGM) {
    return;
  }

  const button = $(`<button class="cc-sidebar-button" type="button">
    <img class="cc-sidebar-button-icon" src="modules/${moduleName}/assets/icons/bf-bw.png" title="Campaign Composer"/>
  </button>`);
  button.on('click', () => {
    module.journalBrowser.render(true);
  });
  html.find('.directory-header .action-buttons').append(button);
});

Hooks.on('renderSceneDirectory', (_: Application, html: JQuery) => {
  if (!(game instanceof Game)) {
    throw 'game singleton not initialized';
  }

  if (!game.user!.isGM) {
    return;
  }

  const button = $(`<button class="cc-sidebar-button" type="button">
    <img class="cc-sidebar-button-icon" src="modules/${moduleName}/assets/icons/bf-bw.png" title="Campaign Composer"/>
  </button>`);
  button.on('click', () => {
    module.sceneBrowser.render(true);
  });
  html.find('.directory-header .action-buttons').append(button);
});