package main

// pipelineHappyPathLeftover is required TestPipelineHappyPath* names that do
// not yet exist in internal/**/*_test.go. A name may only disappear in the
// same PR that adds the func. New paired pipeline/testing files fail
// immediately.
var pipelineHappyPathLeftover = []string{
	"TestPipelineHappyPathAds01CreateAd",
	"TestPipelineHappyPathAds02GenerateAdDraft",
	"TestPipelineHappyPathAds03ApproveAd",
	"TestPipelineHappyPathAds04ExportAdSet",
	"TestPipelineHappyPathAdsFull",
	"TestPipelineHappyPathEtlFacebook",
	"TestPipelineHappyPathEtlFull",
	"TestPipelineHappyPathEtlGoogleMaps",
	"TestPipelineHappyPathEtlInstagram",
	"TestPipelineHappyPathEtlPhotoClassification",
	"TestPipelineHappyPathEtlProjects",
	"TestPipelineHappyPathEtlTradeRegistry",
	"TestPipelineHappyPathEtlWebSearch",
	"TestPipelineHappyPathEtlWebsiteCrawl",
	"TestPipelineHappyPathOnboarding01FindBusiness",
	"TestPipelineHappyPathOnboarding02BusinessResearch",
	"TestPipelineHappyPathOnboarding03ConfirmData",
	"TestPipelineHappyPathOnboarding04aTextClientInterview",
	"TestPipelineHappyPathOnboarding05SelectAndCopyWebsiteTemplate",
	"TestPipelineHappyPathOnboarding06WebsiteCopyGeneration",
	"TestPipelineHappyPathOnboarding07ContractorCopyImprovement",
	"TestPipelineHappyPathOnboarding08PreviewWebsiteAddress",
	"TestPipelineHappyPathOnboarding09WebsiteActivation",
	"TestPipelineHappyPathOnboardingBuildProfile",
	"TestPipelineHappyPathOnboardingFull",
	"TestPipelineHappyPathWebsite01SelectWebsiteTemplate",
	"TestPipelineHappyPathWebsite02CopyWebsiteTemplatePages",
	"TestPipelineHappyPathWebsite03WebsiteCopyGeneration",
	"TestPipelineHappyPathWebsite04WebsitePublication",
	"TestPipelineHappyPathWebsiteFull",
}
