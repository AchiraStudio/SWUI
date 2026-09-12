#pragma once

#include "CoreMinimal.h"
#include "Factories/Factory.h"
#include "SwuiDocumentAsset.h"
#include "SwuiDocumentAssetFactory.generated.h"

/**
 * Factory for creating new USwuiDocumentAsset data assets in the Unreal Editor Content Browser.
 */
UCLASS(HideCategories=Object)
class USwuiDocumentAssetFactory : public UFactory
{
	GENERATED_BODY()

public:
	USwuiDocumentAssetFactory();

	virtual UObject* FactoryCreateNew(UClass* InClass, UObject* InParent, FName InName, EObjectFlags Flags, UObject* Context, FFeedbackContext* Warn) override;
	virtual bool ShouldShowInNewMenu() const override { return true; }
	virtual FText GetDisplayName() const override;
	virtual uint32 GetMenuCategories() const override;
};
