export const COCKTAIL_IMAGE_BUCKET = "cocktail-images";
export const COCKTAIL_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
export const COCKTAIL_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
export const USER_COCKTAIL_SELECT =
  "id,name,zh_name,category,base,image,naming,story,profile,method,ingredients,user_id,user_name,created_at,updated_at";

export function isUserCocktail(cocktail) {
  return Boolean(cocktail?.id);
}

export function cocktailKey(cocktail) {
  if (!cocktail) return "";
  return isUserCocktail(cocktail) ? `user:${cocktail.id}` : `static:${cocktail.name}`;
}

export function mapUserCocktailRow(row) {
  return {
    id: row.id,
    name: row.name,
    zhName: row.zh_name,
    category: row.category,
    base: row.base,
    image: row.image || "",
    naming: row.naming,
    story: row.story,
    profile: row.profile,
    method: row.method,
    ingredients: row.ingredients || [],
    userId: row.user_id,
    userName: row.user_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export function parseIngredients(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateImageFile(file) {
  if (!file) return "";
  if (!COCKTAIL_IMAGE_TYPES.has(file.type)) return "图片仅支持 JPG、JPEG 或 PNG 格式。";
  if (file.size > COCKTAIL_IMAGE_MAX_SIZE) return "图片大小不能超过 5MB。";
  return "";
}

export function validateCocktailForm({ form, ingredients, staticCocktails, imageFile, requireImage }) {
  if (requireImage && !imageFile) return "请选择一张 JPG 或 PNG 酒款图片。";

  const imageError = validateImageFile(imageFile);
  if (imageError) return imageError;

  if (ingredients.length < 2 || ingredients.length > 12) {
    return "配方材料必须填写 2–12 行，每行一种材料。";
  }
  if (ingredients.some((item) => item.length < 2 || item.length > 120)) {
    return "每条配方材料需为 2–120 个字符。";
  }
  if (staticCocktails.some((item) => item.name.toLowerCase() === form.name.toLowerCase())) {
    return "该英文名称已存在，请为新酒款使用唯一名称。";
  }
  return "";
}

export function canEditCocktail(cocktail, user) {
  return isUserCocktail(cocktail) && Boolean(user && cocktail.userId === user.id);
}

export function canDeleteCocktail(cocktail, user, isAdmin) {
  return isUserCocktail(cocktail) && Boolean(user && (isAdmin || cocktail.userId === user.id));
}

export function buildCocktailImagePath(userId, file) {
  const extension = file.type === "image/png" ? "png" : "jpg";
  const uniqueName =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${userId}/${uniqueName}.${extension}`;
}

export function extractCocktailImagePath(imageUrl) {
  if (!imageUrl) return "";
  const marker = `/object/public/${COCKTAIL_IMAGE_BUCKET}/`;
  const markerIndex = imageUrl.indexOf(marker);
  if (markerIndex < 0) return "";

  const path = imageUrl.slice(markerIndex + marker.length).split(/[?#]/, 1)[0];
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

export async function uploadCocktailImage(client, file, userId) {
  const storagePath = buildCocktailImagePath(userId, file);
  const { error: uploadError } = await client.storage.from(COCKTAIL_IMAGE_BUCKET).upload(storagePath, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw new Error(`图片上传失败：${uploadError.message}`);

  const { data } = client.storage.from(COCKTAIL_IMAGE_BUCKET).getPublicUrl(storagePath);
  const imageUrl = data?.publicUrl || "";
  if (!imageUrl) {
    await client.storage.from(COCKTAIL_IMAGE_BUCKET).remove([storagePath]);
    throw new Error("图片已上传，但无法获取公开地址。");
  }
  return { imageUrl, storagePath };
}

export async function removeCocktailImage(client, imageUrlOrPath) {
  const storagePath = imageUrlOrPath.includes("://")
    ? extractCocktailImagePath(imageUrlOrPath)
    : imageUrlOrPath;
  if (!storagePath) return null;

  const { error } = await client.storage.from(COCKTAIL_IMAGE_BUCKET).remove([storagePath]);
  return error || null;
}

export async function fetchUserCocktailById(client, id) {
  const { data, error } = await client
    .from("user_cocktails")
    .select(USER_COCKTAIL_SELECT)
    .eq("id", id)
    .single();
  return { cocktail: data ? mapUserCocktailRow(data) : null, error };
}

export async function updateUserCocktail(client, id, userId, payload) {
  return client
    .from("user_cocktails")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .single();
}

export async function deleteUserCocktail(client, cocktail, userId, isAdmin) {
  let query = client.from("user_cocktails").delete().eq("id", cocktail.id);
  if (!isAdmin) query = query.eq("user_id", userId);
  return query;
}
