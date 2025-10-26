import { BlendinLocaleCode, BlendinTextObject } from '@blendin/types';

/**
 * API URLs for Blendin CLI.
 * These fall back to production endpoints if not provided via environment variables.
 */
export const BLENDIN_CLI_API_URL =
  process.env.BLENDIN_CLI_API_URL ?? 'https://blendinapi-production-959c8e72f5be.herokuapp.com';
export const BLENDIN_CLI_UI_URL = process.env.BLENDIN_CLI_UI_URL ?? 'https://blendin.ai';

/**
 * Configuration for the API client, which optionally includes the API token for authentication.
 */
export interface APIClientConfig {
  apiToken?: string;
}

/**
 * A generic response type for fetch requests.
 * @template T - The type of data being returned in the response.
 */
export interface FetchResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

/**
 * Structure of a translation job plan, including project details, source and target locales, and parsed files.
 */
export interface TranslationJobPlan {
  project_uuid: string; // Project ID to which the translation job belongs.
  source_locale_iso: BlendinLocaleCode; // The source locale for the translation job.
  target_locale_isos: BlendinLocaleCode[]; // List of target locales for translation.
  parsed_files: ParsedFile[]; // Files to be processed for translation.
}

/**
 * Represents a file to be translated, including its path and a localization map with hashed content.
 */
export interface ParsedFile {
  sourceFilePath: string; // The file path for the source file to be translated.
  localizationMap: Record<string, BlendinTextObject>; // The map containing translation keys and text objects.
}

export interface FileMetadata {
  sourceFilePath: string;
  fileHash: string;
}

/**
 * Interface defining the methods for the API client.
 * Includes methods for GET and POST requests, both authenticated using the API token.
 */
export interface APIClient {
  authenticatedGet: (url: string, config?: RequestInit) => Promise<FetchResponse>;
  authenticatedPost: (url: string, data?: any, config?: RequestInit) => Promise<FetchResponse>;
}

/**
 * Creates an API client for sending authenticated GET and POST requests to the Blendin API.
 * The client automatically includes an API token in the request headers if available.
 * @param apiClientConfig - Configuration for the API client, optionally containing an API token for authentication.
 * @returns An API client object with `authenticatedGet` and `authenticatedPost` methods.
 */
export const createAPIClient = (apiClientConfig?: APIClientConfig): APIClient => {
  const baseURL = BLENDIN_CLI_API_URL;
  const timeout = 30000; // Timeout value in milliseconds

  /**
   * A helper function that wraps a fetch request with a timeout.
   * @param url - The request URL.
   * @param options - RequestInit object with fetch options (headers, method, body, etc.).
   * @param timeout - The maximum amount of time (in milliseconds) to wait for the request before timing out.
   * @returns A promise resolving to the Response object or rejecting if the request times out.
   */
  const fetchWithTimeout = (
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Request timed out')), timeout);
      fetch(url, options)
        .then((response) => {
          clearTimeout(timer);
          resolve(response);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  };

  /**
   * Sends an authenticated GET request to the specified URL.
   * The API token is included in the request headers if provided in the client configuration.
   * @param url - The API endpoint (relative to the base URL).
   * @param config - Optional configuration for the request (e.g., additional headers).
   * @returns A promise resolving to the response data and metadata (status, headers, etc.).
   */
  const authenticatedGet = async (url: string, config?: RequestInit): Promise<FetchResponse> => {
    const apiToken = apiClientConfig?.apiToken ?? '';

    if (apiToken) {
      const response = await fetchWithTimeout(
        `${baseURL}${url}`,
        {
          ...config,
          headers: {
            ...config?.headers,
            'Content-Type': 'application/json',
            'X-API-Token': apiToken,
          },
        },
        timeout
      );

      const data = await response.json();

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } else {
      return Promise.resolve({
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
      });
    }
  };

  /**
   * Sends an authenticated POST request to the specified URL with the provided data.
   * The API token is included in the request headers if provided in the client configuration.
   * @param url - The API endpoint (relative to the base URL).
   * @param data - The data to be sent in the request body.
   * @param config - Optional configuration for the request (e.g., additional headers).
   * @returns A promise resolving to the response data and metadata (status, headers, etc.).
   */
  const authenticatedPost = async (
    url: string,
    data?: any,
    config?: RequestInit
  ): Promise<FetchResponse> => {
    const apiToken = apiClientConfig?.apiToken ?? '';

    if (apiToken) {
      const response = await fetchWithTimeout(
        `${baseURL}${url}`,
        {
          method: 'POST',
          ...config,
          headers: {
            ...config?.headers,
            'Content-Type': 'application/json',
            'X-API-Token': apiToken,
          },
          body: JSON.stringify(data),
        },
        timeout
      );

      const responseData = await response.json();

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } else {
      return Promise.resolve({
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
      });
    }
  };

  return {
    authenticatedGet,
    authenticatedPost,
  };
};
