import { registerPlugin } from "@capacitor/core";

export type AppleNativeSignInOptions = {
  nonce: string;
  scopes?: string[];
};

export type AppleNativeSignInResult = {
  user?: string;
  email?: string | null;
  identityToken?: string;
  authorizationCode?: string;
  fullName?: {
    givenName?: string | null;
    familyName?: string | null;
  };
};

export interface AppleNativeSignInPlugin {
  authorize(options: AppleNativeSignInOptions): Promise<AppleNativeSignInResult>;
}

export const AppleNativeSignIn = registerPlugin<AppleNativeSignInPlugin>("AppleNativeSignIn");
