import crypto from 'crypto';

export interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

export interface IyzicoPaymentRequest {
  locale?: string;
  conversationId?: string;
  price: string;
  paidPrice: string;
  currency?: string;
  installment?: string;
  basketId?: string;
  paymentChannel?: string;
  paymentGroup?: string;
  paymentCard: {
    cardHolderName: string;
    cardNumber: string;
    expireMonth: string;
    expireYear: string;
    cvc: string;
    registerCard?: string;
  };
  buyer: {
    id: string;
    name: string;
    surname: string;
    gsmNumber: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
  };
  shippingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    category2?: string;
    itemType: string;
    price: string;
  }>;
}

export interface IyzicoPaymentResponse {
  status: string;
  locale: string;
  systemTime: number;
  conversationId: string;
  price: number;
  paidPrice: number;
  installment: number;
  paymentId: string;
  fraudStatus: number;
  merchantCommissionRate: number;
  merchantCommissionRateAmount: number;
  iyziCommissionRateAmount: number;
  iyziCommissionFee: number;
  cardType: string;
  cardAssociation: string;
  cardFamily: string;
  binNumber: string;
  lastFourDigits: string;
  basketId: string;
  currency: string;
  itemTransactions: Array<{
    itemId: string;
    paymentTransactionId: string;
    transactionStatus: number;
    price: number;
    paidPrice: number;
    merchantCommissionRate: number;
    merchantCommissionRateAmount: number;
    iyziCommissionRateAmount: number;
    iyziCommissionFee: number;
    blockageRate: number;
    blockageRateAmountMerchant: number;
    blockageRateAmountSubMerchant: number;
    blockageResolvedDate: string;
    subMerchantPrice: number;
    subMerchantPayoutRate: number;
    subMerchantPayoutAmount: number;
    merchantPayoutAmount: number;
    convertedPayout: {
      paidPrice: number;
      iyziCommissionRateAmount: number;
      iyziCommissionFee: number;
      blockageRateAmountMerchant: number;
      blockageRateAmountSubMerchant: number;
      subMerchantPayoutAmount: number;
      merchantPayoutAmount: number;
      iyziConversionRate: number;
      iyziConversionRateAmount: number;
      currency: string;
    };
  }>;
  authCode: string;
  phase: string;
  hostReference: string;
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
}

export class IyzicoClient {
  private config: IyzicoConfig;

  constructor(config: IyzicoConfig) {
    this.config = config;
  }

  private generateAuthorizationString(
    randomString: string,
    requestBody: string
  ): string {
    const dataToHash = randomString + requestBody;
    const hash = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(dataToHash)
      .digest('base64');

    return `IYZWS ${this.config.apiKey}:${hash}`;
  }

  private generateRandomString(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async createPayment(
    paymentRequest: IyzicoPaymentRequest
  ): Promise<IyzicoPaymentResponse> {
    const randomString = this.generateRandomString();
    const requestBody = JSON.stringify(paymentRequest);
    const authorization = this.generateAuthorizationString(
      randomString,
      requestBody
    );

    const response = await fetch(`${this.config.baseUrl}/payment/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
        'x-iyzi-rnd': randomString,
      },
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(`İyzico API Error: ${response.statusText}`);
    }

    return response.json();
  }
}

export function createIyzicoClient(): IyzicoClient {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const baseUrl =
    process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com';

  if (!apiKey || !secretKey) {
    throw new Error('İyzico API anahtarları yapılandırılmamış');
  }

  return new IyzicoClient({
    apiKey,
    secretKey,
    baseUrl,
  });
}
