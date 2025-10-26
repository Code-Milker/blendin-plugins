import path from 'path';
import fs from 'fs';
import readline from 'readline'; // Correct import
import { v4 as uuidv4 } from 'uuid';
import { generateStringHash } from '@blendin/sdk-js';
import { BlendinConfig, BlendinTextObject } from '@blendin/types';
import {
  BLENDIN_CLI_API_URL,
  createAPIClient,
  ParsedFile,
  FileMetadata,
  APIClient
} from './blendinImportsToAdd';

/**
 * Converts a given file path to POSIX format.
 * Ensures consistency when dealing with file paths across different operating systems.
 * @param filePath The file path to convert to POSIX format.
 * @returns The POSIX-formatted file path.
 */
const toPosixPath = (filePath: string) => {
  return filePath.split(path.sep).join(path.posix.sep);
};

/**
 * Reads a set of files, generates a hash for their contents, and returns an array of parsed file objects.
 * Each parsed file contains its path and a localization map that includes a hash for its content.
 * @param filePaths An array of absolute file paths to read and hash.
 * @returns A promise that resolves to an array of parsed files with their content hashes.
 */
const readFilesAndGenerateHashes = async (filePaths: string[]): Promise<ParsedFile[]> => {
  const parsedFiles: ParsedFile[] = [];

  for (const filePath of filePaths) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const hash = generateStringHash({ text: fileContent.trim() });

    const localizationMap: Record<string, BlendinTextObject> = {};
    localizationMap[hash] = { text: fileContent.trim() }; // Assuming a minimal text object

    parsedFiles.push({ sourceFilePath: filePath, localizationMap });
  }

  return parsedFiles;
};

const getFilesMetadata = async (filePaths: string[]): Promise<FileMetadata[]> => {
  const filesMetadata: FileMetadata[] = [];

  for (const filePath of filePaths) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const hash = generateStringHash({ text: fileContent.trim() });

    filesMetadata.push({ sourceFilePath: filePath, fileHash: hash });
  }

  return filesMetadata;
}

/**
 * Polls the translation job progress until the job is complete.
 * It prints the current translation status to the console and stops when the job is done.
 * @param apiClient The API client for making authenticated requests.
 * @param translationJobId The ID of the translation job to monitor.
 */
const pollTranslationProgress = async (
  apiClient: APIClient,
  translationJobId: string
): Promise<void> => {
  let intervalId: NodeJS.Timeout;
  let sentinel: boolean = false;

  return new Promise<void>((resolve, reject) => {
    const clearLine = () => {
      readline.cursorTo(process.stdout, 0);
      readline.clearLine(process.stdout, 0);
    };

    const getAndPrintProgress = async () => {
      if (sentinel) return;
      try {
        const translationProgress = await apiClient.authenticatedGet(
          `${BLENDIN_CLI_API_URL}/translation-jobs/${translationJobId}/translation-progress`
        );

        const { translations_total, translations_completed } = translationProgress.data;
        clearLine();
        process.stdout.write(
          `Processing Translations: ${translations_completed}/${translations_total}`
        );

        if (translations_completed === translations_total) {
          clearInterval(intervalId);
          sentinel = true;
          console.log(`\nTranslation Job Completed...`);
          resolve();
        }
      } catch (error) {
        clearLine();
        process.stdout.write(`Error: ${error}`);
        sentinel = true;
        clearInterval(intervalId);
        reject(error);
      }
    };

    // Start polling every second
    getAndPrintProgress();
    intervalId = setInterval(getAndPrintProgress, 1000);
  });
};

/**
 * Pulls the latest translations from the server and saves them to a local file.
 * @param configDir The directory where the translations will be saved.
 * @param blendinConfig The configuration object for the Blendin project.
 * @param apiClient The API client for making authenticated requests.
 */
const pullTranslations = async (
  configDir: string,
  blendinConfig: BlendinConfig,
  apiClient: APIClient
) => {
  const fileName = 'translations.json';
  const translationsSavePath = path.resolve(
    configDir,
    blendinConfig.parsing?.translationsSavePath || ''
  );

  const projectId = blendinConfig.project?.projectId!;
  const response = await apiClient.authenticatedGet(
    `${BLENDIN_CLI_API_URL}/projects/${projectId}/translations-object`
  );

  const translationsObject = response.data.translations_object;

  if (!fs.existsSync(translationsSavePath)) {
    fs.mkdirSync(translationsSavePath, { recursive: true });
  }

  const translationsFilePath = path.join(translationsSavePath, fileName);
  fs.writeFileSync(translationsFilePath, JSON.stringify(translationsObject, null, 2), 'utf8');
};

/**
 * Executes the translation job, sends the plan request, checks for new translations,
 * and creates a new translation job if needed. It polls for progress and pulls the latest translations.
 * @param blendinConfig The configuration object for the Blendin project.
 */
export const executeTranslation = async (blendinConfig: BlendinConfig) => {
  const filesMetadata: FileMetadata[] = await getFilesMetadata(
    blendinConfig.parsing?.sourceFilePaths || []
  );

  const translationJobPlanPostData = {
    project_uuid: blendinConfig.project?.projectId,
    source_locale_iso: blendinConfig.locales?.sourceLocale,
    target_locale_isos: blendinConfig.locales?.targetLocales,
    files_metadata: filesMetadata
  }

  const apiClient = createAPIClient({ apiToken: blendinConfig.project?.apiToken });

  // Step 1: Send the plan request
  const translationJobPlanResponse = await apiClient.authenticatedPost(
    `/translation-jobs/generate-plan-from-entire-files`,
    translationJobPlanPostData
  );

  console.log(`GOT TRANSLATION JOB PLAN RESPONSE`);
  console.log(translationJobPlanResponse.data);

  // const translationJobPlan = translationJobPlanResponse.data.translation_job_plan;
  // const newSourceStringsCount = translationJobPlanResponse.data.new_source_strings_count;
  // const newTranslationsCount = translationJobPlanResponse.data.new_translations_count;

  // const parsedFiles: ParsedFile[] = await readFilesAndGenerateHashes(
  //   blendinConfig.parsing?.sourceFilePaths || []
  // );

  // const translationJobPlanPostData = {
  //   project_uuid: blendinConfig.project?.projectId,
  //   source_locale_iso: blendinConfig.locales?.sourceLocale,
  //   target_locale_isos: blendinConfig.locales?.targetLocales,
  //   parsed_files: parsedFiles,
  // };
  // console.log(JSON.stringify(translationJobPlanPostData, null, 2));
  // return; // return until api is hooked in or we mock data

  // Step 2: Check if there are new translations
  // if (newTranslationsCount > 0) {
  //   console.log(translationJobPlan);
  //   console.log(`${newSourceStringsCount} strings => ${newTranslationsCount} translations`);
  // } else {
  //   console.log(`No pending translations found, project is fully up to date.`);
  //   process.exit(0);
  // }

  // Step 3: Confirm if user wants to proceed with translation
  // const rl = readline.createInterface({
  //   input: process.stdin,
  //   output: process.stdout,
  // });

  // rl.question('Do you want to continue? (y/yes to confirm): ', async (answer: string) => {
  //   if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
  //     rl.close();

  //     const postData = {
  //       project_uuid: blendinConfig.project?.projectId,
  //       source_locale_iso: blendinConfig.locales?.sourceLocale,
  //       target_locale_isos: blendinConfig.locales?.targetLocales,
  //       translation_job_uuid: uuidv4(),
  //       parsed_files: parsedFiles,
  //       name: `blendin-cli/translate-${Date.now()}`,
  //     };

  //     // Step 4: Create the translation job
  //     const createTranslationJobResponse = await apiClient.authenticatedPost(
  //       `${BLENDIN_CLI_API_URL}/translation-jobs/create-with-parsed-files`,
  //       postData
  //     );

  //     const { translation_job_id } = createTranslationJobResponse.data;

  //     // Step 5: Poll for the job's progress
  //     await pollTranslationProgress(apiClient, translation_job_id);
  //     console.log(`Synchronizing Translations...`);

  //     // Step 6: Pull the latest translations
  //     await pullTranslations(blendinConfig.parsing?.translationsSavePath!, blendinConfig, apiClient);
  //     console.log(`Translations Successfully Updated!`);
  //   } else {
  //     console.log(`Operation cancelled.`);
  //     rl.close();
  //   }
  // });
};
