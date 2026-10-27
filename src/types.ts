export interface TelegramChannel {
  id: string;
  name: string;
  category: 'mega' | 'signals' | 'alpha' | 'gems' | 'community';
  url: string;
  description: string;
  isSpecial?: boolean;
  specialBadge?: string;
  membersEstimate?: string;
  recentCall?: string;
}

export interface TelegramUserData {
  id: string;
  username: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  isTelegramNative: boolean;
}

export interface UserAccessState {
  hasPaid: boolean;
  hasEnteredCode: boolean;
  stripePaymentId?: string;
  paidAt?: string;
  telegramUser: TelegramUserData;
}
