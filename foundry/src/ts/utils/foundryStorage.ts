interface GetFolderArgs {
  type: foundry.CONST.FOLDER_DOCUMENT_TYPES;
  name: string;
}

export async function ensureFolder({
  type,
  name,
}: GetFolderArgs): Promise<Folder> {
  const folder = (game as Game).folders!.find(
    (f: Folder) => f.type === type && f.name === name,
  );
  if (folder) return folder;

  const newFolder = await Folder.create({
    name,
    type,
    sorting: 'm',
  });
  return newFolder as Folder;
}

interface DirectoryArgs {
  type: FilePicker.SourceType;
  path: string;
}

export async function ensureDirectory({ type, path }: DirectoryArgs) {
  try {
    const result = await FilePicker.createDirectory(type, path);
    console.log(result);
  } catch (error) {
    if (typeof error == 'string' && error.startsWith('EEXIST')) {
      return;
    }
    throw error;
  }
}
