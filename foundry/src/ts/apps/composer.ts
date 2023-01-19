import { CMap, DocumentMeta, MapBackground, MapMetadata } from 'campaign-composer-api';
import { moduleName } from '../constants';
import Importer from '../importer';
import { CCModuleData } from '../types';

interface MapWithBackground {
  cMap: CMap;
  background: MapBackground;
  metadata: MapMetadata;
}

export default class CampaignComposerBrowser extends Application {
  loading? = 'Contacting Campaign Composer';
  error?: string;
  docs: DocumentMeta[] = [];
  maps: MapWithBackground[] = [];

  static override get defaultOptions(): ApplicationOptions {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'campaign-composer-browser',
      // classes: ['campaign-composer'],
      template: `modules/${moduleName}/templates/composer.hbs`,
      width: 720,
      height: 720,
      // scrollY: '.campaign-composer-container',
    }) as ApplicationOptions;
  }

  override get title(): string {
    return 'Import from Campaign Composer'
  }

  override render(...args: any[]): unknown {
    const res = super.render(...args);
    if (this._priorState == Application.RENDER_STATES.NONE && this._state == Application.RENDER_STATES.RENDERING) {
      setTimeout(() => {
        this.fetchLists();
      }, 1000);
    }
    return res;
  }

  override async getData(): Promise<object> {
    if (this.loading || this.error) {
      return {
        loading: this.loading,
        error: this.error,
      }
    }
    return {
      documents: this.docs,
      maps: this.maps,
    };
  }

  override activateListeners(html: JQuery<HTMLElement>): void {
    super.activateListeners(html);
    html
      .find('button.campaign-composer-control')
      .on('click', this._onClickControlButton.bind(this));
    html
      .find('input.campaign-composer-control:checkbox')
      .on('change', this._onCheckboxChange.bind(this));
  }

  async _onCheckboxChange(event: Event) {
    event.preventDefault();
    const element = event.currentTarget as HTMLInputElement;
    const role = element.dataset.checkboxRole;
    const category = element.dataset.checkboxCategory;
    if (!role || !category) return;
    if (role === 'parent') {
      console.log(`Checking child boxes of category ${category}`);
      const query = `input:checkbox[data-checkbox-category="${category}"][data-checkbox-role="child"]`;
      console.log(query);
      const children = this.element.find(query);
      console.log(children.length);
      children.each((_, e) => {
        (e as HTMLInputElement).checked = element.checked;
      });
    } else if (role === 'child') {
      const childrenQuery = `input:checkbox[data-checkbox-category="${category}"][data-checkbox-role="child"]`;
      const parentQuery = `input:checkbox[data-checkbox-category="${category}"][data-checkbox-role="parent"]`;
      const parent = this.element.find(parentQuery).get(0) as HTMLInputElement;
      const childrenChecked = this.element.find(childrenQuery).map((_, e) => (e as HTMLInputElement).checked).toArray();
      if (childrenChecked.every((v) => v)) {
        parent.checked = true;
        parent.indeterminate = false;
      } else if (childrenChecked.every((v) => !v)) {
        parent.checked = false;
        parent.indeterminate = false;
      } else {
        parent.checked = false;
        parent.indeterminate = true;
      }
    }
  }

  async _onClickControlButton(event: Event): Promise<void> {
    event.preventDefault();
    const button = event.currentTarget as HTMLElement;
    const action = button.dataset.action;

    switch (action) {
      case 'cancel': {
        this.close();
        break;
      }
      case 'import': {
        const toImport = this.element!
          .find(':checkbox')
          .filter(':checked')
          .toArray()
          .map((e) => (e as HTMLInputElement).value)
          .filter((v) => v.startsWith('doc:') || v.startsWith('map:'));
        if (toImport.length < 1) return;
        this.loading = `Importing ${toImport.length} items`;
        this.render();
        const toImportSorted = toImport.map((s) => s.split(':')).reduce((prev, curr) => {
          switch (curr[0]) {
            case 'doc':
              prev.docs.push(curr[1]);
              break;
            case 'map':
              prev.maps.push(curr[1]);
              break;
          }
          return prev;
        }, {docs: ([] as string[]), maps: ([] as string[])});
        console.log(toImportSorted);
        await this.doImport(toImportSorted);
        this.close();
        this.loading = undefined;
        break;
      }
      default:
        console.error(`Unknown button action: ${action}`);
    }
  }

  private async doImport({ docs, maps }: {docs: string[], maps: string[]}): Promise<void> {
    const module = (game as Game).modules.get(moduleName) as CCModuleData;
    const importer = new Importer({ client: module.client });
    let titleForAlert: string | undefined | null;
    for (const docId of docs) {
      const doc = await importer.importDocument(docId);
      titleForAlert ??= doc?.name;
    }
    for (const mapId of maps) {
      const map = await importer.importMap(mapId);
      titleForAlert ??= map?.name;
    }
    const numImported = importer.importedCount;
    if (numImported == 1) {
      ui.notifications?.info(
        `${titleForAlert} was successfully imported.`
      );
    } else if (numImported > 1) {
      ui.notifications?.info(
        `${titleForAlert} and ${numImported - 1} other items were successfully imported.`
      );
    }
  }

  private async fetchLists() {
    const module = (game as Game).modules.get(moduleName) as CCModuleData;
    console.log('Fetching composer content lists');
    try {
      this.docs = await module.client.listDocuments();
      console.log(`Fetched ${this.docs.length} documents`);
      const maps = await module.client.listMaps();
      this.maps = (
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
      console.log(`Fetched ${this.maps.length} maps`);
    } catch (e) {
      this.error = 'Could not connect to Campaign Composer';
    }

    this.loading = undefined;
    this.render();
  }
}