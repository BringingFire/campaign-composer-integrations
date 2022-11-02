import { NoteDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/noteData';
import { SceneDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/sceneData';
import {
  CMap,
  DefaultApi,
  MapBackground,
  MapMetadata,
} from 'campaign-composer-api';
import { defaultFolderName, moduleName } from '../constants';
import { ensureDirectory, ensureFolder } from '../foundryHelpers';
import { CCModuleData } from '../types';
import { getDoors, getLights, getWalls } from './uvtt';

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
          await importMap(mapId, module.client);
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

async function importMap(mapId: string, client: DefaultApi): Promise<void> {
  console.log('importing map to scene');
  const map = await client.getMap({ mapId });
  console.log('fetched map');
  const background = await client.getMapBackground({ mapId });
  const metadata = await client.getMapMetadata({ mapId });
  console.log('fetched background');
  if (!background) {
    ui.notifications!.warn(`Cannot import a map without an image`);
    return;
  }

  const scene = Scenes.instance.find(
    (s) => s.getFlag(moduleName, 'mapId') == map.id,
  ) as StoredDocument<Scene> | undefined;
  if (scene) {
    console.log(`Map already imported as scene ${scene.id}`);
    return updateSceneFromMap(scene, { cMap: map, background, metadata });
  }

  return createSceneFromMap({ cMap: map, background, metadata });
}

async function createSceneFromMap({
  cMap,
  background,
  metadata,
}: MapWithBackground): Promise<void> {
  if (!background) {
    ui.notifications!.warn(`Cannot import a map without an image`);
    return;
  }

  const folder = await ensureFolder({ type: 'Scene', name: defaultFolderName });

  const backgroundFile = new File(
    [b64ToBlob(background.image)],
    `${cMap.id}.${background.format}`,
  );
  await ensureDirectory({ type: 'data', path: 'campaign-composer' });
  await FilePicker.upload('data', 'campaign-composer', backgroundFile);
  const padding = 0.25;

  const sceneData: SceneDataConstructorData = {
    folder: folder.id,
    name: cMap.title ?? 'Untitled Map',
    width: background.width,
    height: background.height,
    padding: padding,
    grid: cMap.grid?.pixelsPerGrid,
    img: `campaign-composer/${backgroundFile.name}`,

    flags: {
      [moduleName]: {
        mapId: cMap.id,
      },
    },
  };

  const sceneRect = (new Scene(sceneData).dimensions as Canvas.Dimensions)
    .sceneRect;
  const uvtt = metadata.uvtt;
  if (uvtt) {
    sceneData.lights = getLights(uvtt, sceneRect);
    sceneData.walls = getWalls(uvtt, sceneRect).concat(
      getDoors(uvtt, sceneRect),
    );
  }

  const notes: NoteDataConstructorData[] = (cMap.pins ?? []).map((pin) => {
    return {
      x: pin.x! + sceneRect.x,
      y: pin.y! + sceneRect.y,
      text: pin.label,
    };
  });
  console.log(notes);
  sceneData.notes = notes;

  const scene = await Scene.create(sceneData);
  if (!scene) {
    ui.notifications!.warn(
      `Unknown error occurred importing ${sceneData.name}`,
    );
    return;
  }
  console.log('created scene');

  const thumbnail = await scene?.createThumbnail();
  console.log(thumbnail);
  scene?.update({
    thumb: thumbnail?.thumb,
  });
  console.log('created thumbnail');

  ui.notifications!.info(`Imported scene ${scene.name}`);
}

async function updateSceneFromMap(
  scene: StoredDocument<Scene>,
  { cMap, background }: MapWithBackground,
): Promise<void> {
  const backgroundFile = new File(
    [b64ToBlob(background.image)],
    `${cMap.id}.${background.format}`,
  );
  await ensureDirectory({ type: 'data', path: 'campaign-composer' });
  await FilePicker.upload('data', 'campaign-composer', backgroundFile);

  const sceneData: SceneDataConstructorData = {
    name: cMap.title ?? 'Untitled Map',
    width: background.width,
    height: background.height,
    img: `campaign-composer/${backgroundFile.name}`,
    flags: {
      [moduleName]: {
        mapId: cMap.id,
      },
    },
  };
  await scene.update(sceneData);
  ui.notifications!.info(`Updated scene ${sceneData.name}`);
}

function b64ToBlob(bytes: string): Blob {
  const byteString = atob(bytes);

  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab]);
}
