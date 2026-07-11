import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const redirectsPath = resolve("dist/_redirects");

if (existsSync(redirectsPath)) {
  unlinkSync(redirectsPath);
}
