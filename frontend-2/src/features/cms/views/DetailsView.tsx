import type { ReactNode } from "react";

import type { CmsBusinessProfilePatch } from "../api/cms";
import { DetailsEditor } from "../details/DetailsEditor";
import {
  useCmsBusinessProfile,
  useEditorAssets,
  useUpdateCmsBusinessProfile,
} from "../queries";

export function DetailsView(): ReactNode {
  const profileQuery = useCmsBusinessProfile();
  const assetsQuery = useEditorAssets();
  const updateProfile = useUpdateCmsBusinessProfile();

  const error =
    profileQuery.error?.message ??
    assetsQuery.error?.message ??
    updateProfile.error?.message ??
    null;

  return (
    <div className="cms-details-page h-full min-h-0">
      <DetailsEditor
        error={error}
        mediaAssets={assetsQuery.data ?? []}
        profile={profileQuery.data ?? null}
        saving={updateProfile.isPending}
        onRefresh={() => {
          void profileQuery.refetch();
          void assetsQuery.refetch();
        }}
        onSave={(patch: CmsBusinessProfilePatch) => {
          void updateProfile.mutate(patch);
        }}
      />
    </div>
  );
}
