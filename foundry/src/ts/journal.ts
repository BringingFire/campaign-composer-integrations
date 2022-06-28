import {
  BlockAttributeHeaderLevel,
  BlockAttributeListIndent,
  BlockAttributeListStyle,
  BlockAttributeListStyleStyleEnum,
  BlockType,
  DefaultApi,
  Document as CCDocument,
} from 'campaign-composer-api';
import { defaultFolderName, moduleName } from './constants';
import { CCModuleData } from './types';

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

  override async getData(
    _: Partial<ApplicationOptions> | undefined,
  ): Promise<object> {
    const module = (game as Game).modules.get(moduleName) as CCModuleData;
    const docs = await module.client.documentsGet();
    return {
      entities: docs,
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
      case 'sync-document':
        await importDocument(
          (button.closest('.document') as HTMLElement).dataset.documentId!,
          module.client,
        );
        break;
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
  const doc = await client.documentsDocIdGet({ docId });
  const contents = getContentForDoc(doc);
  const journal = (game as Game).journal!;
  let entry = journal.find(
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
  const entryData: any = {
    name: doc.title ?? '',
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
  options: Object,
) {
  const folder = await getFolderForDoc(doc);

  const entryData: any = {
    name: doc.title ?? '',
    content: contents.html,
    folder: folder.id,
  };
  entryData[`flags.${moduleName}`] = contents.flags;

  /**
   * A hook event that fires when the user is creating a new JournalEntry from a WorldAnvil article.
   * @function WACreateJournalEntry
   * @memberof hookEvents
   * @param {JournalEntryData} entryData    The JournalEntry data which will be created
   * @param {Article} article                 The original Article
   * @param {ParsedArticleResult} content   The parsed article content
   */
  // Hooks.callAll(`WACreateJournalEntry`, entryData, doc, content);

  // Create the entry, notify, and return
  const entry = await JournalEntry.create(entryData, options);
  if (notify)
    ui.notifications!.info(
      `Imported Campaign Composer document ${doc.title ?? 'Untitled Document'}`,
    );
  return entry;
}

async function getFolderForDoc(_: CCDocument): Promise<Folder> {
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
  html: String;
  flags: Object;
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
          case BlockType.Heading:
            const headingLevel =
              (
                b.attributes?.blockAttributes.find(
                  (attr) => attr._t === 'headerLevel',
                ) as BlockAttributeHeaderLevel | undefined
              )?.level ?? 1;
            return `${listState.closeList()}</section>\n<section>\n<h${headingLevel}>${
              b.contents
            }</h${headingLevel}>`;
          case BlockType.ListItem:
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
          default:
            console.error(`Unknown block type: ${b.type}`);
            return `${listState.closeList()}<p>${b.contents}</p>`;
        }
      })
      .join('\n') +
    listState.closeList();
    '</section>';

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
      result != `</${this.tag}>\n`;
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