import { moduleName } from "./constants";

export default class BridgeSettings {
  static registerSettings(): void {
    if (!(game instanceof Game)) {
      throw "game singleton not initialized";
    }

    game.settings.register(moduleName, "apiUrl", {
      name: "Campaign Composer API URL",
      hint: "TODO",
      scope: "client", // This specifies a client-stored setting
      config: true, // This specifies that the setting appears in the configuration view
      type: String,
      default: "http://localhost:4492", // The default value for the setting
      onChange: (value) => {
        // A callback function which triggers when the setting is changed
        console.log(`Set composer api url to: "${value}"`);
      },
    });

    game.settings.register(moduleName, "apiKey", {
      name: "Campaign Composer API Key",
      hint: "TODO",
      scope: "client", // This specifies a client-stored setting
      config: true, // This specifies that the setting appears in the configuration view
      type: String,
      default: "PASSWORD123", // The default value for the setting
      onChange: (value) => {
        // A callback function which triggers when the setting is changed
        console.log(`Set composer api key to: "${value}"`);
      },
    });
  }
}
