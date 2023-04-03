import { Configuration, DefaultApi } from 'campaign-composer-api';
import { moduleName } from './constants';
import type { CCModuleData } from './types';

const apiUrlKey = 'apiUrl';
const apiKeyKey = 'apiKey';
const campaignId = 'campaignId'

export default class BridgeSettings {
  static registerSettings(): void {
    if (!(game instanceof Game)) {
      throw 'game singleton not initialized';
    }

    game.settings.register(moduleName, apiUrlKey, {
      name: 'Campaign Composer API URL',
      scope: 'client', // This specifies a client-stored setting
      config: true, // This specifies that the setting appears in the configuration view
      type: String,
      default: 'http://localhost:4492', // The default value for the setting
      onChange: BridgeSettings.updateModuleClient,
    });

    game.settings.register(moduleName, apiKeyKey, {
      name: 'Campaign Composer API Key',
      scope: 'client', // This specifies a client-stored setting
      config: true, // This specifies that the setting appears in the configuration view
      type: String,
      default: 'PASSWORD123', // The default value for the setting
      onChange: BridgeSettings.updateModuleClient,
    });

    game.settings.register(moduleName, campaignId, {
      name: 'Campaign ID',
      scope: 'client',
      config: true,
      type: Number,
      default: 1,
      onChange: BridgeSettings.updateModuleClient,
    });
  }

  public static get apiUrl(): string {
    let url = (game as Game).settings.get(moduleName, apiUrlKey) as string;
    if (!new RegExp("^.+://").test(url)) {
      let protocol = 'https://';
      if (url.startsWith('localhost') || url.startsWith('127.0.0.1')) {
        protocol = 'http://';
      }
      url = `${protocol}${url}`;
    }
    return url;
  }

  public static get apiKey(): string {
    return (game as Game).settings.get(moduleName, apiKeyKey) as string;
  }

  public static get campaignId(): number {
    return (game as Game).settings.get(moduleName, campaignId) as number;
  }

  public static updateModuleClient(): void {
    const module = (game as Game).modules.get(moduleName) as
      | CCModuleData
      | undefined;
    if (!module) {
      return;
    }

    module.client = new DefaultApi(
      new Configuration({
        basePath: BridgeSettings.apiUrl,
        apiKey: BridgeSettings.apiKey,
      }),
    );
    module.activeCampaign = BridgeSettings.campaignId;
  }
}
