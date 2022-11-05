import { CMap, MapBackground, MapMetadata } from 'campaign-composer-api';
import { moduleName } from '../constants';
import Importer from '../importer';
import { CCModuleData } from '../types';

interface MapWithBackground {
  cMap: CMap;
  background: MapBackground;
  metadata: MapMetadata;
}

export default class CampaignComposerSceneBrowser extends Application {
  static override get defaultOptions(): ApplicationOptions {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'campaign-composer-browser',
      classes: ['campaign-composer'],
      template: `modules/${moduleName}/templates/scene.hbs`,
      width: 720,
      height: 'auto',
      scrollY: ['.campaign-composer-container'],
    }) as ApplicationOptions;
  }

  override get title(): string {
    // TODO get this from the module or a translation file
    return 'Campaign Composer';
  }

  override async getData(): Promise<object> {
    const module = (game as Game).modules.get(moduleName) as CCModuleData;
    let mapsWithBackgrounds: MapWithBackground[];
    try {
      const maps = await module.client.listMaps();
      mapsWithBackgrounds = (
        await Promise.all(
          maps.map(async (cMap) => {
            try {
              const background = await module.client.getMapBackground({
                mapId: cMap.id,
              });
              return {
                cMap: cMap,
                background,
              };
            } catch (e) {
              console.log(`Failed to fetch background for map ${cMap.id}`, e);
            }
            return undefined;
          }),
        )
      ).filter((m): m is MapWithBackground => !!m);
    } catch (e) {
      console.error(e);
      ui.notifications?.error('Could not connect to Campaign Composer');
      throw e;
    }

    return {
      maps: mapsWithBackgrounds,
    };
  }

  override activateListeners(html: JQuery<HTMLElement>): void {
    super.activateListeners(html);
    html
      .find('.document-title')
      .on('click', this._onClickDocumentTitle.bind(this));
    html
      .find('button.campaign-composer-control')
      .on('click', this._onClickControlButton.bind(this));
  }

  async _onClickControlButton(event: Event): Promise<void> {
    event.preventDefault();
    const button = event.currentTarget as HTMLElement;
    const action = button.dataset.action;
    const module = (game as Game).modules.get(moduleName) as CCModuleData;

    switch (action) {
      case 'sync-map': {
        const mapId = (button.closest('.map') as HTMLElement).dataset.mapId;
        if (mapId) {
          const importer = new Importer({ client: module.client });
          importer.importMap(mapId);
        } else {
          console.log('Could not load mapId');
        }
        break;
      }
      default:
        console.error(`Unknown button action: ${action}`);
    }
  }

  async _onClickDocumentTitle(event: Event): Promise<void> {
    event.preventDefault();

    const el = (event.currentTarget as HTMLElement).closest(
      '.document',
    ) as HTMLElement;
    const docId = el.dataset.documentId;
    console.log(`TODO: Show document with id ${docId}`);
  }
}
