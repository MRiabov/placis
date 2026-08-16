import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  attachEditorAssetToSlot,
  completeEditorFileUpload,
  runEditorAssistant,
  createEditorAsset,
  createEditorAssetImageEdit,
  createEditorFileSignedUrl,
  createEditorFileUpload,
  createEditorPage,
  createEditorSection,
  getCurrentCmsSession,
  getEditorBusinessProfile,
  getEditorPage,
  getEditorProjects,
  listEditorAssets,
  listEditorPages,
  listEditorPosts,
  patchEditorAsset,
  publishEditorPage,
  saveEditorPage,
  updateEditorBusinessProfile,
  uploadFileToSignedUrl,
  type CmsAssetSlotAttach,
  type CmsAssistantRequest,
  type CmsAssistantResponse,
  type CmsBusinessProfile,
  type CmsBusinessProfilePatch,
  type CmsImageEditRequest,
  type CmsMediaAsset,
  type CmsMediaAssetCreate,
  type CmsMediaAssetPatch,
  type CmsPageCreate,
  type CmsPagePatch,
  type CmsPageProjection,
  type CmsPageSummary,
  type CmsPostSummary,
  type CmsProject,
  type CmsSectionCreate,
  type CmsSession,
} from "./api/cms";

export const cmsQueryKeys = {
  session: ["cms", "session"] as const,
  businessProfile: ["cms", "business-profile"] as const,
  pages: ["cms", "pages"] as const,
  page: (pageId: string) => ["cms", "page", pageId] as const,
  posts: ["cms", "posts"] as const,
  assets: ["cms", "assets"] as const,
  projects: ["cms", "projects"] as const,
};

export function useCmsSession(): UseQueryResult<CmsSession> {
  return useQuery<CmsSession>({
    queryKey: cmsQueryKeys.session,
    queryFn: getCurrentCmsSession,
    retry: 1,
  });
}

export function useCmsBusinessProfile(): UseQueryResult<CmsBusinessProfile> {
  return useQuery<CmsBusinessProfile>({
    queryKey: cmsQueryKeys.businessProfile,
    queryFn: getEditorBusinessProfile,
    retry: 1,
    // The details editor mirrors profile changes into its form state, so a
    // background refetch (window focus) would wipe unsaved edits. Load on
    // mount/refresh/save only, matching the old app's route behaviour.
    refetchOnWindowFocus: false,
  });
}

export function useUpdateCmsBusinessProfile(): UseMutationResult<
  CmsBusinessProfile,
  Error,
  CmsBusinessProfilePatch
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CmsBusinessProfilePatch) =>
      updateEditorBusinessProfile(body),
    onSuccess: (profile) => {
      void queryClient.setQueryData(cmsQueryKeys.businessProfile, profile);
    },
  });
}

export function useEditorPages(): UseQueryResult<CmsPageSummary[]> {
  return useQuery<CmsPageSummary[]>({
    queryKey: cmsQueryKeys.pages,
    queryFn: listEditorPages,
    retry: 1,
  });
}

export function useEditorPage(
  pageId: string | undefined,
): UseQueryResult<CmsPageProjection> {
  return useQuery<CmsPageProjection>({
    queryKey: cmsQueryKeys.page(pageId ?? ""),
    queryFn: () => getEditorPage(pageId as string),
    enabled: Boolean(pageId),
    retry: 1,
  });
}

export function useCreateEditorPage(): UseMutationResult<
  CmsPageProjection,
  Error,
  CmsPageCreate
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CmsPageCreate) => createEditorPage(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cmsQueryKeys.pages });
    },
  });
}

export function useCreateEditorSection(
  pageId: string,
): UseMutationResult<CmsPageProjection, Error, CmsSectionCreate> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => createEditorSection(pageId, body),
    onSuccess: (projection) => {
      void queryClient.setQueryData(cmsQueryKeys.page(pageId), projection);
      void queryClient.invalidateQueries({ queryKey: cmsQueryKeys.pages });
    },
  });
}

export function usePublishEditorPage(
  pageId: string,
): UseMutationResult<CmsPageProjection, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => publishEditorPage(pageId),
    onSuccess: (projection) => {
      void queryClient.setQueryData(cmsQueryKeys.page(pageId), projection);
      void queryClient.invalidateQueries({ queryKey: cmsQueryKeys.pages });
    },
  });
}

export function useSaveEditorPage(
  pageId: string,
): UseMutationResult<CmsPageProjection, Error, CmsPagePatch> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CmsPagePatch) => saveEditorPage(pageId, body),
    onSuccess: (projection) => {
      void queryClient.setQueryData(cmsQueryKeys.page(pageId), projection);
      void queryClient.invalidateQueries({ queryKey: cmsQueryKeys.pages });
    },
  });
}

export function useEditorPosts(): UseQueryResult<CmsPostSummary[]> {
  return useQuery<CmsPostSummary[]>({
    queryKey: cmsQueryKeys.posts,
    queryFn: listEditorPosts,
    retry: 1,
  });
}

export function useEditorAssets(): UseQueryResult<CmsMediaAsset[]> {
  return useQuery<CmsMediaAsset[]>({
    queryKey: cmsQueryKeys.assets,
    queryFn: listEditorAssets,
    retry: 1,
    // Kept in sync with useCmsBusinessProfile: the details editor selects a
    // logo from this list and mirroring a background refetch into the form
    // would discard unsaved edits.
    refetchOnWindowFocus: false,
  });
}

export function useUploadEditorAsset(): UseMutationResult<
  CmsMediaAsset,
  Error,
  { altText: string; file: File }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ altText, file }) => {
      const fileRecord = await createEditorFileUpload({
        category: "cms_media_asset",
        content_type: file.type || null,
        filename: file.name,
        metadata: { source: "cms_media_panel" },
        size_bytes: file.size,
      });
      if (!fileRecord.id) {
        throw new Error("Created file upload did not include an id");
      }
      const signedUrl = await createEditorFileSignedUrl(fileRecord.id);
      await uploadFileToSignedUrl(file, signedUrl);
      const completed = await completeEditorFileUpload(fileRecord.id);
      if (!completed.id) {
        throw new Error("Completed file upload did not include an id");
      }
      const publicUrl = completed.public_url || signedUrl.url;
      return createEditorAsset({
        alt_text: altText.trim() || null,
        asset_type: "image",
        file_id: completed.id,
        metadata: {
          // file_upload is server-owned: the route rebuilds it from the
          // file record, and embedding the full FileRead here 422s the
          // strict CmsAssetMetadata schema.
          preview_url: publicUrl,
          public_url: publicUrl,
          requested_from: "cms_media_panel",
        },
        provenance: {
          source_filename: file.name,
          source_label: file.name,
        },
        review_status: "pending_review",
        source: "upload",
        source_url: publicUrl,
      });
    },
    onSuccess: (asset) => {
      void queryClient.setQueryData<CmsMediaAsset[]>(
        cmsQueryKeys.assets,
        (current) =>
          current
            ? [asset, ...current.filter((entry) => entry.id !== asset.id)]
            : [asset],
      );
    },
  });
}

export function useCreateEditorAsset(): UseMutationResult<
  CmsMediaAsset,
  Error,
  CmsMediaAssetCreate
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEditorAsset,
    onSuccess: (asset) => {
      void queryClient.setQueryData<CmsMediaAsset[]>(
        cmsQueryKeys.assets,
        (current) =>
          current
            ? [asset, ...current.filter((entry) => entry.id !== asset.id)]
            : [asset],
      );
    },
  });
}

export function useUpdateEditorAsset(): UseMutationResult<
  CmsMediaAsset,
  Error,
  { assetId: string; patch: CmsMediaAssetPatch }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, patch }) => patchEditorAsset(assetId, patch),
    onSuccess: (asset) => {
      void queryClient.setQueryData<CmsMediaAsset[]>(
        cmsQueryKeys.assets,
        (current) =>
          current
            ? current.map((entry) => (entry.id === asset.id ? asset : entry))
            : [asset],
      );
    },
  });
}

export function useAttachEditorAssetToSlot(
  pageId: string,
): UseMutationResult<
  CmsPageProjection,
  Error,
  {
    sectionId: string;
    slotKey: string;
    assetId: string;
    label: string;
    targetImageUrl?: string;
  }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionId, slotKey, assetId, label, targetImageUrl }) => {
      const body: CmsAssetSlotAttach = {
        asset_id: assetId,
        slot_type: "image",
        label,
        status: "draft",
        ...(targetImageUrl ? { target_image_url: targetImageUrl } : {}),
      };
      return attachEditorAssetToSlot(pageId, sectionId, slotKey, body);
    },
    onSuccess: (projection) => {
      void queryClient.setQueryData(cmsQueryKeys.page(pageId), projection);
      void queryClient.invalidateQueries({ queryKey: cmsQueryKeys.pages });
    },
  });
}

export function useCreateEditorImageEdit(): UseMutationResult<
  CmsMediaAsset,
  Error,
  { assetId: string; request: CmsImageEditRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, request }) =>
      createEditorAssetImageEdit(assetId, request),
    onSuccess: (asset) => {
      void queryClient.setQueryData<CmsMediaAsset[]>(
        cmsQueryKeys.assets,
        (current) =>
          current
            ? [asset, ...current.filter((entry) => entry.id !== asset.id)]
            : [asset],
      );
    },
  });
}

export function useEditorProjects(): UseQueryResult<CmsProject[]> {
  return useQuery<CmsProject[]>({
    queryKey: cmsQueryKeys.projects,
    queryFn: async () => (await getEditorProjects()).projects ?? [],
    retry: 1,
  });
}

export function useRunEditorAssistant(
  pageId: string,
): UseMutationResult<
  CmsAssistantResponse,
  Error,
  { request: CmsAssistantRequest }
> {
  return useMutation({
    mutationFn: ({ request }) => runEditorAssistant(pageId, request),
  });
}
