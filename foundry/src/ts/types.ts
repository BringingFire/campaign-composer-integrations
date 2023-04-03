import type { ModuleData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/packages.mjs";
import type {
  CMap,
  DefaultApi,
  DocumentMeta,
  MapBackground,
  MapMetadata,
} from "campaign-composer-api";
import type CampaignComposerBrowser from "./apps/composer";
import type SvelteTest from "./apps/composer";

export interface CCModuleData extends Game.ModuleData<ModuleData> {
  composerBrowser: CampaignComposerBrowser;
  svelteTest: SvelteTest;
  client: DefaultApi;
  activeCampaign: number;
}

export interface MapWithBackground {
  cMap: CMap;
  background: MapBackground;
  metadata: MapMetadata;
  synced: boolean;
}

export interface DocWithSyncStatus extends DocumentMeta {
  synced: boolean;
}
