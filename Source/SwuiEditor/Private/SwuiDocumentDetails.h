#pragma once

#include "CoreMinimal.h"
#include "IDetailCustomization.h"
#include "UObject/WeakObjectPtr.h"
#include "Input/Reply.h"

class USwuiDocumentAsset;
class IDetailLayoutBuilder;

class FSwuiDocumentDetails : public IDetailCustomization
{
public:
	static TSharedRef<IDetailCustomization> MakeInstance();
	virtual void CustomizeDetails(IDetailLayoutBuilder& DetailBuilder) override;

private:
	FReply OnOpenInBrowserClicked();

	TWeakObjectPtr<USwuiDocumentAsset> DocumentAssetPtr;
};
