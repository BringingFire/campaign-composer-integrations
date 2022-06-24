import { moduleName } from "./constants";
import BridgeSettings from "./settings";

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

  const button = $(`<button type="button" style="flex:0 0 32px;">
    <img src="modules/${moduleName}/assets/icons/bf-bw.png" title="Campaign Composer" style="height:24px;border:none;"/>
  </button>`);
  button.on("click", (_) => {
    console.log("TODO: show composer things");
  });
  html.find(".directory-header .action-buttons").append(button);
});
