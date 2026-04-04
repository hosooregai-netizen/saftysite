export interface SmsProviderStatus {
  provider: string;
  enabled: boolean;
  sendEnabled: boolean;
  missingFields: string[];
  sender: string;
  serviceId: string;
  message: string;
}

export interface SmsMessage {
  id: string;
  provider: string;
  phoneNumber: string;
  content: string;
  subject: string;
  reportKey: string | null;
  siteId: string | null;
  headquarterId: string | null;
  sentByUserId: string | null;
  status: string;
  providerMessageId: string | null;
  providerResponse: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SmsSendResult {
  ok: boolean;
  message: string;
  sms: SmsMessage;
}
