import { useCallback, useMemo, useState } from "react";

import type {
  CmsImageEditRequest,
  CmsMediaAsset,
  CmsMediaAssetCreate,
  CmsMediaAssetPatch,
} from "../api/cms";
import {
  useCreateEditorAsset,
  useCreateEditorImageEdit,
  useUpdateEditorAsset,
  useUploadEditorAsset,
} from "../queries";

export type EditorMediaHandlers = {
  assets: CmsMediaAsset[];
  onSelectAsset: (assetId: string) => void;
  onCreateMediaAsset: (asset: CmsMediaAssetCreate) => void;
  onCreateImageEdit: (assetId: string, request: CmsImageEditRequest) => void;
  onUpdateMediaAsset: (assetId: string, patch: CmsMediaAssetPatch) => void;
  onUploadMediaAsset: (file: File, altText: string) => Promise<unknown>;
  selectedAssetId: string;
};

/** Media-workspace wiring: the asset list, the selection and the
 *  upload/update/image-edit mutations, exposed as sidebar props. */
export function useEditorMediaHandlers(
  assets: CmsMediaAsset[],
  initialSelectedAssetId: string,
): EditorMediaHandlers {
  const [selectedAssetId, setSelectedAssetId] = useState(initialSelectedAssetId);
  const uploadAsset = useUploadEditorAsset();
  const createAsset = useCreateEditorAsset();
  const updateAsset = useUpdateEditorAsset();
  const createImageEdit = useCreateEditorImageEdit();

  const onCreateMediaAsset = useCallback((asset: CmsMediaAssetCreate) => {
    void createAsset.mutateAsync(asset);
  }, [createAsset]);

  const onCreateImageEdit = useCallback(
    (assetId: string, request: CmsImageEditRequest) => {
      void createImageEdit.mutateAsync({ assetId, request });
    },
    [createImageEdit],
  );

  const onUpdateMediaAsset = useCallback(
    (assetId: string, patch: CmsMediaAssetPatch) => {
      void updateAsset.mutateAsync({ assetId, patch });
    },
    [updateAsset],
  );

  const onUploadMediaAsset = useCallback(
    (file: File, altText: string) =>
      uploadAsset.mutateAsync({ altText, file }),
    [uploadAsset],
  );

  return useMemo(
    () => ({
      assets,
      onSelectAsset: setSelectedAssetId,
      onCreateMediaAsset,
      onCreateImageEdit,
      onUpdateMediaAsset,
      onUploadMediaAsset,
      selectedAssetId,
    }),
    [
      assets,
      onCreateMediaAsset,
      onCreateImageEdit,
      onUpdateMediaAsset,
      onUploadMediaAsset,
      selectedAssetId,
    ],
  );
}
