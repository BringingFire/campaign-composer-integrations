<script lang="ts">
  export let title: string;
  export let synced: boolean;
  export let selected: boolean
  export let onChange: (boolean) => void;

</script>

<article class="composer-item-row flexrow">
    <input
      class="row-checkbox"
      type="checkbox"
      bind:checked={selected}
      on:change={() => onChange(selected)}
    />
    {#if $$slots.leading}
    <span class="leading-slot">
      <slot name="leading" />
    </span>
    {/if}
    <h3>{title}</h3>
    <h4 class="composer-item-sync-status">
      {#if synced}
      {#if selected}
      Overwrite Existing
      {:else}
      In Foundry
      {/if}
      {/if}
    </h4>
</article>

<style lang="scss">
  .composer-item-sync-status {
    flex: unset;
    padding-right: 1em;
  }

  .composer-item-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-bottom: 1px solid var(--color-underline-header);

    * {
      border-bottom: none;
      margin: 0.5rem 0 0.5rem 0;
    }

    .row-checkbox, .leading-slot {
      flex: unset;
      margin-right: 1em;
    }
  }
</style>