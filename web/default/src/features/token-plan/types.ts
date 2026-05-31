/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
export interface TokenPlanTier {
  id: string
  name: string
  subtitle: string
  price_monthly: number
  price_original: number
  credits: number
  credits_label: string
  calls_estimate: string
  features: string[]
  highlighted: boolean
  badge?: string
  button_text: string
  plan_id: number
}

export interface TokenPlanTopUp {
  id: string
  name: string
  price: number
  credits: number
  credits_label: string
  calls_estimate: string
  note?: string
  button_text: string
  plan_id: number
}

export interface RuleSection {
  title: string
  content: string[]
}

export interface TokenPlanResponse {
  tiers: TokenPlanTier[]
  top_ups: TokenPlanTopUp[]
  rules_title?: string
  rules_sections?: RuleSection[]
  currency_symbol: string
}
