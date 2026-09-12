#include "SwuiDocumentDetails.h"
#include "SwuiDocumentAsset.h"
#include "DetailLayoutBuilder.h"
#include "DetailCategoryBuilder.h"
#include "DetailWidgetRow.h"
#include "Widgets/Input/SButton.h"
#include "Widgets/Text/STextBlock.h"
#include "HAL/PlatformProcess.h"
#include "Misc/Paths.h"

#define LOCTEXT_NAMESPACE "SwuiEditor"

TSharedRef<IDetailCustomization> FSwuiDocumentDetails::MakeInstance()
{
	return MakeShareable(new FSwuiDocumentDetails);
}

void FSwuiDocumentDetails::CustomizeDetails(IDetailLayoutBuilder& DetailBuilder)
{
	TArray<TWeakObjectPtr<UObject>> Objects;
	DetailBuilder.GetObjectsBeingCustomized(Objects);

	if (Objects.Num() > 0)
	{
		DocumentAssetPtr = Cast<USwuiDocumentAsset>(Objects[0].Get());
	}

	IDetailCategoryBuilder& DocCategory = DetailBuilder.EditCategory("SWUI|Document", LOCTEXT("DocCategoryLabel", "SWUI Document Setup"), ECategoryPriority::Important);

	DocCategory.AddCustomRow(LOCTEXT("ActionsFilter", "Actions"))
		.WholeRowContent()
		[
			SNew(SHorizontalBox)
			+ SHorizontalBox::Slot()
			.AutoWidth()
			.Padding(2.f, 4.f)
			[
				SNew(SButton)
				.ToolTipText(LOCTEXT("OpenBrowserTip", "Open the configured Entry URL in the default browser for preview and development."))
				.OnClicked(this, &FSwuiDocumentDetails::OnOpenInBrowserClicked)
				[
					SNew(STextBlock)
					.Text(LOCTEXT("OpenInBrowser", "Open in External Browser"))
				]
			]
		];
}

FReply FSwuiDocumentDetails::OnOpenInBrowserClicked()
{
	if (!DocumentAssetPtr.IsValid())
	{
		return FReply::Handled();
	}

	FString URL = DocumentAssetPtr->EntryURL;
	if (URL.StartsWith(TEXT("local://")) || URL.StartsWith(TEXT("file:///")))
	{
		FString Rel = URL;
		Rel.RemoveFromStart(TEXT("local://"));
		Rel.RemoveFromStart(TEXT("file:///"));
		FString FullPath = FPaths::ConvertRelativePathToFull(FPaths::ProjectContentDir() / Rel);
		FPlatformProcess::LaunchURL(*FullPath, nullptr, nullptr);
	}
	else if (URL.StartsWith(TEXT("http://")) || URL.StartsWith(TEXT("https://")))
	{
		FPlatformProcess::LaunchURL(*URL, nullptr, nullptr);
	}
	else
	{
		FString FullPath = FPaths::ConvertRelativePathToFull(FPaths::ProjectContentDir() / URL);
		FPlatformProcess::LaunchURL(*FullPath, nullptr, nullptr);
	}

	return FReply::Handled();
}

#undef LOCTEXT_NAMESPACE
