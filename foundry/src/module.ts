import * as api from "campaign-composer-api";

const moduleName = "campaign-composer-bridge";

// let ws: WebSocket;

Hooks.once("ready", () => {
  if (!(game instanceof Game)) {
    console.log("FATAL: game singleton not initialized");
    return;
  }
  if (!game.user?.isGM) {
    console.log("Composer Bridge not initializing for non-GM user");
    return;
  }

  console.log("Initializing Campaign Composer bridge");

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

  const apiClient = new api.DefaultApi(
    new api.Configuration({
      basePath: game.settings.get(moduleName, "apiUrl") as string,
      apiKey: game.settings.get(moduleName, "apiKey") as string,
    })
  );

  apiClient.documentsGet().then((docs) => {
    docs.forEach((doc) => {
      console.log(doc);
    });
  });
});
