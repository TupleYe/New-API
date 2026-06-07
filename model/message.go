package model

import (
	"time"

	"gorm.io/gorm"
)

// Message 站内信/通知表
type Message struct {
	ID          int             `json:"id" gorm:"primaryKey"`
	UserId      int             `json:"user_id" gorm:"index;not null"`            // 接收用户ID (0=全员通知)
	Title       string          `json:"title" gorm:"size:255;not null"`           // 标题
	Content     string          `json:"content" gorm:"type:text;not null"`       // 内容
	Type        string          `json:"type" gorm:"size:32;index"`                // 消息类型: system, notice, warning, success
	Link        string          `json:"link" gorm:"size:500"`                     // 跳转链接
	IsRead      bool            `json:"is_read" gorm:"default:false;index"`     // 是否已读
	ReadAt      *time.Time      `json:"read_at"`                                 // 阅读时间
	CreatedAt   time.Time       `json:"created_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// MessageTemplate 消息模板表
type MessageTemplate struct {
	ID        int             `json:"id" gorm:"primaryKey"`
	Name      string          `json:"name" gorm:"size:64;not null;uniqueIndex"` // 模板名称
	Title     string          `json:"title" gorm:"size:255"`                    // 标题模板
	Content   string          `json:"content" gorm:"type:text"`                 // 内容模板
	Type      string          `json:"type" gorm:"size:32;default:notice"`      // 消息类型
	Status    int             `json:"status" gorm:"default:1"`                  // 0=禁用, 1=启用
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
}

// CreateMessage 创建消息
func (msg *Message) Create() error {
	return DB.Create(msg).Error
}

// GetMessageById 根据ID获取消息
func GetMessageById(id int) (*Message, error) {
	var message Message
	err := DB.First(&message, id).Error
	if err != nil {
		return nil, err
	}
	return &message, nil
}

// MarkAsRead 标记为已读
func (msg *Message) MarkAsRead() error {
	now := time.Now()
	msg.IsRead = true
	msg.ReadAt = &now
	return DB.Save(msg).Error
}

// GetUserMessages 获取用户的消息列表
func GetUserMessages(userId int, isRead *bool, msgType string, page, pageSize int) ([]Message, int64, error) {
	var messages []Message
	var total int64
	
	query := DB.Model(&Message{}).Where("user_id = ? OR user_id = 0", userId) // user_id=0 是全员通知
	
	if isRead != nil {
		query = query.Where("is_read = ?", *isRead)
	}
	if msgType != "" {
		query = query.Where("type = ?", msgType)
	}
	
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	
	offset := (page - 1) * pageSize
	err = query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&messages).Error
	return messages, total, err
}

// GetUnreadCount 获取未读消息数
func GetUnreadCount(userId int) (int64, error) {
	var count int64
	err := DB.Model(&Message{}).Where("(user_id = ? OR user_id = 0) AND is_read = ?", userId, false).Count(&count).Error
	return count, err
}

// BatchMarkAsRead 批量标记为已读
func BatchMarkAsRead(userId int, messageIds []int) error {
	if len(messageIds) == 0 {
		return nil
	}
	now := time.Now()
	return DB.Model(&Message{}).Where("id IN ? AND user_id = ?", messageIds, userId).Updates(map[string]interface{}{
		"is_read": true,
		"read_at": now,
	}).Error
}

// MarkAllAsRead 标记所有消息为已读
func MarkAllAsRead(userId int) error {
	now := time.Now()
	return DB.Model(&Message{}).Where("(user_id = ? OR user_id = 0) AND is_read = ?", userId, false).Updates(map[string]interface{}{
		"is_read": true,
		"read_at": now,
	}).Error
}

// DeleteMessage 删除消息
func (msg *Message) Delete() error {
	return DB.Delete(msg).Error
}

// SendToUser 发送消息给指定用户
func SendToUser(userId int, title, content, msgType, link string) error {
	msg := &Message{
		UserId:  userId,
		Title:   title,
		Content: content,
		Type:    msgType,
		Link:    link,
	}
	return msg.Create()
}

// Broadcast 发送全员通知
func Broadcast(title, content, msgType string) error {
	msg := &Message{
		UserId:  0, // 0 表示全员通知
		Title:   title,
		Content: content,
		Type:    msgType,
	}
	return msg.Create()
}

// AutoMigrateMessageTables 自动迁移消息相关表
func AutoMigrateMessageTables() {
	DB.AutoMigrate(&Message{}, &MessageTemplate{})
	
	// 初始化默认模板
	templates := []MessageTemplate{
		{Name: "welcome", Title: "欢迎注册", Content: "欢迎 {{username}} 加入我们的平台！", Type: "success", Status: 1},
		{Name: "recharge_success", Title: "充值成功", Content: "您的账户已成功充值 {{amount}} 元", Type: "success", Status: 1},
		{Name: "low_balance", Title: "余额不足提醒", Content: "您的账户余额不足 {{balance}} 元，请及时充值", Type: "warning", Status: 1},
		{Name: "consumption_alert", Title: "消费提醒", Content: "您今日已消费 {{amount}} 元", Type: "notice", Status: 1},
		{Name: "ticket_reply", Title: "工单回复", Content: "您提交的工单 {{ticket_no}} 已有新回复", Type: "notice", Status: 1},
	}
	
	for _, tpl := range templates {
		var existing MessageTemplate
		if err := DB.Where("name = ?", tpl.Name).First(&existing).Error; err != nil {
			DB.Create(&tpl)
		}
	}
}
