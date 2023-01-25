import './styles/style.scss';
import CampaignComposerBrowser from './ts/apps/composer';
import { moduleName } from './ts/constants';
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
  module.composerBrowser = new CampaignComposerBrowser();
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
    <p>Campaign Composer Import</p>
  </button>`);
  button.on('click', () => {
    module.composerBrowser.render(true);
  });
  html.find('.directory-header .action-buttons').append(button);
});
