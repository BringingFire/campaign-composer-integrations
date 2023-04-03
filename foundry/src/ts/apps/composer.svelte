<script lang="ts">
  import { onMount, setContext } from "svelte";
  import { writable } from "svelte/store";
  import BookLoader from "../components/bookLoader.svelte";
  import ImportPicker from "../components/importPicker.svelte";
  import { moduleName } from "../constants";
  import Importer from "../utils/importer";
  import type { ToImportData } from "../stores/toImportStore";
  import { toImportStorKey } from "../stores/toImportStore";
  import type {
    CCModuleData,
    DocWithSyncStatus,
    MapWithBackground
  } from "../types";
  import { showConfirmDialog } from "../utils/foundryDialog";

  export let close: () => void;

  let loading: string | undefined = "Contacting Campaign Composer";
  let error: string | undefined;
  let docs: DocWithSyncStatus[] = [];
  let maps: MapWithBackground[] = [];

  const toImportStore = writable<ToImportData>({ docs: new Set(), maps: new Set() });

  setContext(toImportStorKey, toImportStore);

  onMount(async () => {
    await fetchLists();
    $toImportStore.docs = new Set(
      docs.filter((d) => !d.synced).map((d) => d.id)
    );
    $toImportStore.maps = new Set(
      maps.filter((m) => !m.synced).map((m) => m.cMap.id)
    );
  });

  async function fetchLists() {
    loading = "Contacting Campaign Composer";
    const module = (game as Game).modules.get(moduleName) as CCModuleData;
    console.log("Fetching composer content lists");
    const syncedMapIds = Scenes.instance
      .map((s) => s.getFlag(moduleName, "mapId") as string | undefined | null)
      .filter((i) => !!i)
      .map((i) => i as string);
    const journal = (game as Game).journal!;
    const syncedDocIds = journal
      .map(
        (e) => e.getFlag(moduleName, "documentId") as string | undefined | null
      )
      .filter((i) => !!i)
      .map((i) => i as string);
    try {
      docs = (
        await module.client.listDocuments({ campaignId: module.activeCampaign })
      ).map((d) => Object.assign({ synced: syncedDocIds.includes(d.id) }, d));
      console.log(`Fetched ${docs.length} documents`);
      const mapRows = await module.client.listMaps({
        campaignId: module.activeCampaign,
      });
      maps = (
        await Promise.all(
          mapRows.map(async (cMap) => {
            try {
              const background = await module.client.getMapBackground({
                campaignId: module.activeCampaign,
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
          })
        )
      ).filter((m): m is MapWithBackground => !!m);
      console.log(`Fetched ${maps.length} maps`);
    } catch (e) {
      error = "Could not connect to Campaign Composer";
    }

    loading = undefined;
    error = undefined;
  }

  async function onImport() {
    const importArgs = {
      docs: [...$toImportStore.docs],
      maps: [...$toImportStore.maps],
    };
    const toImportCount = importArgs.docs.length + importArgs.maps.length;
    if (toImportCount < 1) return;

    const importCallback = async () => {
      loading = `Importing ${toImportCount} items`;
      await doImport(importArgs);
      close();
    };

    const docsToOverwrite = importArgs.docs
      .map((docId) => docs.find((d) => d.id == docId))
      .filter((d) => d?.synced ?? false)
      .map((d) => d!.title);
    const mapsToOverwrite = importArgs.maps
      .map((mapId) => maps.find((m) => m.cMap.id == mapId))
      .filter((m) => m?.synced ?? false)
      .map((m) => m!.cMap.title);
    const toOverwrite = [...docsToOverwrite, ...mapsToOverwrite];

    if (toOverwrite.length < 1) {
      await importCallback();
      return;
    }

    const toOverwriteSelected = toOverwrite.slice(0, 3);
    if (toOverwrite.length > 3) {
      toOverwriteSelected.push(`and ${toOverwrite.length - 3} other items...`);
    }
    let msg =
      "<p>This will replace the following files in Foundry:</p><br/>" +
      toOverwriteSelected
        .map((s) => `<p><strong>${s}</strong></p>`)
        .join("\n") +
      "<br/><p>Do you want to continue? This action can't be undone.</p>";
    showConfirmDialog({
      title: "Overwrite existing files?",
      body: msg,
      confirmLabel: "Overwrite",
      onConfirm: importCallback,
    });
  }

  async function doImport({
    docs,
    maps,
  }: {
    docs: string[];
    maps: string[];
  }): Promise<void> {
    const module = (game as Game).modules.get(moduleName) as CCModuleData;
    const importer = new Importer({
      client: module.client,
      campaignId: module.activeCampaign,
    });
    let titleForAlert: string | undefined | null;
    for (const docId of docs) {
      const doc = await importer.importDocument(docId);
      titleForAlert ??= doc?.name;
    }
    for (const mapId of maps) {
      const map = await importer.importMap(mapId);
      titleForAlert ??= (map as any)?.name;
    }
    const numImported = importer.importedCount;
    if (numImported == 1) {
      ui.notifications?.info(`${titleForAlert} was successfully imported.`);
    } else if (numImported > 1) {
      ui.notifications?.info(
        `${titleForAlert} and ${
          numImported - 1
        } other items were successfully imported.`
      );
    }
  }
</script>

{#if loading}
  <section class="campaign-composer-loading-initial">
    <BookLoader message={loading} />
  </section>
{:else if error}
  <section class="campaign-composer-loading-initial">
    <p>{error}</p>
  </section>
{:else}
  <ImportPicker {docs} {maps} onCancel={close} {onImport} />
{/if}
