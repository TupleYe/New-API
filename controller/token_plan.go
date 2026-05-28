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
package controller

import (
	"net/http"

	"github.com/QuantumNous/new-api/setting/operation_setting"

	"github.com/gin-gonic/gin"
)

// TokenPlanTier 套餐层级信息
type TokenPlanTier struct {
	ID              string   `json:"id"`
	Name            string   `json:"name"`
	Subtitle        string   `json:"subtitle"`
	PriceMonthly    float64  `json:"price_monthly"`
	PriceOriginal   float64  `json:"price_original"`
	Credits         int64    `json:"credits"`
	CreditsLabel    string   `json:"credits_label"`
	CallsEstimate   string   `json:"calls_estimate"`
	Features        []string `json:"features"`
	Highlighted     bool     `json:"highlighted"`
	Badge           string   `json:"badge,omitempty"`
	ButtonText      string   `json:"button_text"`
}

// TokenPlanTopUp 加油包信息
type TokenPlanTopUp struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	Price         float64 `json:"price"`
	Credits       int64   `json:"credits"`
	CreditsLabel  string  `json:"credits_label"`
	CallsEstimate string  `json:"calls_estimate"`
	Note          string  `json:"note"`
	ButtonText    string  `json:"button_text"`
}

// TokenPlanResponse 套餐页面完整数据
type TokenPlanResponse struct {
	Tiers        []TokenPlanTier  `json:"tiers"`
	TopUps       []TokenPlanTopUp `json:"top_ups"`
	RulesTitle   string           `json:"rules_title"`
	RulesSections []RuleSection   `json:"rules_sections"`
	CurrencySymbol string         `json:"currency_symbol"`
}

// RuleSection 规则段落
type RuleSection struct {
	Title   string   `json:"title"`
	Content []string `json:"content"`
}

// GetTokenPlan 获取 Token Plan 页面数据
func GetTokenPlan(c *gin.Context) {
	// 获取当前语言（优先从 Accept-Language 获取）
	lang := c.GetHeader("Accept-Language")
	isCN := len(lang) >= 2 && (lang[:2] == "zh" || lang == "ZH" || lang == "zh")

	// 获取货币符号
	currencySymbol := "$"
	if operation_setting.IsCNYDisplay() {
		currencySymbol = "¥"
	} else if operation_setting.IsCurrencyDisplay() {
		currencySymbol = operation_setting.GetCurrencySymbol()
	}

	if isCN {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "",
			"data": TokenPlanResponse{
				CurrencySymbol: currencySymbol,
				Tiers: []TokenPlanTier{
					{
						ID:            "lite",
						Name:          "Lite",
						Subtitle:      "日常使用",
						PriceMonthly:  59,
						PriceOriginal: 75,
						Credits:       5000,
						CreditsLabel:  "5000 Credits / 月",
						CallsEstimate: "≈ 3,000 次 DeepSeek V4 任务调用",
						Features: []string{
							"一站接入，多模型随心切换",
							"Credits 统一消耗，计费清晰透明",
							"无缝接入主流 Agent 生态及编程助手",
							"数据安全底线：您的对话，永不用于训练",
						},
						Highlighted: false,
						ButtonText:  "按月订阅，随时可取消",
					},
					{
						ID:            "pro",
						Name:          "Pro",
						Subtitle:      "推荐效率升级",
						PriceMonthly:  149,
						PriceOriginal: 200,
						Credits:       14000,
						CreditsLabel:  "14000 Credits / 月",
						CallsEstimate: "≈ 8,400 次 DeepSeek V4 任务调用",
						Features: []string{
							"一站接入，多模型随心切换",
							"Credits 统一消耗，计费清晰透明",
							"无缝接入主流 Agent 生态及编程助手",
							"数据安全底线：您的对话，永不用于训练",
							"更高并发，优先推理队列",
						},
						Highlighted: true,
						Badge:       "推荐",
						ButtonText:  "按月订阅，随时可取消",
					},
				},
				TopUps: []TokenPlanTopUp{
					{
						ID:            "topup-10000",
						Name:          "加油包",
						Price:         99,
						Credits:       10000,
						CreditsLabel:  "10000 Credits",
						CallsEstimate: "≈ 6,000 次 DeepSeek V4 任务调用",
						Note:          "需先订阅任一套餐",
						ButtonText:    "加购",
					},
				},
				RulesTitle: "权益与规则说明",
				RulesSections: []RuleSection{
					{
						Title: "Credits 用量规则",
						Content: []string{
							"订阅后按周期发放 Credits 额度，按实际消耗的输入与输出 token 折算扣减；不同模型单价不同。",
							"周期内额度用尽，可加购加油包，或升级到更高档位。",
							"Credits 已耗尽，或调用当前套餐未覆盖的模型，相应用量从账户余额扣减。",
						},
					},
					{
						Title: "加油包说明",
						Content: []string{
							"需先订阅任一主套餐，加购后支付成功即到账。",
							"加油包 Credits 在当前周期内与主套餐合并扣减。",
							"到期时间与当前生效主套餐一致。",
						},
					},
				},
			},
		})
	} else {
		localCurrencySymbol := currencySymbol
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "",
			"data": TokenPlanResponse{
				CurrencySymbol: localCurrencySymbol,
				Tiers: []TokenPlanTier{
					{
						ID:            "lite",
						Name:          "Lite",
						Subtitle:      "Daily Use",
						PriceMonthly:  59,
						PriceOriginal: 75,
						Credits:       5000,
						CreditsLabel:  "5,000 Credits / month",
						CallsEstimate: "≈ 3,000 DeepSeek V4 tasks",
						Features: []string{
							"All models in one gateway",
							"Unified Credits billing, clear and transparent",
							"Seamless integration with Agent ecosystem & coding tools",
							"Your conversations are never used for training",
						},
						Highlighted: false,
						ButtonText:  "Subscribe monthly, cancel anytime",
					},
					{
						ID:            "pro",
						Name:          "Pro",
						Subtitle:      "Recommended Upgrade",
						PriceMonthly:  149,
						PriceOriginal: 200,
						Credits:       14000,
						CreditsLabel:  "14,000 Credits / month",
						CallsEstimate: "≈ 8,400 DeepSeek V4 tasks",
						Features: []string{
							"All models in one gateway",
							"Unified Credits billing, clear and transparent",
							"Seamless integration with Agent ecosystem & coding tools",
							"Your conversations are never used for training",
							"Higher concurrency, priority inference queue",
						},
						Highlighted: true,
						Badge:       "Popular",
						ButtonText:  "Subscribe monthly, cancel anytime",
					},
				},
				TopUps: []TokenPlanTopUp{
					{
						ID:            "topup-10000",
						Name:          "Top Up",
						Price:         99,
						Credits:       10000,
						CreditsLabel:  "10,000 Credits",
						CallsEstimate: "≈ 6,000 DeepSeek V4 tasks",
						Note:          "Requires an active subscription",
						ButtonText:    "Buy Now",
					},
				},
				RulesTitle: "Terms & Rules",
				RulesSections: []RuleSection{
					{
						Title: "Credits Usage Rules",
						Content: []string{
							"Credits are allocated per billing cycle and deducted based on actual input/output tokens consumed. Different models have different unit prices.",
							"If credits are exhausted mid-cycle, you can purchase a top-up or upgrade to a higher tier.",
							"If credits are depleted or you call a model not covered by your current plan, usage will be deducted from your account balance.",
						},
					},
					{
						Title: "Top-Up Notes",
						Content: []string{
							"A main subscription plan must be active before purchasing a top-up. Credits are credited immediately upon successful payment.",
							"Top-up credits are merged with the main plan and deducted together within the current cycle.",
							"The expiry date matches the active main subscription plan.",
						},
					},
				},
			},
		})
	}
}

// GetTokenPlanLink 获取配置的 Token Plan 链接
func GetTokenPlanLink(c *gin.Context) {
	link := operation_setting.GetGeneralSetting().TokenPlanLink
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    link,
	})
}
