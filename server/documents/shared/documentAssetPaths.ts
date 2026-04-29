import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_PUBLIC_DIRECTORIES = [
  path.join('public', 'fonts', 'noto-sans-kr'),
  path.join('public', 'templates', 'inspection'),
] as const;

let cachedDocumentAssetRoot: string | null = null;

function hasRequiredDocumentAssets(rootDirectory: string) {
  return REQUIRED_PUBLIC_DIRECTORIES.every((relativeDirectory) =>
    fs.existsSync(path.join(rootDirectory, relativeDirectory)),
  );
}

function* walkAncestorDirectories(startDirectory: string) {
  let currentDirectory = path.resolve(startDirectory);

  while (true) {
    yield currentDirectory;

    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      break;
    }
    currentDirectory = parentDirectory;
  }
}

export function getDocumentAssetRoot() {
  if (cachedDocumentAssetRoot) {
    return cachedDocumentAssetRoot;
  }

  for (const candidateDirectory of walkAncestorDirectories(process.cwd())) {
    if (hasRequiredDocumentAssets(candidateDirectory)) {
      cachedDocumentAssetRoot = candidateDirectory;
      return candidateDirectory;
    }
  }

  throw new Error(
    `Unable to locate the shared document asset root from "${process.cwd()}". ` +
      'Expected to find public/fonts/noto-sans-kr and public/templates/inspection in an ancestor directory.',
  );
}

export function getDocumentAssetPublicDirectory() {
  return path.join(getDocumentAssetRoot(), 'public');
}

export function resolveDocumentPublicPath(...segments: string[]) {
  return path.join(getDocumentAssetPublicDirectory(), ...segments);
}

export function resolveNotoSansKrFontPath(filename: string) {
  return resolveDocumentPublicPath('fonts', 'noto-sans-kr', filename);
}

export function resolveInspectionTemplatePath(filename: string) {
  return resolveDocumentPublicPath('templates', 'inspection', filename);
}

export function resolveTemplateAssetPath(filename: string) {
  return path.join(getDocumentAssetRoot(), 'packages', 'template-assets', 'templates', filename);
}
