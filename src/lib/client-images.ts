export async function prepareImageForUpload(file: File) {
  if (file.size <= 3.5 * 1024 * 1024 || file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  return blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }) : file;
}
