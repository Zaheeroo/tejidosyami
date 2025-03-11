// Type definitions for Tilopay SDK
interface TilopayCard {
  number: string;
  exp_month: string;
  exp_year: string;
  cvc: string;
  name?: string;
}

interface TilopayTokenRequest {
  card: TilopayCard;
}

interface TilopayTokenResponse {
  token?: string;
  error?: {
    code: string;
    message: string;
  };
}

interface TilopayInitOptions {
  publicKey: string;
  locale?: string;
  environment?: 'test' | 'production';
}

interface TilopaySDK {
  initialize(options: TilopayInitOptions): void;
  createToken(request: TilopayTokenRequest): Promise<TilopayTokenResponse>;
}

// Extend the Window interface to include Tilopay
declare global {
  interface Window {
    Tilopay?: TilopaySDK;
  }
}

export {}; 