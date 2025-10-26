import { BlendinConfig } from '@blendin/types';
import { PluginOptions } from '@docusaurus/types';
import { z } from 'zod';
// Define the Docusaurus-specific Blendin plugin configuration interface
export interface DocusaurusBlendinConfig
  extends Omit<BlendinConfig, 'detection' | 'integrations'> {}

// TODO updates types to make project attributes required
export interface DocusaurusBlendinPluginOptions
  extends PluginOptions,
    Pick<BlendinConfig, 'project'> {}

// Define the schema for validation
export const DocusaurusBlendinConfigSchema = z.object({
  parsing: z.object({
    sourceFilePaths: z
      .array(z.string())
      .nonempty('sourceFilePaths must contain at least one path.'),
    stringFilePaths: z
      .array(z.string())
      .nonempty('stringFilePaths must contain at least one path.'),
    // translationsSavePath: z.string().optional(),
    // translationsLoadPath: z.string().optional(),
  }),
  project: z.object({
    projectId: z.string().min(1, 'projectId is required and must be a non-empty string.'),
    apiToken: z.string().min(1, 'apiToken is required and must be a non-empty string.'),
  }),
});

export const DocusaurusBlendinPluginOptionsSchema = z.object({
  docPath: z.array(z.string()).optional(),
  project: z.object({
    projectId: z.string().min(1, 'projectId is required and must be a non-empty string.'),
    apiToken: z.string().min(1, 'apiToken is required and must be a non-empty string.'),
  }),
});

// Usage example
const config: DocusaurusBlendinConfig = {
  parsing: {
    sourceFilePaths: ['./path/to/source'],
    stringFilePaths: ['./path/to/strings'],
  },
  project: {
    projectId: 'your-project-id',
    apiToken: 'your-api-token',
  },
};

// Define the options that can be passed to the plugin
// export interface DocusaurusBlendinOptions {
//   sourceMarkDownRoot: string; // The root directory for markdown files
//   projectId: string
// }
//
//
//
