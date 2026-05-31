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
	"encoding/json"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"

	"github.com/gin-gonic/gin"
)

// TokenPlanTier 套餐层级信息 (API 返回结构)
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
	PlanId          int      `json:"plan_id"`
}

// TokenPlanTopUp 加油包信息 (API 返回结构)
type TokenPlanTopUp struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	Price         float64 `json:"price"`
	Credits       int64   `json:"credits"`
	CreditsLabel  string  `json:"credits_label"`
	CallsEstimate string  `json:"calls_estimate"`
	Note          string  `json:"note,omitempty"`
	ButtonText    string  `json:"button_text"`
	PlanId        int     `json:"plan_id"`
}

// TokenPlanResponse 套餐页面完整数据
type TokenPlanResponse struct {
	Tiers          []TokenPlanTier  `json:"tiers"`
	TopUps         []TokenPlanTopUp `json:"top_ups"`
	RulesTitle     string           `json:"rules_title"`
	RulesSections  []RuleSection    `json:"rules_sections"`
	CurrencySymbol string           `json:"currency_symbol"`
}

// RuleSection 规则段落
type RuleSection struct {
	Title   string   `json:"title"`
	Content []string `json:"content"`
}

// i18nMap 解析 JSON 格式的多语言字段
func i18nMap(raw string) map[string]string {
	if raw == "" {
		return map[string]string{}
	}
	var m map[string]string
	if err := json.Unmarshal([]byte(raw), &m); err != nil {
		return map[string]string{}
	}
	return m
}

// i18nSlice 解析 JSON 格式的多语言数组字段
func i18nSliceMap(raw string) map[string][]string {
	if raw == "" {
		return map[string][]string{}
	}
	var m map[string][]string
	if err := json.Unmarshal([]byte(raw), &m); err != nil {
		return map[string][]string{}
	}
	return m
}

// pickI18n 从多语言 map 中选取对应语言
func pickI18n(m map[string]string, lang string) string {
	if v, ok := m[lang]; ok && v != "" {
		return v
	}
	// fallback: zh -> en, en -> zh
	if lang == "zh" {
		if v, ok := m["en"]; ok {
			return v
		}
	}
	if lang == "en" {
		if v, ok := m["zh"]; ok {
			return v
		}
	}
	// 返回第一个非空值
	for _, v := range m {
		if v != "" {
			return v
		}
	}
	return ""
}

// pickI18nSlice 从多语言 map 中选取对应语言的数组
func pickI18nSlice(m map[string][]string, lang string) []string {
	if v, ok := m[lang]; ok && len(v) > 0 {
		return v
	}
	if lang == "zh" {
		if v, ok := m["en"]; ok {
			return v
		}
	}
	if lang == "en" {
		if v, ok := m["zh"]; ok {
			return v
		}
	}
	for _, v := range m {
		if len(v) > 0 {
			return v
		}
	}
	return []string{}
}

// detectLang 从 Accept-Language 判断语言
func detectLang(c *gin.Context) string {
	lang := c.GetHeader("Accept-Language")
	langs := strings.ToLower(lang)
	if strings.HasPrefix(langs, "zh") {
		return "zh"
	}
	return "en"
}

// GetTokenPlan 获取 Token Plan 页面数据 (从 DB 读取)
func GetTokenPlan(c *gin.Context) {
	lang := detectLang(c)

	// 获取货币符号
	currencySymbol := "$"
	if operation_setting.IsCNYDisplay() {
		currencySymbol = "¥"
	} else if operation_setting.IsCurrencyDisplay() {
		currencySymbol = operation_setting.GetCurrencySymbol()
	}

	// 从数据库读取所有启用的套餐计划
	var plans []model.SubscriptionPlan
	if err := model.DB.Where("enabled = ?", true).Order("sort_order desc, id asc").Find(&plans).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "",
			"data": TokenPlanResponse{
				CurrencySymbol: currencySymbol,
				Tiers:          []TokenPlanTier{},
				TopUps:         []TokenPlanTopUp{},
			},
		})
		return
	}

	tiers := []TokenPlanTier{}
	topUps := []TokenPlanTopUp{}

	for _, p := range plans {
		// 按类型分离：tier = 订阅套餐, topup = 加油包
		if p.PlanType == "topup" {
			topUps = append(topUps, buildTopUp(p, lang))
		} else {
			tiers = append(tiers, buildTier(p, lang))
		}
	}

	// 规则说明（多语言）
	var rulesTitle string
	var rulesSections []RuleSection

	if lang == "zh" {
		rulesTitle = "权益与规则说明"
		rulesSections = []RuleSection{
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
		}
	} else {
		rulesTitle = "Terms & Rules"
		rulesSections = []RuleSection{
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
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": TokenPlanResponse{
			CurrencySymbol: currencySymbol,
			Tiers:          tiers,
			TopUps:         topUps,
			RulesTitle:     rulesTitle,
			RulesSections:  rulesSections,
		},
	})
}

// buildTier 从 SubscriptionPlan 构建 TokenPlanTier
func buildTier(p model.SubscriptionPlan, lang string) TokenPlanTier {
	titleM := i18nMap(p.TitleI18n)
	subtitleM := i18nMap(p.SubtitleI18n)
	creditsLabelM := i18nMap(p.CreditsLabelI18n)
	callsEstimateM := i18nMap(p.CallsEstimateI18n)
	featuresM := i18nSliceMap(p.FeaturesI18n)
	badgeM := i18nMap(p.BadgeI18n)
	buttonTextM := i18nMap(p.ButtonTextI18n)

	name := pickI18n(titleM, lang)
	if name == "" {
		name = p.Title
	}
	subtitle := pickI18n(subtitleM, lang)
	if subtitle == "" {
		subtitle = p.Subtitle
	}
	creditsLabel := pickI18n(creditsLabelM, lang)
	callsEstimate := pickI18n(callsEstimateM, lang)
	features := pickI18nSlice(featuresM, lang)
	badge := pickI18n(badgeM, lang)
	buttonText := pickI18n(buttonTextM, lang)

	return TokenPlanTier{
		ID:            planSlug(p),
		Name:          name,
		Subtitle:      subtitle,
		PriceMonthly:  p.PriceAmount,
		PriceOriginal: p.PriceOriginal,
		Credits:       p.TotalAmount,
		CreditsLabel:  creditsLabel,
		CallsEstimate: callsEstimate,
		Features:      features,
		Highlighted:   p.Highlighted,
		Badge:         badge,
		ButtonText:    buttonText,
		PlanId:        p.Id,
	}
}

// buildTopUp 从 SubscriptionPlan 构建 TokenPlanTopUp
func buildTopUp(p model.SubscriptionPlan, lang string) TokenPlanTopUp {
	titleM := i18nMap(p.TitleI18n)
	creditsLabelM := i18nMap(p.CreditsLabelI18n)
	callsEstimateM := i18nMap(p.CallsEstimateI18n)
	buttonTextM := i18nMap(p.ButtonTextI18n)
	noteM := i18nMap(p.TopUpNoteI18n)

	name := pickI18n(titleM, lang)
	if name == "" {
		name = p.Title
	}
	creditsLabel := pickI18n(creditsLabelM, lang)
	callsEstimate := pickI18n(callsEstimateM, lang)
	buttonText := pickI18n(buttonTextM, lang)
	note := pickI18n(noteM, lang)

	return TokenPlanTopUp{
		ID:            planSlug(p),
		Name:          name,
		Price:         p.PriceAmount,
		Credits:       p.TotalAmount,
		CreditsLabel:  creditsLabel,
		CallsEstimate: callsEstimate,
		Note:          note,
		ButtonText:    buttonText,
		PlanId:        p.Id,
	}
}

// planSlug 生成套餐 ID 字符串
func planSlug(p model.SubscriptionPlan) string {
	if p.PlanType == "topup" {
		return "topup-" + strings.ToLower(p.Title)
	}
	return strings.ToLower(p.Title)
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
