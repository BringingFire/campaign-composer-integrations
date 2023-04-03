export interface ShowConfirmDialogArgs {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => (void | Promise<unknown>)
}

export function showConfirmDialog(args: ShowConfirmDialogArgs) {
    let d: Dialog = new Dialog({
      title: args.title,
      content: args.body,
      buttons: {
        cancel: {
          label: "Cancel",
          callback: () => d.close(),
        },
        accept: {
          label: args.confirmLabel,
          callback: async () => {
            await args.onConfirm();
            d.close();
          },
        },
      },
      default: 'accept',
    });
    d.render(true);
}
