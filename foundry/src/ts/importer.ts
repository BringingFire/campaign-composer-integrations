import { NoteDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/noteData';
import { SceneDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/sceneData';
import {
  Block,
  BlockAttributeHeaderLevel,
  BlockAttributeLink,
  BlockAttributeListIndent,
  BlockAttributeListStyle,
  BlockAttributeListStyleStyleEnum,
  BlockType,
  CMap,
  DefaultApi,
  Document as CCDocument,
  Link,
  MapBackground,
  MapMetadata
} from 'campaign-composer-api';
import { getDoors, getLights, getWalls } from './apps/uvtt';
import { defaultFolderName, moduleName } from './constants';
import { ensureDirectory, ensureFolder } from './foundryHelpers';

interface DocContents {
  html: string;
  flags: Record<string, unknown>;
}

interface ImportCache {
  docs: Record<string, StoredDocument<JournalEntry>>;
  maps: Record<string, StoredDocument<Scene>>;
}

interface FoldersCache {
  docs?: Folder;
  maps?: Folder;
}

export default class Importer {
  constructor({ client }: { client: DefaultApi }) {
    this.client = client;
    this.cache = { docs: {}, maps: {} };
    this.toSync = [];
    this.folders = {};
  }

  private client: DefaultApi;
  private cache: ImportCache;
  private folders: FoldersCache;
  private toSync: Link[];

  public get importedCount() {
    return Object.keys(this.cache.maps).length + Object.keys(this.cache.docs).length;
  }

  async importDocument(
    docId: string,
  ): Promise<StoredDocument<JournalEntry> | undefined> {
    const doc = await this.client.getDocument({ docId });
    if (doc.id in this.cache.docs) {
      return this.cache.docs[doc.id];
    }
    const journal = (game as Game).journal!;
    let entry = journal.find(
      (e) => e.getFlag(moduleName, 'documentId') == doc.id,
    );
    const folder = await this.getDocsFolder();
    const title = doc.title ?? 'Untitled Document';
    if (!entry) {
      entry = await JournalEntry.create(
        {
          name: title,
          folder,
          pages: [
            {
              name: title,
              type: 'text',
              title: {
                show: false,
              },
              text: {
                format: 1,
                content: 'PRE CREATE',
              },
            },
          ],
          flags: {
            [moduleName]: {
              documentId: doc.id,
            },
          },
        },
        {},
      );
    }
    this.cache.docs[doc.id] = entry!;
    const contents = await this.getContentForDoc(doc);
    await this.updateEntry({ entry: entry!, doc, contents });
    return entry;
  }

  private async getContentForDoc(doc: CCDocument): Promise<DocContents> {
    const listState = new ListState();

    const processedContents: string[] = [];
    for (let i = 0; i < doc.contents.length; i++) {
      processedContents.push(
        await this.processBlock(doc.contents[i], listState),
      );
    }
    const html =
      '<section>\n' +
      processedContents.join('\n') +
      listState.closeList() +
      '</section>';

    return {
      html,
      flags: {
        documentId: doc.id,
      },
    };
  }

  private async processBlock(b: Block, listState: ListState): Promise<string> {
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
          (attr) => attr._t === 'link',
        ) as BlockAttributeLink;
        const link = embedAttr.link;
        if (link._t === 'doc') {
          const targetDoc = await this.importDocument(link.docId);
          const textContent = `<p>@UUID[JournalEntry.${targetDoc!.id!}]{${
            targetDoc!.name
          }}</p>`;
          return `${listState.closeList()}${textContent}`;
        }
        if (link._t === 'map') {
          const targetMap = await this.importMap(link.mapId);
          const textContent = `<p>@UUID[Scene.${targetMap?.id}]{${targetMap?.name}}</p>`;
          return `${listState.closeList()}${textContent}`;
        }
        return `${listState.closeList()}<b>Embedded content from unrecognized type ${
          link._t
        }`;
      }
      default: {
        console.error(`Unknown block type: ${b.type}`);
        return `${listState.closeList()}<p>${b.contents}</p>`;
      }
    }
  }

  private async updateEntry({
    entry,
    doc,
    contents,
  }: {
    entry: StoredDocument<JournalEntry>;
    doc: CCDocument;
    contents: DocContents;
  }): Promise<void> {
    const title = doc.title ?? 'Untitled Document';
    const entryData: Record<string, unknown> = {
      name: title,
      pages: [
        {
          name: title,
          type: 'text',
          title: {
            show: false,
          },
          text: {
            format: 1,
            content: contents.html,
          },
          sort: 0,
        },
      ],
    };
    await entry.update(entryData, { recursive: false, diff: false });
    // switch (alert) {
    //   case AlertType.Create:
    //     ui.notifications?.info(
    //       `Imported Campaign Composer document ${
    //         doc.title ?? 'Untitled Document'
    //       }`,
    //     );
    //     break;
    //   case AlertType.Update:
    //     ui.notifications?.info(
    //       `Updated Campaign Composer document ${
    //         doc.title ?? 'Untitled Document'
    //       }`,
    //     );
    //     break;
    //   case AlertType.None:
    //     break;
    // }
  }

  public async importMap(
    mapId: string,
  ): Promise<StoredDocument<Scene> | undefined> {
    console.log('importing map to scene');
    const map = await this.client.getMap({ mapId });
    if (map.id in this.cache.maps) {
      return this.cache.maps[map.id];
    }
    const background = await this.client.getMapBackground({ mapId });
    if (!background) {
      // ui.notifications?.warn(`Cannot import a map without an image`);
      return;
    }
    let metadata: MapMetadata | undefined = undefined;
    try {
      metadata = await this.client.getMapMetadata({ mapId });
    } catch (e) {
      // pass
    }

    const folder = await this.getMapsFolder();

    let scene = Scenes.instance.find(
      (s) => s.getFlag(moduleName, 'mapId') == map.id,
    ) as StoredDocument<Scene> | undefined;
    if (!scene) {
      scene = await Scene.create({
        name: map.title ?? 'Untitled Map',
        folder,
      });
    }
    this.cache.maps[map.id] = scene!;

    return this.updateSceneFromMap({
      scene: scene!,
      folder,
      cMap: map,
      background,
      metadata,
    });
  }

  private async updateSceneFromMap({
    scene,
    folder,
    cMap,
    background,
    metadata,
  }: {
    scene: StoredDocument<Scene>;
    folder: Folder;
    cMap: CMap;
    background: MapBackground;
    metadata?: MapMetadata;
  }): Promise<StoredDocument<Scene> | undefined> {
    const backgroundFile = new File(
      [b64ToBlob(background.image)],
      `${cMap.id}.${background.format}`,
    );
    await ensureDirectory({ type: 'data', path: 'campaign-composer' });
    await FilePicker.upload('data', 'campaign-composer', backgroundFile);

    const sceneData: SceneDataConstructorData = {
      name: cMap.title ?? 'Untitled Map',
      folder,
      width: background.width,
      height: background.height,
      img: `campaign-composer/${backgroundFile.name}`,
      flags: {
        [moduleName]: {
          mapId: cMap.id,
        },
      },
    };

    const sceneRect = (new Scene(sceneData).dimensions as Canvas.Dimensions)
      .sceneRect;
    const uvtt = metadata?.uvtt;
    if (uvtt) {
      sceneData.lights = getLights(uvtt, sceneRect);
      sceneData.walls = getWalls(uvtt, sceneRect).concat(
        getDoors(uvtt, sceneRect),
      );
    }

    const notes: NoteDataConstructorData[] = await Promise.all(
      (cMap.pins ?? []).map(async (pin) => {
        const link = pin.link;
        let docId: string | undefined;
        if (link?._t === 'doc') {
          const doc = await this.importDocument(link.docId);
          docId = doc?.id;
        }
        const result: NoteDataConstructorData = {
          x: pin.x! + sceneRect.x,
          y: pin.y! + sceneRect.y,
          text: pin.label,
          entryId: docId,
        };
        return result;
      }),
    );
    sceneData.notes = notes;

    await scene.update(sceneData);
    // switch (alert) {
    //   case AlertType.Create:
    //     ui.notifications?.info(
    //       `Imported Campaign Composer map ${cMap.title ?? 'Untitled Document'}`,
    //     );
    //     break;
    //   case AlertType.Update:
    //     ui.notifications?.info(
    //       `Updated Campaign Composer map ${cMap.title ?? 'Untitled Document'}`,
    //     );
    //     break;
    //   case AlertType.None:
    //     break;
    // }
    return scene;
  }

  async ensureLink(link: Link): Promise<string | undefined> {
    const journal = (game as Game).journal!;
    switch (link._t) {
      case 'doc': {
        let entry = journal.find(
          (e) => e.getFlag(moduleName, 'documentId') == link.docId,
        );
        if (!entry) {
          const folder = await this.getDocsFolder();
          entry = await JournalEntry.create(
            {
              name: 'tmp',
              folder,
            },
            {},
          )!;
        }
        this.cache.docs[link.docId] = entry!;
        this.toSync.push(link);
        return entry!.id;
      }
      case 'map': {
        let scene = Scenes.instance.find(
          (s) => s.getFlag(moduleName, 'mapId') == link.mapId,
        ) as StoredDocument<Scene> | undefined;
        if (!scene) {
          const folder = await this.getMapsFolder();
          scene = await Scene.create({ name: 'tmp', folder });
        }
        this.cache.maps[link.mapId] = scene!;
        this.toSync.push(link);
        return scene!.id;
      }
      case 'ext':
        return undefined;
    }
  }

  async processOutstandingLinks() {
    for (let i = 0; i < this.toSync.length; i++) {
      const link = this.toSync[i];
      if (link._t === 'doc') {
        this.importDocument(link.docId);
      } else if (link._t === 'map') {
        this.importMap(link.mapId);
      }
    }
  }

  async getDocsFolder(): Promise<Folder> {
    let folder = this.folders.docs;
    if (!folder) {
      folder = await ensureFolder({
        type: 'JournalEntry',
        name: defaultFolderName,
      });
      this.folders.docs = folder;
    }
    return folder;
  }

  async getMapsFolder(): Promise<Folder> {
    let folder = this.folders.docs;
    if (!folder) {
      folder = await ensureFolder({ type: 'Scene', name: defaultFolderName });
      this.folders.maps = folder;
    }
    return folder;
  }
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
