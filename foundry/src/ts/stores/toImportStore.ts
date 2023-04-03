import type { Writable } from "svelte/store";

export interface ToImportData {
  docs: Set<string>
  maps: Set<string>
}

export type ToImportStore = Writable<ToImportData>;

export const toImportStorKey = Symbol();
