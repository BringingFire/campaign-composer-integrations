import { JournalEntryDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/journalEntryData';
import {
  BlockAttributeHeaderLevel,
  BlockAttributeLinkedDocument,
  BlockAttributeListIndent,
  BlockAttributeListStyle,
  BlockAttributeListStyleStyleEnum,
  BlockType,
  DefaultApi,
  Document as CCDocument,
  DocumentMeta
} from 'campaign-composer-api';
import { defaultFolderName, moduleName } from '../constants';
import { ensureFolder } from '../foundryHelpers';
import { CCModuleData } from '../types';

export default class CampaignComposerJournalBrowser extends Application {
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
    let docsByFolder: { folder: string | null; documents: DocumentMeta[] }[];
    try {
      const docs = await module.client.listDocuments();
      const initial = new Map<
        string | null,
        { folder: string | null; documents: DocumentMeta[] }
      >();
      initial.set(null, { folder: null, documents: [] });
      const docsByFolderMap = docs.reduce((acc, doc) => {
        const folder = doc.folder ?? null;
        if (!acc.has(folder)) {
          acc.set(folder, { folder: folder, documents: [] });
        }
        acc.get(folder)!.documents.push(doc);
        return acc;
      }, initial);
      docsByFolder = [...docsByFolderMap.values()];
    } catch (e) {
      console.error(e);
      ui.notifications?.error('Could not connect to Campaign Composer');
      throw e;
    }

    return {
      docsByFolder,
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
      case 'sync-all-documents': {
        await importOrSyncAllDocuments(module.client);
        break;
      }
      case 'sync-documents-in-folder': {
        const folder = button.dataset.folder;
        await importOrSyncInFolder(module.client, folder);
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

async function importOrSyncInFolder(client: DefaultApi, folder?: string) {
  console.log(`Syncing docs in folder ${folder}`);
  const docs = await client.listDocuments();
  const filteredDocs = docs.filter((d) => d.folder === folder);
  await importOrSyncDocuments(client, filteredDocs);
  return;
}

async function importOrSyncAllDocuments(client: DefaultApi) {
  const docs = await client.listDocuments();
  await importOrSyncDocuments(client, docs);
}

async function importOrSyncDocuments(client: DefaultApi, docs: DocumentMeta[]) {
  for (const doc of docs) {
    await importDocument(doc.id, client, false);
  }
  ui.notifications!.info(
    `Imported ${docs.length} documents from Campaign Composer`,
  );
}

async function importDocument(
  docId: string,
  client: DefaultApi,
  notify: boolean = false,
): Promise<void> {
  const doc = await client.getDocument({ docId });
  const contents = getContentForDoc(doc);
  const journal = (game as Game).journal!;
  const entry = journal.find(
    (e) => e.getFlag(moduleName, 'documentId') == doc.id,
  );
  if (entry) {
    await updateEntry(entry, doc, contents, notify);
    return;
  }
  await createNewEntry(doc, contents, notify, {});
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
  let folder = await ensureFolder({
    type: 'JournalEntry',
    name: defaultFolderName,
  });

  if (doc.folder != null) {
    folder = await ensureFolder({
      type: 'JournalEntry',
      name: doc.folder,
      parent: folder,
    });
  }

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
