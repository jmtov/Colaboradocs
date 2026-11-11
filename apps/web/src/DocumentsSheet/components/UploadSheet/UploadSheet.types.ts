export type UploadSheetProps = {
  /** `null`: cerrada. `{}`: documento nuevo. `{ replaceId }`: reemplaza ese documento. */
  target: { replaceId?: string } | null;
  onClose: () => void;
};

export type Problem = { message: string; details: string[] };
