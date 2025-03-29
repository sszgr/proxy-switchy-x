#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import zipFolder from "zip-folder";
import packageInfo from "../package.json" assert { type: "json" };

const SOURCE_DIR = path.resolve("dist");
const OUTPUT_DIR = path.resolve("release");

const ensureOutputDirExists = async () => {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`[+] Created output directory: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error(`[-] Failed to create output directory: ${error.message}`);
  }
};

const zipProject = (source, output, zipName) => {
  const zipPath = path.join(output, zipName);
  console.log(`[+] Creating ZIP: ${zipPath}`);

  zipFolder(source, zipPath, (error) => {
    if (error) {
      console.error(`[-] ZIP creation failed: ${error.message}`);
    } else {
      console.log("[+] ZIP created successfully!");
    }
  });
};

const main = async () => {
  const { name, version } = packageInfo;
  const zipFilename = `${name}-v${version}.zip`;

  await ensureOutputDirExists();
  zipProject(SOURCE_DIR, OUTPUT_DIR, zipFilename);
};

main();