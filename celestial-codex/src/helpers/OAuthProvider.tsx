import { User } from "./User";

// Single source of truth for supported OAuth provider names. Make sure to update this as more are added
export const oauthProviders = ["floot"] as const;

// Note: the floot provider offers log in with Google via floot. However it only supports auth. If more scope
// is required, a specific GoogleProvider with a google resource will be required.

export type OAuthProviderType = (typeof oauthProviders)[number];

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  scope?: string;
}

export type StandardUserData = Pick<
  User,
  "email" | "displayName" | "avatarUrl"
> & {
  providerUserId: string;
};

export interface OAuthProviderInterface {
  name: OAuthProviderType;
  clientId: string;
  authUrl: string;
  scopes: string;
  redirectUri: string;

  /**
   * Exchange authorization code for access tokens
   */
  exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<OAuthTokens>;

  /**
   * Fetch user information from the OAuth provider using tokens
   * @returns Promise resolving to provider-specific user data
   */
  fetchUserInfo(tokens: OAuthTokens): Promise<any>;

  /**
   * Map provider-specific user data to our standard format
   */
  mapUserData(userInfo: any): StandardUserData;

  /**
   * Generate the complete authorization URL with all necessary query parameters
   * @param state - The state parameter for CSRF protection
   * @returns Object containing the authorization URL and code verifier (if PKCE is used)
   */
  generateAuthorizationUrl(state: string): {
    url: string;
    codeVerifier: string;
  };
}

/**
 * OAuth provider error types for better error handling
 */
export type OAuthErrorType =
  | "TOKEN_EXCHANGE_FAILED"
  | "USER_INFO_FETCH_FAILED"
  | "NETWORK_ERROR"
  | "PROVIDER_ERROR";

export class OAuthError extends Error {
  constructor(
    public type: OAuthErrorType,
    message: string,
    public provider?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "OAuthError";

    console.error(
      `OAuth Error [${type}] for provider ${provider}:`,
      message,
      originalError
    );
  }
}
