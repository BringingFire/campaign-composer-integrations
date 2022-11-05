import { DocumentMeta } from 'campaign-composer-api';
import { moduleName } from '../constants';
import Importer from '../importer';
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
    let docs: DocumentMeta[];
    try {
      docs = await module.client.listDocuments();
    } catch (e) {
      console.error(e);
      ui.notifications?.error('Could not connect to Campaign Composer');
      throw e;
    }

    return {
      documents: docs,
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
          const importer = new Importer({ client: module.client });
          await importer.importDocument(docId);
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
