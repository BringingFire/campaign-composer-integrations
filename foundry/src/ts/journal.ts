import { JournalEntryDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/journalEntryData';
import { SceneDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/sceneData';
import {
  BlockAttributeHeaderLevel,
  BlockAttributeLinkedDocument,
  BlockAttributeListIndent,
  BlockAttributeListStyle,
  BlockAttributeListStyleStyleEnum,
  BlockType,
  CMap,
  DefaultApi,
  Document as CCDocument,
  DocumentMeta,
  MapBackground
} from 'campaign-composer-api';
import { defaultFolderName, moduleName } from './constants';
import { CCModuleData } from './types';

interface MapWithBackground {
  cMap: CMap;
  background: MapBackground;
}

export default class CampaignComposerBrowser extends Application {
  static override get defaultOptions(): ApplicationOptions {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'campaign-composer-browser',
      classes: ['campaign-composer'],
      template: `modules/${moduleName}/templates/journal.hbs`,
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
    let docs: DocumentMeta[];
    let mapsWithBackgrounds: MapWithBackground[];
    try {
      docs = await module.client.listDocuments();
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
      documents: docs,
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
      case 'sync-document': {
        const docId = (button.closest('.document') as HTMLElement).dataset
          .documentId;
        if (docId) {
          await importDocument(docId, module.client);
        }
        break;
      }
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

async function importDocument(
  docId: string,
  client: DefaultApi,
): Promise<void> {
  const doc = await client.getDocument({ docId });
  const contents = getContentForDoc(doc);
  const journal = (game as Game).journal!;
  const entry = journal.find(
    (e) => e.getFlag(moduleName, 'documentId') == doc.id,
  );
  if (entry) {
    await updateEntry(entry, doc, contents, true);
    return;
  }
  await createNewEntry(doc, contents, true, {});
}

async function updateEntry(
  entry: StoredDocument<JournalEntry>,
  doc: CCDocument,
  contents: DocContents,
  notify: boolean,
): Promise<void> {
  const entryData: Record<string, unknown> = {
    name: doc.title ?? 'Untitled Document',
    content: contents.html,
  };
  await entry.update(entryData);
  if (notify)
    ui.notifications!.info(
      `Updated Campaign Composer document ${doc.title ?? 'Untitled Document'}`,
    );
}

async function createNewEntry(
  doc: CCDocument,
  contents: DocContents,
  notify: boolean,
  options: Record<string, unknown>,
) {
  const folder = await getFolder();

  const entryData: JournalEntryDataConstructorData = {
    name: doc.title ?? 'Untitled Document',
    content: contents.html,
    folder: folder.id,
    flags: {
      [moduleName]: contents.flags,
    },
  };
  console.log(entryData);

  // Hooks.callAll(`WACreateJournalEntry`, entryData, doc, content);

  // Create the entry, notify, and return
  const entry = await JournalEntry.create(entryData, options);
  if (notify)
    ui.notifications!.info(
      `Imported Campaign Composer document ${doc.title ?? 'Untitled Document'}`,
    );
  return entry;
}

async function importMap(mapId: string, client: DefaultApi): Promise<void> {
  console.log('importing map to scene');
  const map = await client.getMap({ mapId });
  console.log('fetched map');
  const background = await client.getMapBackground({ mapId });
  console.log('fetched background');
  if (!background) {
    ui.notifications!.warn(`Cannot import a map without an image`);
    return;
  }

  const scene = Scenes.instance.find(
    (s) => s.getFlag(moduleName, 'mapId') == map.id,
  );
  if (scene) {
    console.log(`Map already imported as scene ${scene.id}`);
    return;
  }

  return createSceneFromMap(map, background);
}

async function createSceneFromMap(
  map: CMap,
  background: MapBackground,
): Promise<void> {
  if (!background) {
    ui.notifications!.warn(`Cannot import a map without an image`);
    return;
  }

  const backgroundFile = new File(
    [b64ToBlob(background.image)],
    `${map.id}.${background.format}`,
  );
  try {
    await FilePicker.createDirectory('data', 'campaign-composer');
  } catch (e) {
    console.log('Campaign composer assets directory already exists');
  }
  await FilePicker.upload('data', 'campaign-composer', backgroundFile);

  const sceneData: SceneDataConstructorData = {
    name: map.title ?? 'Untitled Map',
    width: background.width,
    height: background.height,
    img: `campaign-composer/${backgroundFile.name}`,
    flags: {
      [moduleName]: {
        mapId: map.id,
      },
    },
  };
  const scene = await Scene.create(sceneData);
  console.log('created scene');

  const thumbnail = await scene?.createThumbnail();
  console.log(thumbnail);
  scene?.update({
    thumb: thumbnail?.thumb,
  });
  console.log('created thumbnail');

  // Scene.create(sceneData)
  // const contents = getContentForDoc(doc);
  // const journal = (game as Game).journal!;
  // const entry = journal.find(
  //   (e) => e.getFlag(moduleName, 'documentId') == doc.id,
  // );
  // if (entry) {
  //   await updateEntry(entry, doc, contents, true);
  //   return;
  // }
  // await createNewEntry(doc, contents, true, {});
}

async function getFolder(): Promise<Folder> {
  const folder = (game as Game).folders!.find(
    (f: Folder) =>
      f.data.type === 'JournalEntry' && f.name === defaultFolderName,
  );
  if (folder) return folder;

  // Create a new Folder
  const newFolder = await Folder.create({
    name: defaultFolderName,
    type: 'JournalEntry',
    sorting: 'm',
  });

  return newFolder as Folder;
}

interface DocContents {
  html: string;
  flags: Record<string, unknown>;
}

function getContentForDoc(doc: CCDocument): DocContents {
  const listState = new ListState();

  const html =
    '<section>\n' +
    doc.contents
      .map((b) => {
        switch (b.type) {
          case BlockType.Paragraph:
            return `${listState.closeList()}<p>${b.contents}</p>`;
          case BlockType.Heading: {
            const headingLevel =
              (
                b.attributes?.blockAttributes.find(
                  (attr) => attr._t === 'headerLevel',
                ) as BlockAttributeHeaderLevel | undefined
              )?.level ?? 1;
            return `${listState.closeList()}</section>\n<section>\n<h${headingLevel}>${
              b.contents
            }</h${headingLevel}>`;
          }
          case BlockType.ListItem: {
            const listIndent =
              (
                b.attributes?.blockAttributes.find(
                  (attr) => attr._t === 'listIndent',
                ) as BlockAttributeListIndent | undefined
              )?.level ?? 1;
            const listStyle =
              (
                b.attributes?.blockAttributes.find(
                  (attr) => attr._t === 'listStyle',
                ) as BlockAttributeListStyle | undefined
              )?.style ?? BlockAttributeListStyleStyleEnum.UnOrdered;
            return `${listState.match(listIndent, listStyle)}<li>${
              b.contents
            }</li>`;
          }
          case BlockType.Embed: {
            const embedAttr = b.attributes?.blockAttributes.find(
              (attr) => attr._t === 'linkedDocument',
            ) as BlockAttributeLinkedDocument;
            return `${listState.closeList()}<b>Embedded content from ${
              embedAttr.docId
            }</b>`;
          }
          default: {
            console.error(`Unknown block type: ${b.type}`);
            return `${listState.closeList()}<p>${b.contents}</p>`;
          }
        }
      })
      .join('\n') +
    listState.closeList();
  ('</section>');

  return {
    html,
    flags: {
      documentId: doc.id,
    },
  };
}

class ListState {
  private level: number = -1;
  private type: BlockAttributeListStyleStyleEnum | undefined;

  private get tag(): string {
    return this.type == BlockAttributeListStyleStyleEnum.Ordered ? 'ol' : 'ul';
  }

  public closeList(): string {
    if (this.level < 0) {
      return '';
    }

    let result = '';
    while (this.level >= 0) {
      result += `</${this.tag}>\n`;
      this.level -= 1;
    }
    this.type = undefined;

    return result;
  }

  public match(level: number, type: BlockAttributeListStyleStyleEnum): string {
    if (level < 0) {
      throw 'level must be >= 0';
    }

    let result = '';

    while (this.level > level || (this.type != type && this.level >= 0)) {
      result += `</${this.tag}>\n`;
      this.level -= 1;
    }

    this.type = type;
    while (this.level < level) {
      result += `<${this.tag}>\n`;
      this.level += 1;
    }

    return result;
  }
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