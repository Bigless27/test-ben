export interface User {
  access_type: 'none' | 'subscribed';
  benzinga_uid: number;
  display_name: string;
  email: string;
  email_verified: boolean;
  first_name: string;
  human_verified: boolean;
  id: number;
  last_name: string;
  layout: unknown;
  permission: Permission[];
  phone_info: null;
  phone_number: string;
  profile_image: string;
  sms_verified: boolean;
  subscription: Subscription[];
  tradeit_token: string;
  uuid: string;
}

export interface RegisterUser {
  email: string;
  first_name: string | null;
  last_name: string | null;
  password: string;
  phone_number: string | null;
}

export interface Authentication {
  exp: number;
  key: string;
  user: User;
}

export interface Permission {
  action: string;
  effect: 'allow';
  resource: string;
}

export interface Subscription {
  amount: number;
  base_plan: string;
  cancel_at_period_end: boolean;
  coupon: string | null;
  currency: string;
  current_period_end: string;
  date_created: string;
  final_price: string;
  interval: 'year';
  interval_count: number;
  is_paying_subscription: boolean;
  line_items: {
    amount: number;
    currency: string;
    date_created: string;
    feature_name: string;
    feature_slug: string;
    localized_price: string;
    uuid: string;
  }[];
  localized_price: string;
  plan_name: string;
  product: string;
  product_name: string;
  status: string;
  trial_end: string | null;
  uuid: string;
}
