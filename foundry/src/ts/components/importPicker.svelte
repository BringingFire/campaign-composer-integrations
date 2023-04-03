<script lang="ts">
  import { getContext } from "svelte";
  import type { ToImportStore } from "../stores/toImportStore";
  import { toImportStorKey } from "../stores/toImportStore";
  import type { DocWithSyncStatus, MapWithBackground } from "../types";
  import ImportPickerRow from "./importPickerRow.svelte";

  export let onCancel: () => void;
  export let onImport: () => void;
  export let maps: MapWithBackground[];
  export let docs: DocWithSyncStatus[];

  const toImportStore = getContext<ToImportStore>(toImportStorKey);

  let allDocsSelected: boolean, someDocsSelected: boolean;
  $: {
    const selectedCount = $toImportStore.docs.size;
    allDocsSelected = selectedCount === docs.length;
    someDocsSelected = selectedCount > 0 && !allDocsSelected;
  }
  let allMapsSelected: boolean, someMapsSelected: boolean;
  $: {
    const selectedCount = $toImportStore.maps.size;
    allMapsSelected = selectedCount === maps.length;
    someMapsSelected = selectedCount > 0 && !allMapsSelected;
  }

  function toggleAllDocs() {
    const select = !allDocsSelected;
    $toImportStore.docs.clear();
    if (select) {
      $toImportStore.docs = new Set(docs.map((d) => d.id));
    } else {
      $toImportStore.docs = new Set();
    }
  }

  function toggleAllMaps() {
    const select = !allMapsSelected;
    if (select) {
      $toImportStore.maps = new Set(maps.map((d) => d.cMap.id));
    } else {
      $toImportStore.maps = new Set();
    }
  }
</script>

<div class="campaign-composer-modal">
  <div class="campaign-composer-lists">
    <section>
      <header class="composer-checkbox-header">
        <input
          class="campaign-composer-control"
          type="checkbox"
          bind:checked={allMapsSelected}
          bind:indeterminate={someMapsSelected}
          on:change={toggleAllMaps}
        />
        <h2>Maps</h2>
      </header>
      <div class="composer-entity-rows">
        {#each maps as map}
          <ImportPickerRow
            title={map.cMap.title ?? "Untitled Map"}
            synced={map.synced}
            selected={$toImportStore.maps.has(map.cMap.id)}
            onChange={(v) => {
              if (v) {
                $toImportStore.maps.add(map.cMap.id);
              } else {
                $toImportStore.maps.delete(map.cMap.id);
              }
              $toImportStore.maps = $toImportStore.maps;
            }}
          >
            <img
              slot="leading"
              class="map-thumbnail"
              src="data:image/jpeg;base64,{map.background.image}"
              alt="Thumbnail for map {map.cMap.title ?? 'Untitled Map'}"
            />
          </ImportPickerRow>
        {/each}
      </div>
    </section>

    <section style="margin-right: 10px;">
      <header class="composer-checkbox-header">
        <input
          class="campaign-composer-control"
          type="checkbox"
          bind:checked={allDocsSelected}
          bind:indeterminate={someDocsSelected}
          on:change={toggleAllDocs}
        />
        <h2>Documents</h2>
      </header>
      <div class="composer-entity-rows">
        {#each docs as doc}
          <ImportPickerRow
            title={doc.title ?? "Untitled Document"}
            synced={doc.synced}
            selected={$toImportStore.docs.has(doc.id)}
            onChange={(v) => {
              if (v) {
                $toImportStore.docs.add(doc.id);
              } else {
                $toImportStore.docs.delete(doc.id);
              }
              $toImportStore.docs = $toImportStore.docs;
            }}
          >
            <i slot="leading" class="fas fa-file-lines" />
          </ImportPickerRow>
        {/each}
      </div>
    </section>
  </div>
  <div class="composer-modal-controls">
    <button on:click={onCancel}>Cancel</button>
    <button on:click={onImport}>Import</button>
  </div>
</div>

<style lang="scss">
  .composer-checkbox-header {
    display: flex;
    flex-direction: row;
    border-bottom: 1px solid var(--color-underline-header);
    margin-bottom: 0.5em;

    h2 {
      flex: 1;
      border-bottom: none;
    }
  }

  .campaign-composer-modal {
    max-height: 100%;
    display: flex;
    flex-direction: column;
  }

  .composer-entity-rows {
    padding-left: 6px;
  }

  .campaign-composer-lists {
    display: flex;
    flex: 1;
    flex-direction: row;
    column-gap: 0.5em;
    max-height: calc(100% - 2.8em);

    > * {
      flex: 1;
      max-height: 100%;

      > div {
        overflow-y: scroll;
        max-height: calc(100% - 2.8em);
      }
    }
  }

  .map-thumbnail {
    flex: none;
    border: none;
    height: 64px;
    width: 64px;
    margin-right: 20px;
    object-fit: cover;
    object-position: center;
  }
</style>
