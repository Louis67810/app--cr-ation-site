export type ProjectImageAsset = {
  public_url: string;
  original_name?: string | null;
  title?: string | null;
  storage_path?: string | null;
};

export function isArticleThumbnailAsset(asset: ProjectImageAsset) {
  const originalName = asset.original_name?.toLowerCase() ?? "";
  const title = asset.title?.toLowerCase() ?? "";
  const storagePath = asset.storage_path?.toLowerCase() ?? "";
  return (
    originalName.startsWith("miniature-") ||
    title.startsWith("miniature ·") ||
    title.startsWith("miniature -") ||
    storagePath.includes("/article-thumbnail-")
  );
}

export function visibleProjectImageAssets<T extends ProjectImageAsset>(
  assets: T[],
) {
  return assets.filter(
    (asset) => Boolean(asset.public_url) && !isArticleThumbnailAsset(asset),
  );
}
