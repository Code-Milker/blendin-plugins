import { LoadContext, Plugin } from '@docusaurus/types';
import {
  getAllI18nFiles,
  getAllSourceFiles,
  getSourceFileRootsAndPluginNames as getSourceFileRootsAndPluginNames,
  copySourceFilesToLocales,
} from './utils';

import {
  DocusaurusBlendinConfig,
  DocusaurusBlendinPluginOptions,
  DocusaurusBlendinPluginOptionsSchema,
} from './types';
import { execSync } from 'child_process';
import { getLocalesConfig } from './utils';
import { executeTranslation } from './executeTranslationJob';

/**
 * Function to run the translation script with the generated configurations.
 *
 * @param context - The context provided by Docusaurus, containing site configuration.
 * @param options - User-defined options for the plugin, including the root directory for Markdown files.
 */
const runTranslationScript = async (
  context: LoadContext,
  options: DocusaurusBlendinPluginOptions
) => {
  DocusaurusBlendinPluginOptionsSchema.parse(options);
  const { locales } = getLocalesConfig(context.siteConfig.i18n);
  const roots = getSourceFileRootsAndPluginNames(context.siteConfig, options);
  const sourceFiles = getAllSourceFiles(roots);

  copySourceFilesToLocales({
    sourceFiles,
    targetLocales: locales?.targetLocales!,
    defaultLocale: locales?.defaultLocale!,
  });
  const i18nFiles = await getAllI18nFiles('i18n');

  const docusaurusBlendinConfig: DocusaurusBlendinConfig = {
    project: {
      projectId: options.project?.projectId,
      apiToken: options.project?.apiToken,
    },
    locales: locales,
    parsing: {
      // sourceFilePaths: [...i18nFiles], // old flow?
      sourceFilePaths: sourceFiles.map((s) => s.sourceFilePath),
      translationsSavePath:
        'path to save. may have to run script to inject this to correct location?',
    },
  };

  executeTranslation(docusaurusBlendinConfig);
};

/**
 * Main function to configure the Blendin plugin for Docusaurus.
 *
 * @param context - The context provided by Docusaurus, containing site configuration.
 * @param options  TODO
 * @returns A Docusaurus plugin object.
 */
export default async function blendinPlugin(
  context: LoadContext,
  options: DocusaurusBlendinPluginOptions
): Promise<Plugin> {
  DocusaurusBlendinPluginOptionsSchema.parse(options); // validation config, otherwise throw to stop npm run start
  return {
    name: 'blendin-plugin',

    extendCli(cli) {
      cli
        .command('blendin-translate')
        .description('Run Blendin translation script')
        .action(async () => {
          context.siteConfig.i18n.locales.forEach((locale) => {
            // Run the Docusaurus i18n:generate command for each locale
            execSync(`npx docusaurus write-translations --locale ${locale}`, {
              stdio: 'inherit',
            });
          });
          await runTranslationScript(context, options);
        });
    },
  };
}
