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
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
	"github.com/mojocn/base64Captcha"
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

// GetCaptcha 生成并返回验证码图片
func GetCaptcha(c *gin.Context) {
	// 生成随机验证码ID
	captchaId := fmt.Sprintf("%d%d", time.Now().UnixNano(), rand.Intn(10000))

	// 创建验证码驱动
	driver := base64Captcha.NewDriverDigit(
		60,   // height
		160,  // width
		4,    // digit length
		0.7,  // max skew
		20,   // dot count
	)

	// 生成验证码
	_, content, answer := driver.GenerateIdQuestionAnswer()

	// 绘制验证码图片
	item, err := driver.DrawCaptcha(content)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Failed to generate captcha",
		})
		return
	}

	// 编码图片
	item.EncodeB64string()
	base64Img := item.EncodeB64string()

	// 存储验证码（有效期5分钟）
	common.RegisterVerificationCodeWithKey(captchaId, answer, common.CaptchaPurpose)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"captcha_id":    captchaId,
			"captcha_image": base64Img,
		},
	})
}

// VerifyCaptcha 验证用户输入的验证码
func VerifyCaptcha(captchaId, captchaCode string) bool {
	if captchaId == "" || captchaCode == "" {
		return false
	}
	return common.VerifyCodeWithKey(captchaId, captchaCode, common.CaptchaPurpose)
}
