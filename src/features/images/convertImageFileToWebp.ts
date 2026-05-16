const WEBP_MIME_TYPE = "image/webp";
const WEBP_QUALITY = 0.86;
const MAX_IMAGE_DIMENSION = 2048;

function getWebpFileName(fileName: string) {
  const nameWithoutExtension = fileName.replace(/\.[^.]+$/, "");
  return `${nameWithoutExtension || "image"}.webp`;
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지를 WebP로 변환할 수 없습니다."));
    };
    image.src = objectUrl;
  });
}

function canvasToWebpBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.type !== WEBP_MIME_TYPE) {
          reject(new Error("이 브라우저에서 WebP 변환을 지원하지 않습니다."));
          return;
        }

        resolve(blob);
      },
      WEBP_MIME_TYPE,
      WEBP_QUALITY,
    );
  });
}

export async function convertImageFileToWebp(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 첨부할 수 있습니다.");
  }

  if (file.type === WEBP_MIME_TYPE) {
    return new File([file], getWebpFileName(file.name), {
      type: WEBP_MIME_TYPE,
      lastModified: file.lastModified,
    });
  }

  const image = await loadImageFromFile(file);
  const originalWidth = image.naturalWidth || image.width;
  const originalHeight = image.naturalHeight || image.height;

  if (originalWidth <= 0 || originalHeight <= 0) {
    throw new Error("이미지 크기를 확인할 수 없습니다.");
  }

  const scale =
    Math.max(originalWidth, originalHeight) > MAX_IMAGE_DIMENSION
      ? MAX_IMAGE_DIMENSION / Math.max(originalWidth, originalHeight)
      : 1;
  const width = Math.round(originalWidth * scale);
  const height = Math.round(originalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("이미지를 WebP로 변환할 수 없습니다.");
  }

  context.drawImage(image, 0, 0, width, height);
  const webpBlob = await canvasToWebpBlob(canvas);

  return new File([webpBlob], getWebpFileName(file.name), {
    type: WEBP_MIME_TYPE,
    lastModified: file.lastModified,
  });
}
