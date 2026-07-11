import { describe, expect, it } from "vitest";
import {
  canDeleteCocktail,
  canEditCocktail,
  cocktailKey,
  extractCocktailImagePath,
  mapUserCocktailRow,
  parseIngredients,
  validateCocktailForm,
  validateImageFile,
} from "./user-cocktails";

const owner = { id: "owner-id" };
const stranger = { id: "stranger-id" };
const userCocktail = { id: "cocktail-id", name: "Night Bloom", userId: owner.id };
const validForm = { name: "Night Bloom" };
const validIngredients = ["45ml Gin", "20ml Lemon"];
const staticCocktails = [{ name: "Whiskey Sour" }];

describe("user cocktail identity", () => {
  it("uses stable keys for user and static cocktails", () => {
    expect(cocktailKey(userCocktail)).toBe("user:cocktail-id");
    expect(cocktailKey({ name: "Martini" })).toBe("static:Martini");
    expect(cocktailKey(null)).toBe("");
  });

  it("maps database rows to the view model", () => {
    expect(
      mapUserCocktailRow({
        id: "id",
        name: "Name",
        zh_name: "中文名",
        category: "signature",
        base: "gin",
        image: null,
        naming: "Naming",
        story: "Story",
        profile: "Profile",
        method: "Shake",
        ingredients: null,
        user_id: "user",
        user_name: "Member",
        created_at: "created",
        updated_at: "updated",
      }),
    ).toMatchObject({
      zhName: "中文名",
      image: "",
      ingredients: [],
      userId: "user",
      createdAt: "created",
      updatedAt: "updated",
    });
  });
});

describe("cocktail form validation", () => {
  it("normalizes ingredient lines", () => {
    expect(parseIngredients(" Gin 45ml \r\n\n Lemon 20ml ")).toEqual(["Gin 45ml", "Lemon 20ml"]);
  });

  it("accepts JPEG and PNG images up to 5MB", () => {
    expect(validateImageFile({ type: "image/jpeg", size: 1024 })).toBe("");
    expect(validateImageFile({ type: "image/png", size: 5 * 1024 * 1024 })).toBe("");
  });

  it("rejects unsupported and oversized images", () => {
    expect(validateImageFile({ type: "image/webp", size: 1024 })).toContain("仅支持");
    expect(validateImageFile({ type: "image/png", size: 5 * 1024 * 1024 + 1 })).toContain("5MB");
  });

  it("requires an image during creation but not editing", () => {
    expect(
      validateCocktailForm({
        form: validForm,
        ingredients: validIngredients,
        staticCocktails,
        imageFile: null,
        requireImage: true,
      }),
    ).toContain("请选择");
    expect(
      validateCocktailForm({
        form: validForm,
        ingredients: validIngredients,
        staticCocktails,
        imageFile: null,
        requireImage: false,
      }),
    ).toBe("");
  });

  it("requires between two and twelve ingredients", () => {
    expect(
      validateCocktailForm({
        form: validForm,
        ingredients: ["only one"],
        staticCocktails,
        imageFile: null,
        requireImage: false,
      }),
    ).toContain("2–12");
    expect(
      validateCocktailForm({
        form: validForm,
        ingredients: Array.from({ length: 13 }, (_, index) => `item ${index}`),
        staticCocktails,
        imageFile: null,
        requireImage: false,
      }),
    ).toContain("2–12");
  });

  it("rejects ingredient lines outside the length boundary", () => {
    expect(
      validateCocktailForm({
        form: validForm,
        ingredients: ["x", "valid item"],
        staticCocktails,
        imageFile: null,
        requireImage: false,
      }),
    ).toContain("2–120");
  });

  it("rejects names that collide with static cocktails", () => {
    expect(
      validateCocktailForm({
        form: { name: "whiskey sour" },
        ingredients: validIngredients,
        staticCocktails,
        imageFile: null,
        requireImage: false,
      }),
    ).toContain("英文名称已存在");
  });
});

describe("cocktail permissions", () => {
  it("allows only the author to edit", () => {
    expect(canEditCocktail(userCocktail, owner)).toBe(true);
    expect(canEditCocktail(userCocktail, stranger)).toBe(false);
    expect(canEditCocktail({ name: "Static" }, owner)).toBe(false);
  });

  it("allows the author or an admin to delete", () => {
    expect(canDeleteCocktail(userCocktail, owner, false)).toBe(true);
    expect(canDeleteCocktail(userCocktail, stranger, false)).toBe(false);
    expect(canDeleteCocktail(userCocktail, stranger, true)).toBe(true);
  });
});

describe("cocktail image paths", () => {
  it("extracts and decodes a public Storage object path", () => {
    expect(
      extractCocktailImagePath(
        "https://project.supabase.co/storage/v1/object/public/cocktail-images/user-id/night%20bloom.png?version=1",
      ),
    ).toBe("user-id/night bloom.png");
  });

  it("rejects URLs outside the cocktail image bucket", () => {
    expect(extractCocktailImagePath("https://example.com/image.png")).toBe("");
    expect(extractCocktailImagePath("")).toBe("");
  });
});
