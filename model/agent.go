package model

import (
	"time"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)
type Agent struct {
	ID            int             `json:"id" gorm:"primaryKey"`
	UserId        int             `json:"user_id" gorm:"uniqueIndex;not null"`       // 关联用户ID
	ParentId      int             `json:"parent_id" gorm:"index"`                    // 上级代理ID (0表示顶级代理)
	AgentLevel    int             `json:"agent_level" gorm:"default:1"`              // 代理等级 (1=初级, 2=中级, 3=高级, 4=金牌)
	CommissionRate float64        `json:"commission_rate" gorm:"default:0.10"`       // 佣金比例 (0.10 = 10%)
	TotalCommission float64       `json:"total_commission" gorm:"default:0"`         // 累计佣金
	PendingCommission float64      `json:"pending_commission" gorm:"default:0"`       // 待结算佣金
	WithdrawnAmount float64       `json:"withdrawn_amount" gorm:"default:0"`         // 已提现金额
	Status        int             `json:"status" gorm:"default:1"`                   // 状态: 0=禁用, 1=正常
	InviteCode    string          `json:"invite_code" gorm:"uniqueIndex;size:32"`     // 邀请码
	InviteUrl     string          `json:"invite_url" gorm:"size:255"`                 // 邀请链接
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
}

// AgentCommission 代理佣金记录
type AgentCommission struct {
	ID            int             `json:"id" gorm:"primaryKey"`
	AgentId       int             `json:"agent_id" gorm:"index;not null"`            // 代理ID
	UserId        int             `json:"user_id" gorm:"index"`                      // 被邀请用户ID
	OrderId       string          `json:"order_id" gorm:"size:64"`                   // 订单ID
	OrderAmount   float64         `json:"order_amount" gorm:"not null"`               // 订单金额
	Commission    float64         `json:"commission" gorm:"not null"`                 // 佣金金额
	CommissionType int            `json:"commission_type" gorm:"default:1"`         // 1=充值分成, 2=消费分成
	Status        int             `json:"status" gorm:"default:1"`                   // 0=待结算, 1=已结算, 2=已取消
	SettledAt     *time.Time      `json:"settled_at"`                               // 结算时间
	CreatedAt     time.Time       `json:"created_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
}

// AgentWithdrawal 代理提现记录
type AgentWithdrawal struct {
	ID            int             `json:"id" gorm:"primaryKey"`
	AgentId       int             `json:"agent_id" gorm:"index;not null"`            // 代理ID
	Amount        float64         `json:"amount" gorm:"not null"`                     // 提现金额
	Fee           float64         `json:"fee" gorm:"default:0"`                      // 手续费
	ActualAmount  float64         `json:"actual_amount" gorm:"not null"`             // 实际到账
	Method        string          `json:"method" gorm:"size:32"`                     // 提现方式: alipay, wechat, bank
	Account       string          `json:"account" gorm:"size:255"`                   // 提现账号
	AccountName   string          `json:"account_name" gorm:"size:128"`              // 账号姓名
	BankName      string          `json:"bank_name" gorm:"size:255"`                // 银行名称 (银行卡提现时)
	Status        int             `json:"status" gorm:"default:0"`                  // 0=待审核, 1=处理中, 2=已完成, 3=已拒绝
	Remark        string          `json:"remark" gorm:"size:500"`                   // 备注/拒绝原因
	ProcessedAt   *time.Time      `json:"processed_at"`                             // 处理时间
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
}

// CreateAgent 创建代理记录
func (agent *Agent) Create() error {
	return DB.Create(agent).Error
}

// GetAgentByUserId 根据用户ID获取代理信息
func GetAgentByUserId(userId int) (*Agent, error) {
	var agent Agent
	err := DB.Where("user_id = ?", userId).First(&agent).Error
	if err != nil {
		return nil, err
	}
	return &agent, nil
}

// GetAgentById 根据ID获取代理信息
func GetAgentById(id int) (*Agent, error) {
	var agent Agent
	err := DB.First(&agent, id).Error
	if err != nil {
		return nil, err
	}
	return &agent, nil
}

// GetAgentByInviteCode 根据邀请码获取代理
func GetAgentByInviteCode(code string) (*Agent, error) {
	var agent Agent
	err := DB.Where("invite_code = ?", code).First(&agent).Error
	if err != nil {
		return nil, err
	}
	return &agent, nil
}

// UpdateAgent 更新代理信息
func (agent *Agent) Update() error {
	return DB.Save(agent).Error
}

// GetSubAgents 获取下级代理列表
func (agent *Agent) GetSubAgents() ([]Agent, error) {
	var agents []Agent
	err := DB.Where("parent_id = ?", agent.ID).Find(&agents).Error
	return agents, err
}

// GetInvitedUsers 获取邀请的用户列表
func (agent *Agent) GetInvitedUsers() ([]User, error) {
	var users []User
	err := DB.Where("inviter_id = ?", agent.UserId).Find(&users).Error
	return users, err
}

// CreateCommission 创建佣金记录
func (commission *AgentCommission) Create() error {
	return DB.Create(commission).Error
}

// GetAgentCommissions 获取代理佣金记录
func GetAgentCommissions(agentId int, status *int, page, pageSize int) ([]AgentCommission, int64, error) {
	var commissions []AgentCommission
	var total int64
	
	query := DB.Model(&AgentCommission{}).Where("agent_id = ?", agentId)
	if status != nil {
		query = query.Where("status = ?", *status)
	}
	
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	
	offset := (page - 1) * pageSize
	err = query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&commissions).Error
	return commissions, total, err
}

// CreateWithdrawal 创建提现记录
func (w *AgentWithdrawal) Create() error {
	return DB.Create(w).Error
}

// GetAgentWithdrawals 获取代理提现记录
func GetAgentWithdrawals(agentId int, status *int, page, pageSize int) ([]AgentWithdrawal, int64, error) {
	var withdrawals []AgentWithdrawal
	var total int64
	
	query := DB.Model(&AgentWithdrawal{}).Where("agent_id = ?", agentId)
	if status != nil {
		query = query.Where("status = ?", *status)
	}
	
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	
	offset := (page - 1) * pageSize
	err = query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&withdrawals).Error
	return withdrawals, total, err
}

// GetAgentStats 获取代理统计数据
func GetAgentStats(agentId int) (map[string]interface{}, error) {
	var agent Agent
	err := DB.First(&agent, agentId).Error
	if err != nil {
		return nil, err
	}
	
	// 统计下级用户数
	var invitedUserCount int64
	DB.Model(&User{}).Where("inviter_id = ?", agent.UserId).Count(&invitedUserCount)
	
	// 统计今日佣金
	today := time.Now().Format("2006-01-02")
	var todayCommission float64
	DB.Model(&AgentCommission{}).Where("agent_id = ? AND DATE(created_at) = ? AND status = ?", agentId, today, 1).Select("COALESCE(SUM(commission), 0)").Scan(&todayCommission)
	
	// 统计本月佣金
	monthStart := time.Now().Format("2006-01") + "-01"
	var monthCommission float64
	DB.Model(&AgentCommission{}).Where("agent_id = ? AND created_at >= ? AND status = ?", agentId, monthStart, 1).Select("COALESCE(SUM(commission), 0)").Scan(&monthCommission)
	
	stats := map[string]interface{}{
		"total_commission":   agent.TotalCommission,
		"pending_commission": agent.PendingCommission,
		"withdrawn_amount":   agent.WithdrawnAmount,
		"invited_users":      invitedUserCount,
		"today_commission":   todayCommission,
		"month_commission":   monthCommission,
		"agent_level":        agent.AgentLevel,
		"commission_rate":    agent.CommissionRate,
	}
	
	return stats, nil
}

// AutoMigrateAgentTables 自动迁移代理相关表
func AutoMigrateAgentTables() {
	DB.AutoMigrate(&Agent{}, &AgentCommission{}, &AgentWithdrawal{})
	
	// 检查是否需要给现有代理用户创建记录
	var existingAgents []User
	DB.Where("role = ?", common.RoleAgentUser).Find(&existingAgents)
	
	for _, user := range existingAgents {
		_, err := GetAgentByUserId(user.Id)
		if err != nil {
			// 用户是代理但没有代理记录，创建
			agent := &Agent{
				UserId:     user.Id,
				ParentId:   0,
				AgentLevel: 1,
				Status:     1,
			}
			// 生成邀请码
			agent.InviteCode = generateInviteCode()
			DB.Create(agent)
		}
	}
}

// 生成邀请码
func generateInviteCode() string {
	code := common.GetRandomString(8)
	// 确保唯一
	for {
		_, err := GetAgentByInviteCode(code)
		if err != nil {
			break
		}
		code = common.GetRandomString(8)
	}
	return code
}
