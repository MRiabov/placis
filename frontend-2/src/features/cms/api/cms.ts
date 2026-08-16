import { apiClient } from "@/shared/api/client";
import type { components } from "@/generated/api-types";

type Schemas = components["schemas"];

export type CmsPageSummary = Schemas["WebsiteEditorPageSummaryRead"];
export type CmsSlot = Schemas["WebsiteEditorSlotRead"];
export type CmsDesignControl = Schemas["WebsiteEditorDesignControlRead"];
export type CmsSectionDesign = NonNullable<CmsSection["design"]>;
export type CmsSection = Schemas["WebsiteEditorSectionRead"];
export type CmsForm = Schemas["WebsiteEditorFormRead"];
export type CmsFormField = NonNullable<CmsForm["fields"]>[number];
export type CmsNavigationItem = Schemas["WebsiteEditorNavigationItemRead"];
export type CmsValidationIssue = Schemas["CmsValidationIssue"];
export type CmsValidationReport = Schemas["CmsValidationReport"];
export type CmsPageCreate = Schemas["WebsiteEditorPageCreate"];
export type CmsPageProjection = Schemas["WebsiteEditorPageRead"];
export type CmsPagePatch = Schemas["WebsiteEditorPagePatch"];
export type CmsPostCreate = Schemas["WebsiteEditorPostCreate"];
export type CmsPostPatch = Schemas["WebsiteEditorPostPatch-Input"];
export type CmsPostProjection = Schemas["WebsiteEditorPostRead"];
export type CmsPostSummary = CmsPostProjection;
export type CmsAssistantRequest = Schemas["WebsiteEditorAssistantRequest"];
export type CmsAssistantRevertRequest =
  Schemas["WebsiteEditorAssistantRevertRequest"];
export type CmsAssistantRevertResponse =
  Schemas["WebsiteEditorAssistantRevertResponse"];
export type CmsAssistantResponse = Schemas["WebsiteEditorAssistantResponse"];
export type CmsPostAssistantResponse =
  Schemas["WebsiteEditorPostAssistantResponse"];
export type CmsCareersAssistantResponse =
  Schemas["WebsiteEditorCareersAssistantResponse"];
export type CmsRealtimeVoiceSessionCreate =
  Schemas["WebsiteEditorRealtimeVoiceSessionCreate"];
export type CmsRealtimeVoiceSession =
  Schemas["WebsiteEditorRealtimeVoiceSessionRead"];
export type CmsBlueprintApply = Schemas["WebsiteBlueprintApplyRead"];
export type CmsBlueprintSummary = {
  id: string;
  schema_version: number;
  name: string;
  description: string;
  status: "stub" | "ready";
  page_type: string;
  page_type_label: string;
  primary_page_title: string;
  primary_page_path: string;
  template_key: string;
  page_count: number;
  form_count: number;
  navigation_item_count: number;
};
export type CmsMediaAsset = Schemas["WebsiteEditorAssetRead"];
export type CmsMediaAssetCreate = Schemas["WebsiteEditorAssetCreate"];
export type CmsImageEditRequest = Schemas["WebsiteEditorImageEditRequest"];
export type CmsMediaAssetPatch = Schemas["WebsiteEditorAssetPatch"];
export type CmsAssetSlotAttach = Schemas["WebsiteEditorAssetSlotAttach"];
export type CmsFileUpload = Schemas["FileRead"];
export type CmsFileUploadCreate = Schemas["FileUploadRequest"];
export type CmsSignedUrl = Schemas["SignedUrlResponse"];
export type CmsSectionCreate = Schemas["WebsiteEditorSectionCreate"];
export type CmsSectionOrderPatch = Schemas["WebsiteEditorSectionOrderPatch"];
export type CmsCertificationDefinition =
  Schemas["WebsiteCertificationDefinitionRead"];
export type CmsCertificationSelection =
  Schemas["WebsiteCertificationSelectionRead"];
export type CmsCertificationSelectionPatch =
  Schemas["WebsiteCertificationSelectionPatch"];
export type CmsCareers = Schemas["WebsiteEditorCareersRead"];
export type CmsCareerSettingsPatch =
  Schemas["WebsiteEditorCareerSettingsPatch-Input"];
export type CmsCareerOpeningCreate =
  Schemas["WebsiteEditorCareerOpeningCreate-Input"];
export type CmsCareerOpeningPatch = Schemas["WebsiteEditorCareerOpeningPatch"];
export type CmsCareerOpening = Schemas["WebsiteEditorCareerOpeningRead"];
export type CmsCareerSettings = Schemas["WebsiteEditorCareerSettingsRead"];
export type CmsProjects = Schemas["WebsiteEditorProjectsRead"];
export type CmsProjectSettings = Schemas["WebsiteEditorProjectSettingsRead"];
export type CmsProjectSettingsPatch =
  Schemas["WebsiteEditorProjectSettingsPatch"];
export type CmsProjectCreate = Schemas["WebsiteEditorProjectCreate"];
export type CmsProjectPatch = Schemas["WebsiteEditorProjectPatch"];
export type CmsProject = Schemas["WebsiteEditorProjectRead"];
export type CmsBusinessProfile = Schemas["WebsiteEditorBusinessProfileRead"];
export type CmsBusinessProfilePatch =
  Schemas["WebsiteEditorBusinessProfilePatch"];
export type CmsReviewOption = Schemas["WebsiteEditorReviewOptionRead"];
export type CmsReviewOptionList = Schemas["WebsiteEditorReviewOptionListRead"];
export type CmsSession = Schemas["MeResponse"];

function apiError(error: unknown, fallback: string): Error {
  if (error && typeof error === "object" && "detail" in error) {
    const detail = (error as { detail: unknown }).detail;
    if (typeof detail === "string") {
      return new Error(detail);
    }
    if (detail && typeof detail === "object" && "status" in detail) {
      return new Error(
        `Request failed: ${(detail as { status: string }).status}`,
      );
    }
  }
  return new Error(fallback);
}

export async function getCurrentCmsSession(): Promise<CmsSession> {
  const response = await apiClient.GET("/api/v1/me");
  if (response.error) {
    throw apiError(response.error, "Failed to load session.");
  }
  return response.data;
}

export async function listEditorPages(): Promise<CmsPageSummary[]> {
  const response = await apiClient.GET("/api/v1/website/editor/pages");
  if (response.error) {
    throw apiError(response.error, "Failed to list pages.");
  }
  return (response.data as { items: CmsPageSummary[] }).items;
}

export async function getEditorPage(
  pageId: string,
): Promise<CmsPageProjection> {
  const response = await apiClient.GET(
    "/api/v1/website/editor/pages/{page_id}",
    {
      params: { path: { page_id: pageId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to load page.");
  }
  return response.data;
}

export async function createEditorPage(
  body: CmsPageCreate,
): Promise<CmsPageProjection> {
  const response = await apiClient.POST("/api/v1/website/editor/pages", {
    body,
  });
  if (response.error) {
    throw apiError(response.error, "Failed to create page.");
  }
  return response.data;
}

export async function saveEditorPage(
  pageId: string,
  body: CmsPagePatch,
): Promise<CmsPageProjection> {
  const response = await apiClient.PATCH(
    "/api/v1/website/editor/pages/{page_id}",
    {
      body,
      params: { path: { page_id: pageId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to save page.");
  }
  return response.data;
}

export async function publishEditorPage(
  pageId: string,
): Promise<CmsPageProjection> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/pages/{page_id}/publish",
    {
      params: { path: { page_id: pageId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to publish page.");
  }
  return response.data;
}

export async function createEditorSection(
  pageId: string,
  body: CmsSectionCreate,
): Promise<CmsPageProjection> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/pages/{page_id}/sections",
    {
      body,
      params: { path: { page_id: pageId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to create section.");
  }
  return response.data;
}

export async function reorderEditorSections(
  pageId: string,
  body: CmsSectionOrderPatch,
): Promise<CmsPageProjection> {
  const response = await apiClient.PATCH(
    "/api/v1/website/editor/pages/{page_id}/sections/order",
    {
      body,
      params: { path: { page_id: pageId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to reorder sections.");
  }
  return response.data;
}

export async function deleteEditorSection(
  pageId: string,
  sectionId: string,
): Promise<CmsPageProjection> {
  const response = await apiClient.DELETE(
    "/api/v1/website/editor/pages/{page_id}/sections/{section_id}",
    {
      params: { path: { page_id: pageId, section_id: sectionId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to delete section.");
  }
  return response.data;
}

export async function attachEditorAssetToSlot(
  pageId: string,
  sectionId: string,
  slotKey: string,
  body: CmsAssetSlotAttach,
): Promise<CmsPageProjection> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/pages/{page_id}/sections/{section_id}/slots/{slot_key}/asset",
    {
      body,
      params: {
        path: {
          page_id: pageId,
          section_id: sectionId,
          slot_key: slotKey,
        },
      },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to attach asset to slot.");
  }
  return response.data;
}

export async function listEditorPosts(): Promise<CmsPostSummary[]> {
  const response = await apiClient.GET("/api/v1/website/editor/posts");
  if (response.error) {
    throw apiError(response.error, "Failed to list posts.");
  }
  return (response.data as { items: CmsPostSummary[] }).items;
}

export async function getEditorPost(
  postId: string,
): Promise<CmsPostProjection> {
  const response = await apiClient.GET(
    "/api/v1/website/editor/posts/{post_id}",
    {
      params: { path: { post_id: postId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to load post.");
  }
  return response.data;
}

export async function createEditorPost(
  body: CmsPostCreate,
): Promise<CmsPostProjection> {
  const response = await apiClient.POST("/api/v1/website/editor/posts", {
    body,
  });
  if (response.error) {
    throw apiError(response.error, "Failed to create post.");
  }
  return response.data;
}

export async function saveEditorPost(
  postId: string,
  body: CmsPostPatch,
): Promise<CmsPostProjection> {
  const response = await apiClient.PATCH(
    "/api/v1/website/editor/posts/{post_id}",
    {
      body,
      params: { path: { post_id: postId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to save post.");
  }
  return response.data;
}

export async function publishEditorPost(
  postId: string,
): Promise<CmsPostProjection> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/posts/{post_id}/publish",
    {
      params: { path: { post_id: postId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to publish post.");
  }
  return response.data;
}

export async function hideEditorPost(
  postId: string,
): Promise<CmsPostProjection> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/posts/{post_id}/hide",
    {
      params: { path: { post_id: postId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to hide post.");
  }
  return response.data;
}

export async function archiveEditorPost(
  postId: string,
): Promise<CmsPostProjection> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/posts/{post_id}/archive",
    {
      params: { path: { post_id: postId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to archive post.");
  }
  return response.data;
}

export async function runEditorPostAssistant(
  postId: string,
  body: CmsAssistantRequest,
): Promise<CmsPostAssistantResponse> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/posts/{post_id}/assistant",
    {
      body,
      params: { path: { post_id: postId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to run post assistant.");
  }
  return response.data;
}

export async function listEditorBlueprints(): Promise<CmsBlueprintSummary[]> {
  const response = await apiClient.GET("/api/v1/website/editor/blueprints");
  if (response.error) {
    throw apiError(response.error, "Failed to list blueprints.");
  }
  return (response.data as { items: CmsBlueprintSummary[] }).items;
}

export async function applyEditorBlueprintDraft(
  blueprintId: string,
): Promise<CmsBlueprintApply> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/blueprints/{blueprint_id}/draft",
    {
      params: { path: { blueprint_id: blueprintId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to apply blueprint.");
  }
  return response.data;
}

export async function listEditorCertifications(
  trade: string,
): Promise<CmsCertificationDefinition[]> {
  const response = await apiClient.GET(
    "/api/v1/website/editor/certifications",
    { params: { query: { trade } } },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to list certifications.");
  }
  return (response.data as { items: CmsCertificationDefinition[] }).items;
}

export async function listEditorCertificationSelections(): Promise<
  CmsCertificationSelection[]
> {
  const response = await apiClient.GET(
    "/api/v1/website/editor/certification-selections",
  );
  if (response.error) {
    throw apiError(response.error, "Failed to list certification selections.");
  }
  return (response.data as { items: CmsCertificationSelection[] }).items;
}

export async function putEditorCertificationSelection(
  certificationId: string,
  body: CmsCertificationSelectionPatch,
): Promise<CmsCertificationSelection> {
  const response = await apiClient.PUT(
    "/api/v1/website/editor/certification-selections/{certification_id}",
    {
      body,
      params: { path: { certification_id: certificationId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to save certification.");
  }
  return response.data;
}

export async function deleteEditorCertificationSelection(
  certificationId: string,
): Promise<void> {
  const response = await apiClient.DELETE(
    "/api/v1/website/editor/certification-selections/{certification_id}",
    { params: { path: { certification_id: certificationId } } },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to remove certification.");
  }
}

export async function getEditorCareers(): Promise<CmsCareers> {
  const response = await apiClient.GET("/api/v1/website/editor/careers");
  if (response.error) {
    throw apiError(response.error, "Failed to load careers.");
  }
  return response.data;
}

export async function runEditorCareersAssistant(
  body: CmsAssistantRequest,
): Promise<CmsCareersAssistantResponse> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/careers/assistant",
    { body },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to run careers assistant.");
  }
  return response.data;
}

export async function updateEditorCareerSettings(
  body: CmsCareerSettingsPatch,
): Promise<CmsCareerSettings> {
  const response = await apiClient.PATCH(
    "/api/v1/website/editor/careers/settings",
    { body },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to update career settings.");
  }
  return response.data;
}

export async function createEditorCareerOpening(
  body: CmsCareerOpeningCreate,
): Promise<CmsCareerOpening> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/careers/openings",
    { body },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to create career opening.");
  }
  return response.data;
}

export async function updateEditorCareerOpening(
  openingId: string,
  body: CmsCareerOpeningPatch,
): Promise<CmsCareerOpening> {
  const response = await apiClient.PATCH(
    "/api/v1/website/editor/careers/openings/{opening_id}",
    {
      body,
      params: { path: { opening_id: openingId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to update career opening.");
  }
  return response.data;
}

export async function archiveEditorCareerOpening(
  openingId: string,
): Promise<CmsCareerOpening> {
  const response = await apiClient.DELETE(
    "/api/v1/website/editor/careers/openings/{opening_id}",
    {
      params: { path: { opening_id: openingId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to archive career opening.");
  }
  return response.data;
}

export async function getEditorProjects(): Promise<CmsProjects> {
  const response = await apiClient.GET("/api/v1/website/editor/projects");
  if (response.error) {
    throw apiError(response.error, "Failed to load projects.");
  }
  return response.data;
}

export async function updateEditorProjectSettings(
  body: CmsProjectSettingsPatch,
): Promise<CmsProjectSettings> {
  const response = await apiClient.PATCH(
    "/api/v1/website/editor/projects/settings",
    { body },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to update project settings.");
  }
  return response.data;
}

export async function createEditorProject(
  body: CmsProjectCreate,
): Promise<CmsProject> {
  const response = await apiClient.POST("/api/v1/website/editor/projects", {
    body,
  });
  if (response.error) {
    throw apiError(response.error, "Failed to create project.");
  }
  return response.data;
}

export async function updateEditorProject(
  projectId: string,
  body: CmsProjectPatch,
): Promise<CmsProject> {
  const response = await apiClient.PATCH(
    "/api/v1/website/editor/projects/{project_id}",
    {
      body,
      params: { path: { project_id: projectId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to update project.");
  }
  return response.data;
}

export async function archiveEditorProject(
  projectId: string,
): Promise<CmsProject> {
  const response = await apiClient.DELETE(
    "/api/v1/website/editor/projects/{project_id}",
    {
      params: { path: { project_id: projectId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to archive project.");
  }
  return response.data;
}

export async function getEditorBusinessProfile(): Promise<CmsBusinessProfile> {
  const response = await apiClient.GET(
    "/api/v1/website/editor/business-profile",
  );
  if (response.error) {
    throw apiError(response.error, "Failed to load business profile.");
  }
  return response.data;
}

export async function updateEditorBusinessProfile(
  body: CmsBusinessProfilePatch,
): Promise<CmsBusinessProfile> {
  const response = await apiClient.PATCH(
    "/api/v1/website/editor/business-profile",
    { body },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to update business profile.");
  }
  return response.data;
}

export async function listEditorAssets(): Promise<CmsMediaAsset[]> {
  const response = await apiClient.GET("/api/v1/website/editor/assets");
  if (response.error) {
    throw apiError(response.error, "Failed to list assets.");
  }
  return (response.data as { items: CmsMediaAsset[] }).items;
}

export async function listEditorReviewOptions(): Promise<CmsReviewOptionList> {
  const response = await apiClient.GET("/api/v1/website/editor/reviews");
  if (response.error) {
    throw apiError(response.error, "Failed to list review options.");
  }
  return response.data;
}

export async function createEditorAsset(
  body: CmsMediaAssetCreate,
): Promise<CmsMediaAsset> {
  const response = await apiClient.POST("/api/v1/website/editor/assets", {
    body,
  });
  if (response.error) {
    throw apiError(response.error, "Failed to create asset.");
  }
  return response.data;
}

export async function createEditorFileUpload(
  body: CmsFileUploadCreate,
): Promise<CmsFileUpload> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/files/uploads",
    { body },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to create file upload.");
  }
  return response.data;
}

export async function createEditorFileSignedUrl(
  fileId: string,
): Promise<CmsSignedUrl> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/files/{file_id}/signed-url",
    {
      params: { path: { file_id: fileId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to create signed url.");
  }
  return response.data;
}

export async function completeEditorFileUpload(
  fileId: string,
): Promise<CmsFileUpload> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/files/{file_id}/complete",
    {
      params: { path: { file_id: fileId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to complete file upload.");
  }
  return response.data;
}

export async function uploadFileToSignedUrl(
  file: File,
  signedUrl: CmsSignedUrl,
): Promise<void> {
  if (signedUrl.url.startsWith("https://storage.local/")) {
    return;
  }
  const method = signedUrl.method.toUpperCase();
  const fields = signedUrl.fields ?? {};
  let response: Response;
  if (method === "POST" && Object.keys(fields).length) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, String(value));
    }
    formData.append("file", file);
    response = await fetch(signedUrl.url, { body: formData, method: "POST" });
  } else {
    response = await fetch(signedUrl.url, {
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
      method,
    });
  }
  if (!response.ok) {
    throw new Error("Upload failed. Please try again.");
  }
}

export async function patchEditorAsset(
  assetId: string,
  body: CmsMediaAssetPatch,
): Promise<CmsMediaAsset> {
  const response = await apiClient.PATCH(
    "/api/v1/website/editor/assets/{asset_id}",
    {
      body,
      params: { path: { asset_id: assetId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to update asset.");
  }
  return response.data;
}

export async function createEditorAssetImageEdit(
  assetId: string,
  body: CmsImageEditRequest,
): Promise<CmsMediaAsset> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/assets/{asset_id}/image-edits",
    {
      body,
      params: { path: { asset_id: assetId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to run image edit.");
  }
  return response.data;
}

export async function runEditorAssistant(
  pageId: string,
  body: CmsAssistantRequest,
): Promise<CmsAssistantResponse> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/pages/{page_id}/assistant",
    {
      body,
      params: { path: { page_id: pageId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to run assistant.");
  }
  return response.data;
}

export async function createEditorRealtimeVoiceSession(
  body: CmsRealtimeVoiceSessionCreate,
): Promise<CmsRealtimeVoiceSession> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/realtime-voice-session",
    { body },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to create voice session.");
  }
  return response.data;
}

export async function revertEditorAssistant(
  pageId: string,
  body: CmsAssistantRevertRequest,
): Promise<CmsAssistantRevertResponse> {
  const response = await apiClient.POST(
    "/api/v1/website/editor/pages/{page_id}/assistant/revert",
    {
      body,
      params: { path: { page_id: pageId } },
    },
  );
  if (response.error) {
    throw apiError(response.error, "Failed to revert assistant.");
  }
  return response.data;
}
