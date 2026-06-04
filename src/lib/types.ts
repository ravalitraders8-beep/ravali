export interface CategoryGift {
  id: string;
  min_value: number;
  name_english: string;
  name_telugu: string;
  description_english?: string;
  description_telugu?: string;
  image_src: string;
}

export interface Category {
  id: string;
  name_english: string;
  name_telugu: string;
  color_hex: string;
  icon: string;
  monthly_target_amount: number;
  target_unit?: "amount" | "bags";
  period_start_date?: string | null;
  period_end_date?: string | null;
  category_rewards?: CategoryGift[] | unknown;
}

export interface Contractor {
  id: string;
  name_english: string;
  name_telugu: string;
  phone: string;
  village_english: string;
  village_telugu: string;
  category_id: string;
  qr_token: string;
  is_active: boolean;
  joined_date: string;
  categories?: Category;
}

export interface Transaction {
  id: string;
  contractor_id: string;
  amount: number;
  reason_english: string;
  reason_telugu: string;
  transaction_date: string;
  added_by: string;
  month_year: string;
  created_at: string;
}

export interface RewardLevel {
  id: string;
  level_name_english: string;
  level_name_telugu: string;
  min_amount: number;
  max_amount: number | null;
  reward_description_english: string;
  reward_description_telugu: string;
  icon: string;
  color_hex: string;
}

export interface RewardDelivered {
  id: string;
  contractor_id: string;
  reward_level_id: string;
  delivered_date: string;
  delivered_by: string;
  notes: string | null;
  month_year: string;
}

export interface LeaderboardEntry {
  rank: number;
  contractor_id: string;
  name_english: string;
  name_telugu: string;
  category_english: string;
  category_telugu: string;
  category_color: string;
  village_telugu: string;
  total_amount: number;
  target_amount: number;
  achievement_percent: number;
}

export interface ContractorDashboardData {
  contractor: Contractor;
  category: Category;
  monthlyAmount: number;
  rewardLevel: RewardLevel | null;
  transactions: Transaction[];
  rewardLevels: RewardLevel[];
  leaderboard: LeaderboardEntry[];
  allCategories: Category[];
}

export interface AdminStats {
  totalActive: number;
  monthTotalAmount: number;
  topContractor: { name_telugu: string; amount: number } | null;
  targetAchievedCount: number;
}

export const TRANSACTION_REASONS = [
  { en: "New Customer", te: "కొత్త కస్టమర్" },
  { en: "Large Order", te: "పెద్ద ఆర్డర్" },
  { en: "Special Bonus", te: "స్పెషల్ బోనస్" },
  { en: "Festival Gift", te: "పండుగ గిఫ్ట్" },
  { en: "Target Bonus", te: "లక్ష్య బోనస్" },
] as const;

export type Lang = "en" | "te";

export interface ContractorSession {
  token: string;
  expiresAt: number;
}
