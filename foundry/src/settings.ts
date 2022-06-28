import { moduleName } from './constants';

const apiUrlKey = 'apiUrl';
const apiKeyKey = 'apiKey';

export default class BridgeSettings {
  static registerSettings(): void {
    if (!(game instanceof Game)) {
      throw 'game singleton not initialized';
    }

    game.settings.register(moduleName, apiUrlKey, {
      name: 'Campaign Composer API URL',
      hint: 'TODO',
      scope: 'client', // This specifies a client-stored setting
      config: true, // This specifies that the setting appears in the configuration view
      type: String,
      default: 'http://localhost:4492', // The default value for the setting
      onChange: (value) => {
        // A callback function which triggers when the setting is changed
        console.log(`Set composer api url to: "${value}"`);
      },
    });

    game.settings.register(moduleName, apiKeyKey, {
      name: 'Campaign Composer API Key',
      hint: 'TODO',
      scope: 'client', // This specifies a client-stored setting
      config: true, // This specifies that the setting appears in the configuration view
      type: String,
      default: 'PASSWORD123', // The default value for the setting
      onChange: (value) => {
        // A callback function which triggers when the setting is changed
        console.log(`Set composer api key to: "${value}"`);
      },
    });
  }

  public static get apiUrl(): string {
    return (game as Game).settings.get(moduleName, apiUrlKey) as string;
  }

  public static get apiKey(): string {
    return (game as Game).settings.get(moduleName, apiKeyKey) as string;
  }
}
