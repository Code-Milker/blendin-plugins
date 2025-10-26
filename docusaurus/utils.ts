import { Config, I18nConfig } from '@docusaurus/types';
import path from 'path';
import fg from 'fast-glob'; // Fast glob for finding files
import fs from 'fs'; // Node.js file system module
import { BlendinConfig, BlendinLocaleCode, DEFAULT_FLAGS } from '@blendin/types';
import { DocusaurusBlendinPluginOptions } from './types';

export interface SourceFileRootsAndPluginName {
  pluginName: string;
  sourceFileRoots: string;
}
/**
 * Function to retrieve all documentation roots based on the Docusaurus configuration.
 *
 * @param config - Docusaurus site configuration.
 * @param options - Options provided to the Docusaurus Blendin plugin.
 * @returns An array of documentation root paths.
 */
export const getSourceFileRootsAndPluginNames = (
  config: Config,
  options: DocusaurusBlendinPluginOptions
): SourceFileRootsAndPluginName[] => {
  const docsFolders: { pluginName: string; sourceFileRoots: string }[] = [];
  // Handle classic preset docs path
  config.presets?.forEach((preset) => {
    if (Array.isArray(preset)) {
      const [presetName, presetOptions] = preset;

      if (presetName === 'classic' && presetOptions) {
        const classicOptions = presetOptions as {
          docs?: { path?: string };
          blog?: { path?: string };
          pages;
        };
        if (classicOptions?.docs) {
          docsFolders.push({
            sourceFileRoots: path.resolve(process.cwd(), classicOptions?.docs?.path ?? 'docs'),
            pluginName: 'docusaurus-plugin-content-docs',
          });
        }
        if (classicOptions?.blog) {
          docsFolders.push({
            sourceFileRoots: path.resolve(process.cwd(), classicOptions.blog?.path ?? 'blog'),
            pluginName: 'docusaurus-plugin-content-blog',
          });
        }
        if (classicOptions?.pages) {
          docsFolders.push({
            sourceFileRoots: path.resolve(process.cwd(), classicOptions.pages?.path ?? 'src/pages'),
            pluginName: 'docusaurus-plugin-content-pages',
          });
        }
      }
    }
  });

  // Handle custom plugins that might define a docs path
  config.plugins?.forEach((plugin) => {
    if (Array.isArray(plugin)) {
      const [pluginName, pluginOptions] = plugin;
      const options = pluginOptions as { path?: string };
      if (options.path) {
        const docsPath = options?.path;
        if (docsPath) {
          docsFolders.push({
            sourceFileRoots: path.resolve(process.cwd(), docsPath),
            pluginName: pluginName as string,
          });
        }
      }
    }
  });

  return docsFolders;
};

export interface SourceFilePathAndPluginName {
  pluginName: string;
  sourceFilePath: string;
}
/**
 * Function to retrieve all source files with relevant extensions from given folders.
 *
 * @param folders - Array of folder paths to search for files.
 * @returns An array of file paths with relevant extensions.
 */
export const getAllSourceFiles = (
  folders: SourceFileRootsAndPluginName[]
): SourceFilePathAndPluginName[] => {
  const extensions = ['.md', '.mdx', '.json', '.txt', '.html'];
  let allFiles: SourceFilePathAndPluginName[] = [];

  folders.forEach((folder) => {
    const files = fs.readdirSync(folder.sourceFileRoots, { withFileTypes: true });
    if (files.length) {
      files.forEach((file) => {
        const fullPath = path.join(folder.sourceFileRoots, file.name);
        if (file.isDirectory()) {
          // Recursively search subdirectories
          //
          allFiles = allFiles.concat(
            getAllSourceFiles([{ sourceFileRoots: fullPath, pluginName: folder.pluginName }])
          );
        } else if (extensions.includes(path.extname(file.name))) {
          // Include only the files with the relevant extensions
          allFiles.push({ sourceFilePath: fullPath, pluginName: folder.pluginName });
        }
      });
    }
  });

  return allFiles;
};

/**
 * Function to retrieve the locales configuration.
 *
 * @param i18n - Docusaurus i18n configuration.
 * @returns An object containing default and target locales.
 */
export const getLocalesConfig = (i18n: I18nConfig): Pick<BlendinConfig, 'locales'> => {
  const blendinLocales: BlendinLocaleCode[] = i18n.locales.map((locale) => DEFAULT_FLAGS[locale]);
  const sourceLocales = blendinLocales.filter(
    (locale) => locale !== DEFAULT_FLAGS[i18n.defaultLocale]
  );

  return {
    locales: {
      defaultLocale: i18n.defaultLocale,
      targetLocales: sourceLocales,
    },
  };
};

/**
 * Options interface for copying documentation files to locales.
 */
interface CopyDocsToLocalesOptions {
  sourceFiles: SourceFilePathAndPluginName[]; // The list of source files to move
  targetLocales: BlendinLocaleCode[]; // The locales to move the files to
  defaultLocale: BlendinLocaleCode; // The default locale
}

/**
 * Function to copy documentation files to each specified locale, following Docusaurus standards.
 *
 * @param options - Options for copying files to locales.
 */
export const copySourceFilesToLocales = ({
  sourceFiles,
  targetLocales,
  defaultLocale,
}: CopyDocsToLocalesOptions) => {
  targetLocales.forEach((locale) => {
    // Skip the default locale as it doesn't need to be copied
    if (locale === DEFAULT_FLAGS[defaultLocale]) {
      return;
    }

    sourceFiles.forEach((file) => {
      // Extract just the filename from the full path
      const fileName = path.basename(file.sourceFilePath);

      // Determine if the file belongs to docs or blog based on the path
      const isBlogFile = file.sourceFilePath.includes('blog');

      const isPageFile = file.sourceFilePath.includes('src/pages');

      const destinationDir = path.join(
        'i18n',
        String(locale).toLowerCase(),
        file.pluginName,
        'current'
      );
      // Set the destination directory based on whether it's a blog or docs file
      // const destinationDir = isBlogFile

      const destinationPath = path.join(destinationDir, fileName);

      // Ensure the destination directory exists
      fs.mkdirSync(destinationDir, { recursive: true });

      // Copy the file to the new location
      fs.copyFileSync(file.sourceFilePath, destinationPath);
    });
  });
};

/**
 * Function to retrieve all files in the i18n directory and its subdirectories.
 *
 * @param i18nRoot - The root directory of the i18n files.
 * @returns A promise that resolves to an array of all i18n file paths.
 */
export const getAllI18nFiles = async (i18nRoot: string): Promise<string[]> => {
  // Use fast-glob to find all files recursively in the i18n directory
  const pattern = path.join(i18nRoot, '**/*.*'); // Matches all files with any extension
  const files = await fg(pattern);

  return files;
};
