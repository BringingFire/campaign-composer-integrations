import { moduleName } from "../constants";
import SvelteApp from "./composer.svelte";
import type ApplicationOptions from '@league-of-foundry-developers/foundry-vtt-types';

export default class CampaignComposerBrowser extends Application {
  private app: SvelteApp | undefined;

  static override get defaultOptions(): ApplicationOptions {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'campaign-composer-test',
      template: `modules/${moduleName}/templates/svelte.hbs`,
      width: 720,
      height: 720,
    }) as ApplicationOptions;
  }

  override get title(): string {
    return 'Composer Svelte Test';
  }

  override activateListeners(html: JQuery<HTMLElement>): void {
    super.activateListeners(html);
    const target = html.get()[0];
    this.app = new SvelteApp({
      target,
      props: {
        close: this.close.bind(this),
      }
    });
  }

  override close(options?: Application.CloseOptions): Promise<void> {
    this.app.$destroy();
    return super.close(options);
  }
}