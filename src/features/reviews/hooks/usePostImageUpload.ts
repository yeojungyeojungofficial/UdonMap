import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { loadAuthSession } from "@/src/core/authSession";
import { getSupabaseBrowserClient } from "@/src/core/supabase";
import { convertImageFileToWebp } from "@/src/features/images/convertImageFileToWebp";
import {
  MAX_POST_PHOTOS,
  POST_IMAGE_STORAGE_BUCKET,
} from "@/src/features/reviews/postComposeConfig";

type UsePostImageUploadOptions = {
  buildResizableImage: (objectUrl: string, alt: string) => HTMLElement;
  countPhotos: () => number;
  insertNodeAtCursor: (node: Node) => void;
  onErrorMessage: (message: string) => void;
};

export function usePostImageUpload({
  buildResizableImage,
  countPhotos,
  insertNodeAtCursor,
  onErrorMessage,
}: UsePostImageUploadOptions) {
  const [photoCount, setPhotoCount] = useState(0);
  const [photoLimitMsg, setPhotoLimitMsg] = useState("");
  const [uploadingCount, setUploadingCount] = useState(0);
  const uploadedImagePathsRef = useRef<string[]>([]);

  const cleanupUploadedImages = useCallback(async () => {
    const paths = uploadedImagePathsRef.current;
    if (paths.length === 0) {
      return;
    }

    uploadedImagePathsRef.current = [];

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.storage.from(POST_IMAGE_STORAGE_BUCKET).remove(paths);
    } catch {
      // best-effort cleanup; storage policies may reject deletion in local setups
    }
  }, []);

  const syncPhotoCount = useCallback(() => {
    setPhotoCount(countPhotos());
  }, [countPhotos]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const incoming = Array.from(event.target.files ?? []);
      event.target.value = "";
      onErrorMessage("");

      const currentCount = countPhotos();
      const available = MAX_POST_PHOTOS - currentCount;

      if (available <= 0) {
        setPhotoLimitMsg(
          `사진은 최대 ${MAX_POST_PHOTOS}장까지 첨부할 수 있어요.`,
        );
        return;
      }

      const accepted = incoming.slice(0, available);
      if (accepted.length === 0) {
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const session = await loadAuthSession(supabase);

      if (!session) {
        onErrorMessage("로그인 후 사진을 첨부할 수 있습니다.");
        return;
      }

      setPhotoLimitMsg(
        accepted.length < incoming.length
          ? `사진은 최대 ${MAX_POST_PHOTOS}장까지 첨부할 수 있어요.`
          : "",
      );
      setUploadingCount((count) => count + accepted.length);

      await Promise.all(
        accepted.map(async (file, index) => {
          const altText = `첨부 사진 ${currentCount + index + 1}`;
          let blobUrl = "";
          let node: HTMLElement | null = null;

          try {
            const webpFile = await convertImageFileToWebp(file);
            blobUrl = URL.createObjectURL(webpFile);
            node = buildResizableImage(blobUrl, altText);

            insertNodeAtCursor(node);
            setPhotoCount((count) => count + 1);

            const path = `${session.user.id}/${Date.now()}-${index}.webp`;

            const { error } = await supabase.storage
              .from(POST_IMAGE_STORAGE_BUCKET)
              .upload(path, webpFile, {
                contentType: "image/webp",
                upsert: false,
              });

            if (error) {
              throw new Error(`이미지 업로드 실패: ${error.message}`);
            }

            uploadedImagePathsRef.current.push(path);
            const { data: urlData } = supabase.storage
              .from(POST_IMAGE_STORAGE_BUCKET)
              .getPublicUrl(path);

            const imgEl = node.querySelector("img");
            if (imgEl) {
              imgEl.src = urlData.publicUrl;
              imgEl.removeAttribute("data-object-url");
            }
            URL.revokeObjectURL(blobUrl);
          } catch (error) {
            node?.remove();
            if (blobUrl) {
              URL.revokeObjectURL(blobUrl);
              setPhotoCount((count) => Math.max(0, count - 1));
            }
            onErrorMessage(
              error instanceof Error
                ? error.message
                : "이미지 업로드 중 알 수 없는 오류가 발생했습니다.",
            );
          } finally {
            setUploadingCount((count) => Math.max(0, count - 1));
          }
        }),
      );
    },
    [buildResizableImage, countPhotos, insertNodeAtCursor, onErrorMessage],
  );

  return {
    cleanupUploadedImages,
    handleFileChange,
    photoCount,
    photoLimitMsg,
    syncPhotoCount,
    uploadingCount,
  };
}
