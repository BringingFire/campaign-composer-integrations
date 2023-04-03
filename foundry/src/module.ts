import './styles/style.scss';
import CampaignComposerBrowser from './ts/apps/composer';
import SvelteTest from './ts/apps/composer';
import { moduleName } from './ts/constants';
import BridgeSettings from './ts/settings';
import type { CCModuleData } from './ts/types';

let module: CCModuleData;

Hooks.once('init', () => {
  if (!(game instanceof Game)) {
    throw 'game singleton not initialized';
  }

  console.log('Initializing Campaign Composer bridge');

  BridgeSettings.registerSettings();

  module = game.modules.get(moduleName) as CCModuleData;
  module.composerBrowser = new CampaignComposerBrowser();
  module.svelteTest = new SvelteTest();
  BridgeSettings.updateModuleClient();
});

function insertImportButton(_: Application, html: JQuery) {
  if (!(game instanceof Game)) {
    throw 'game singleton not initialized';
  }

  if (!game.user!.isGM) {
    return;
  }

  const button = $(`<button class="cc-sidebar-button" type="button">
    <img class="cc-sidebar-button-icon" src="modules/${moduleName}/assets/icons/bf-bw.png" title="Campaign Composer"/>
    Campaign Composer Import
  </button>`);
  button.on('click', () => {
    // module.composerBrowser.fetchLists();
    module.svelteTest.render(true);
  });
  html.find('.directory-header .action-buttons').append(button);
}

Hooks.on('renderJournalDirectory', insertImportButton);
Hooks.on('renderSceneDirectory', insertImportButton);
