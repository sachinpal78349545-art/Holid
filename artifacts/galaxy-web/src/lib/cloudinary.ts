const CLOUD_NAME = "dz1bhfpkc";
const UPLOAD_PRESET = "Profile_pic";

const IMAGE_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

const AUTO_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

function optimizedImageUrl(
  url: string,
  width = 800,
  height = 800,
): string {
  if (!url.includes("/upload/")) return url;

  if (
    url.includes("/upload/w_") ||
    url.includes("/upload/c_") ||
    url.includes("/upload/q_auto")
  ) {
    return url;
  }

  return url.replace(
    "/upload/",
    `/upload/w_${width},h_${height},c_limit,q_auto,f_auto/`,
  );
}

export async function uploadToCloudinary(
  file: File | Blob,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const fileType = file.type || "";

  const isAudio = fileType.startsWith("audio/");
  const isVideo = fileType.startsWith("video/");
  const isImage = fileType.startsWith("image/");

  // Audio/video -> auto upload
  // Image -> image upload
  const endpoint =
    isAudio || isVideo
      ? AUTO_UPLOAD_URL
      : IMAGE_UPLOAD_URL;

  const formData = new FormData();

  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("file", file);

  console.log("[Cloudinary] Uploading:", {
    endpoint,
    type: fileType,
    sizeMB: ((file.size || 0) / 1024 / 1024).toFixed(2),
  });

  onProgress?.(10);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    onProgress?.(70);

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "[Cloudinary] Upload failed:",
        response.status,
        errorText,
      );

      throw new Error(
        `Cloudinary upload failed (${response.status})`,
      );
    }

    const data = await response.json();

    if (!data?.secure_url) {
      throw new Error("Cloudinary did not return secure_url");
    }

    onProgress?.(100);

    const rawUrl = data.secure_url as string;

    console.log("[Cloudinary] SUCCESS:", rawUrl);

    // Images can be optimized.
    // Video/audio should keep the original secure URL.
    if (isImage) {
      return optimizedImageUrl(rawUrl);
    }

    return rawUrl;
  } catch (error) {
    console.error("[Cloudinary] Error:", error);
    throw error;
  }
}

export function getOptimizedUrl(
  url: string,
  width = 800,
  height = 800,
): string {
  if (!url || !url.includes("cloudinary.com")) {
    return url;
  }

  if (
    url.includes("/upload/w_") ||
    url.includes("/upload/c_") ||
    url.includes("/upload/q_auto")
  ) {
    return url;
  }

  return optimizedImageUrl(url, width, height);
}