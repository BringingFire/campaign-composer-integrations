import { moduleName } from "./constants";
import BridgeSettings from "./settings";
import "./style.scss";

Hooks.once("init", () => {
  if (!(game instanceof Game)) {
    throw "game singleton not initialized";
  }

  console.log("Initializing Campaign Composer bridge");

  BridgeSettings.registerSettings();

  // const module = game.modules.get(moduleName);
});

Hooks.on("renderJournalDirectory", (_: Application, html: any, __: any) => {
  if (!(game instanceof Game)) {
    throw "game singleton not initialized";
  }

  if (!game.user!.isGM) {
    return;
  }

  const button = $(`<button class="cc-journal-button" type="button">
    <img class="cc-journal-button-icon" src="modules/${moduleName}/assets/icons/bf-bw.png" title="Campaign Composer"/>
  </button>`);
  button.on("click", (_) => {
    console.log("TODO: show composer things");
  });
  html.find(".directory-header .action-buttons").append(button);
});
