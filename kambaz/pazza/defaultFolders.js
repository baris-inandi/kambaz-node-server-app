const DEFAULT_FOLDER_NAMES = [
  "hw1",
  "hw2",
  "hw3",
  "project",
  "exam",
  "logistics",
  "other",
  "office_hours",
];

export const DEFAULT_PAZZA_FOLDERS = DEFAULT_FOLDER_NAMES.map((name) => ({
  _id: name,
  name,
}));

export const cloneDefaultPazzaFolders = () =>
  DEFAULT_PAZZA_FOLDERS.map((folder) => ({ ...folder }));
