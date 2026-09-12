#include "SwuiDocumentAssetFactory.h"
#include "AssetTypeCategories.h"

USwuiDocumentAssetFactory::USwuiDocumentAssetFactory()
{
	SupportedClass = USwuiDocumentAsset::StaticClass();
	bCreateNew = true;
	bEditAfterNew = true;
}

UObject* USwuiDocumentAssetFactory::FactoryCreateNew(UClass* InClass, UObject* InParent, FName InName, EObjectFlags Flags, UObject* Context, FFeedbackContext* Warn)
{
	return NewObject<USwuiDocumentAsset>(InParent, InClass, InName, Flags);
}

FText USwuiDocumentAssetFactory::GetDisplayName() const
{
	return NSLOCTEXT("SwuiEditor", "SwuiDocumentAssetFactory_DisplayName", "SWUI UI Document");
}

uint32 USwuiDocumentAssetFactory::GetMenuCategories() const
{
	return EAssetTypeCategories::UI;
}
