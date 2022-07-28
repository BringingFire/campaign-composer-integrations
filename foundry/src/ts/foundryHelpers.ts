interface GetFolderArgs {
  type: foundry.CONST.FOLDER_DOCUMENT_TYPES;
  name: string;
  parent?: string | Folder;
}

export async function ensureFolder({
  type,
  name,
  parent,
}: GetFolderArgs): Promise<Folder> {
  const folder = (game as Game).folders!.find(
    (f: Folder) => f.data.type === type && f.name === name,
  );
  if (folder) return folder;

  const newFolder = await Folder.create({
    name,
    type,
    sorting: 'm',
    parent: parent,
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
