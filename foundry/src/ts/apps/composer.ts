import { CMap, DocumentMeta, MapBackground, MapMetadata } from 'campaign-composer-api';
import { moduleName } from '../constants';
import Importer from '../importer';
import { CCModuleData } from '../types';

interface MapWithBackground {
  cMap: CMap;
  background: MapBackground;
  metadata: MapMetadata;
  synced: boolean;
}

interface DocWithSyncStatus extends DocumentMeta{
  synced: boolean;
}

export default class CampaignComposerBrowser extends Application {
  loading? = 'Contacting Campaign Composer';
  error?: string;
  docs: DocWithSyncStatus[] = [];
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

  _setInitialChecks(): void {
    const anyDocsImported = this.docs.some((d) => d.synced);
    const anyMapsImported = this.maps.some((d) => d.synced);
    if(!anyDocsImported && !anyMapsImported) {
      console.log('Nothing imported from CC yet, setting everything to import by default');
      this.element.find('input:checkbox.campaign-composer-control').each((_, e) => {
        (e as HTMLInputElement).checked = true;
      });
    } else {
      console.log('Pre-selecting only unimported CC content');
      const allDocsImported = this.docs.every((d) => d.synced);
      const parentDocCheckbox = this.element.find(`input:checkbox[data-checkbox-category="doc"][data-checkbox-role="parent"]`).get(0) as HTMLInputElement;
      if (!anyDocsImported) {
        parentDocCheckbox.checked = true;
      } else if (!allDocsImported) {
        parentDocCheckbox.indeterminate = true;
      }
      const allMapsImported = this.maps.every((d) => d.synced);
      const parentMapCheckbox = this.element.find(`input:checkbox[data-checkbox-category="map"][data-checkbox-role="parent"]`).get(0) as HTMLInputElement;
      if (!anyMapsImported) {
        parentMapCheckbox.checked = true;
      } else if (!allMapsImported) {
        parentMapCheckbox.indeterminate = true;
      }
      this.element.find('input:checkbox.campaign-composer-control').each((_, e) => {
        const valueFields = (e as HTMLInputElement).value.split(':');
        const category = valueFields[0];
        const id = valueFields[1];
        if (category === 'doc') {
          if (!(this.docs.find((d) => d.id === id)?.synced ?? false)) {
            (e as HTMLInputElement).checked = true;
          } else {
            this._setSyncStatus('doc', id, false);
          }
        } else if (category === 'map') {
          if (!(this.maps.find((m) => m.cMap.id === id)?.synced ?? false)) {
            (e as HTMLInputElement).checked = true;
          } else {
            this._setSyncStatus('map', id, false);
          }
        }
      });
    }
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
    this._setInitialChecks();
    html
      .find('button.campaign-composer-control')
      .on('click', this._onClickControlButton.bind(this));
    html
      .find('input.campaign-composer-control:checkbox')
      .on('change', this._onCheckboxChange.bind(this));
  }

  _onCheckboxChange(event: Event): void {
    event.preventDefault();
    const element = event.currentTarget as HTMLInputElement;
    const role = element.dataset.checkboxRole;
    const category = element.dataset.checkboxCategory;
    const id = element.value.split(':')[1];
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
      $(event.target!).parent().find('.composer-item-sync-status').html();
      this._setSyncStatus(category, id, element.checked);
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

  _setSyncStatus(category: string, id: string, checked: boolean): void {
    let isSynced = false;
    if (category === 'doc') {
      isSynced = this.docs.find((d) => d.id === id)?.synced ?? false;
    } else if (category === 'map') {
      isSynced = this.maps.find((m) => m.cMap.id === id)?.synced ?? false;
    }

    const statusElement = this.element.find(`input:checkbox[value="${category}:${id}"]`).parent().find('.composer-item-sync-status');

    if (!isSynced) {
      statusElement.html('');
      return;
    } else if (checked) {
      statusElement.html('Overwrite Existing');
    } else {
      statusElement.html('In Foundry');
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
        const docsToOverwrite = toImportSorted.docs.map((d) => this.docs.find((e) => e.id === d)).filter((d) => d?.synced ?? false).map((d) => d!.title);
        const mapsToOverwrite = toImportSorted.maps.map((m) => this.docs.find((e) => e.id === m)).filter((m) => m?.synced ?? false).map((m) => m!.title);
        const toOverwrite = [...docsToOverwrite, ...mapsToOverwrite];
        if (toOverwrite.length > 0) {
          const toOverwriteSelected = toOverwrite.slice(0, 3);
          if (toOverwrite.length > 3) {
            toOverwriteSelected.push(`and ${toOverwrite.length - 3} other items...`);
          }
          let msg = '<p>This will replace the following files in Foundry:</p><br/>'
            + toOverwriteSelected.map((s) => `<p><strong>${s}</strong></p>`).join('\n')
            + "<br/><p>Do you want to continue? This acton can't be undone.</p>";
          let d: Dialog = new Dialog({
            title: "Overwrite existing files?",
            content: msg,
            buttons: {
            one: {
              label: "Cancel",
              callback: () => d.close(),
            },
            two: {
              label: "Overwrite",
              callback: async () => {
                d.close();
                this.loading = `Importing ${toImport.length} items`;
                this.render();
                await this.doImport(toImportSorted);
                this.close();
                this.loading = undefined;
              }
            }
            },
            default: "two",
            render: html => console.log("Register interactivity in the rendered dialog"),
            close: html => console.log("This always is logged no matter which option is chosen")
          });
          d.render(true);
        } else {
          this.loading = `Importing ${toImport.length} items`;
          this.render();
          await this.doImport(toImportSorted);
          this.close();
          this.loading = undefined;
        }
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
    const syncedMapIds = Scenes.instance.map(
      (s) => s.getFlag(moduleName, 'mapId') as string | undefined | null,
    ).filter((i) => !!i).map((i) => i as string);
    const journal = (game as Game).journal!;
    const syncedDocIds = journal.map(
      (e) => e.getFlag(moduleName, 'documentId') as string | undefined | null,
    ).filter((i) => !!i).map((i) => i as string);
    try {
      this.docs = (await module.client.listDocuments()).map((d) => Object.assign({ synced: syncedDocIds.includes(d.id) }, d));
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
                synced: syncedMapIds.includes(cMap.id),
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