package model

import (
	"fmt"
	"time"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

// Ticket 工单表
type Ticket struct {
	ID          int             `json:"id" gorm:"primaryKey"`
	TicketNo    string          `json:"ticket_no" gorm:"uniqueIndex;size:32"`     // 工单编号
	UserId      int             `json:"user_id" gorm:"index;not null"`            // 提交用户ID
	Category    string          `json:"category" gorm:"size:32;index"`           // 分类: technical, billing, account, other
	Priority    int             `json:"priority" gorm:"default:1"`               // 优先级: 1=低, 2=中, 3=高, 4=紧急
	Title       string          `json:"title" gorm:"size:255;not null"`          // 标题
	Content     string          `json:"content" gorm:"type:text;not null"`       // 内容
	Attachments string          `json:"attachments" gorm:"size:1000"`             // 附件(JSON数组)
	Status      int             `json:"status" gorm:"default:0;index"`          // 状态: 0=待处理, 1=处理中, 2=已完成, 3=已关闭, 4=已拒绝
	AssignedTo  int             `json:"assigned_to" gorm:"index"`                // 分配给的用户ID (客服)
	Rating      int             `json:"rating" gorm:"default:0"`                 // 满意度评分: 0=未评价, 1-5=评分
	RatingNote  string          `json:"rating_note" gorm:"size:500"`             // 评价备注
	Remark      string          `json:"remark" gorm:"size:500"`                  // 备注/管理员回复
	ClosedAt    *time.Time      `json:"closed_at"`                              // 关闭时间
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// TicketReply 工单回复表
type TicketReply struct {
	ID        int             `json:"id" gorm:"primaryKey"`
	TicketId  int             `json:"ticket_id" gorm:"index;not null"`           // 工单ID
	UserId    int             `json:"user_id" gorm:"index;not null"`             // 回复用户ID
	IsStaff   bool            `json:"is_staff" gorm:"default:false"`            // 是否是客服回复
	Content   string          `json:"content" gorm:"type:text;not null"`         // 回复内容
	Attachments string        `json:"attachments" gorm:"size:1000"`              // 附件(JSON数组)
	CreatedAt time.Time       `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// TicketCategory 工单分类表 (可后台配置)
type TicketCategory struct {
	ID          int             `json:"id" gorm:"primaryKey"`
	Name        string          `json:"name" gorm:"size:64;not null"`           // 分类名称
	NameEn      string          `json:"name_en" gorm:"size:64"`                 // 英文名
	Description string          `json:"description" gorm:"size:255"`            // 描述
	Icon        string          `json:"icon" gorm:"size:64"`                    // 图标
	SortOrder   int             `json:"sort_order" gorm:"default:0"`           // 排序
	Status      int             `json:"status" gorm:"default:1"`                // 0=禁用, 1=启用
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

// 工单状态常量
const (
	TicketStatusPending   = 0 // 待处理
	TicketStatusProcessing = 1 // 处理中
	TicketStatusCompleted = 2 // 已完成
	TicketStatusClosed    = 3 // 已关闭
	TicketStatusRejected  = 4 // 已拒绝
)

// 工单优先级常量
const (
	TicketPriorityLow      = 1 // 低
	TicketPriorityMedium   = 2 // 中
	TicketPriorityHigh     = 3 // 高
	TicketPriorityUrgent   = 4 // 紧急
)

// 工单分类常量
const (
	TicketCategoryTechnical = "technical" // 技术问题
	TicketCategoryBilling  = "billing"    // 账单问题
	TicketCategoryAccount  = "account"    // 账户问题
	TicketCategoryOther    = "other"      // 其他
)

// GenerateTicketNo 生成工单编号
func GenerateTicketNo() string {
	return "TK" + time.Now().Format("20060102150405") + common.GetRandomString(4)
}

// CreateTicket 创建工单
func (ticket *Ticket) Create() error {
	if ticket.TicketNo == "" {
		ticket.TicketNo = GenerateTicketNo()
	}
	return DB.Create(ticket).Error
}

// GetTicketById 根据ID获取工单
func GetTicketById(id int) (*Ticket, error) {
	var ticket Ticket
	err := DB.First(&ticket, id).Error
	if err != nil {
		return nil, err
	}
	return &ticket, nil
}

// GetTicketByNo 根据工单编号获取工单
func GetTicketByNo(ticketNo string) (*Ticket, error) {
	var ticket Ticket
	err := DB.Where("ticket_no = ?", ticketNo).First(&ticket).Error
	if err != nil {
		return nil, err
	}
	return &ticket, nil
}

// UpdateTicket 更新工单
func (ticket *Ticket) Update() error {
	return DB.Save(ticket).Error
}

// GetUserTickets 获取用户的工单列表
func GetUserTickets(userId int, status *int, page, pageSize int) ([]Ticket, int64, error) {
	var tickets []Ticket
	var total int64
	
	query := DB.Model(&Ticket{}).Where("user_id = ?", userId)
	if status != nil {
		query = query.Where("status = ?", *status)
	}
	
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	
	offset := (page - 1) * pageSize
	err = query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&tickets).Error
	return tickets, total, err
}

// GetAllTickets 获取所有工单 (管理员)
func GetAllTickets(category string, status *int, priority *int, assignedTo *int, keyword string, page, pageSize int) ([]Ticket, int64, error) {
	var tickets []Ticket
	var total int64
	
	query := DB.Model(&Ticket{})
	
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if status != nil {
		query = query.Where("status = ?", *status)
	}
	if priority != nil {
		query = query.Where("priority = ?", *priority)
	}
	if assignedTo != nil {
		query = query.Where("assigned_to = ?", *assignedTo)
	}
	if keyword != "" {
		query = query.Where("title LIKE ? OR content LIKE ? OR ticket_no LIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}
	
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	
	offset := (page - 1) * pageSize
	err = query.Order("CASE status WHEN 0 THEN 0 WHEN 4 THEN 1 WHEN 1 THEN 2 WHEN 2 THEN 3 ELSE 4 END, priority DESC, created_at DESC").Offset(offset).Limit(pageSize).Find(&tickets).Error
	return tickets, total, err
}

// CreateTicketReply 创建工单回复
func (reply *TicketReply) Create() error {
	return DB.Create(reply).Error
}

// GetTicketReplies 获取工单的所有回复
func GetTicketReplies(ticketId int) ([]TicketReply, error) {
	var replies []TicketReply
	err := DB.Where("ticket_id = ?", ticketId).Order("created_at ASC").Find(&replies).Error
	return replies, err
}

// GetTicketCountByStatus 按状态统计工单数量
func GetTicketCountByStatus() (map[string]int64, error) {
	results := make([]struct {
		Status string
		Count  int64
	}, 0)
	err := DB.Model(&Ticket{}).Group("status").Select("status, COUNT(*) as count").Scan(&results).Error
	if err != nil {
		return nil, err
	}
	countMap := make(map[string]int64)
	for _, r := range results {
		countMap[fmt.Sprintf("%d", r.Status)] = r.Count
	}
	return countMap, nil
}

// GetWaitingTickets 获取待处理的工单
func GetWaitingTickets(limit int) ([]Ticket, error) {
	var tickets []Ticket
	err := DB.Where("status = ? AND assigned_to = 0", TicketStatusPending).Order("priority DESC, created_at ASC").Limit(limit).Find(&tickets).Error
	return tickets, err
}

// AutoMigrateTicketTables 自动迁移工单相关表
func AutoMigrateTicketTables() {
	DB.AutoMigrate(&Ticket{}, &TicketReply{}, &TicketCategory{})
	
	// 初始化默认分类
	categories := []TicketCategory{
		{Name: "技术问题", NameEn: "Technical Issue", Description: "API调用、技术集成问题", Icon: "tech", SortOrder: 1, Status: 1},
		{Name: "账单问题", NameEn: "Billing Issue", Description: "充值、费用、发票问题", Icon: "billing", SortOrder: 2, Status: 1},
		{Name: "账户问题", NameEn: "Account Issue", Description: "登录、权限、账户设置", Icon: "account", SortOrder: 3, Status: 1},
		{Name: "其他", NameEn: "Other", Description: "其他问题", Icon: "other", SortOrder: 4, Status: 1},
	}
	
	for _, cat := range categories {
		var existing TicketCategory
		if err := DB.Where("name = ?", cat.Name).First(&existing).Error; err != nil {
			DB.Create(&cat)
		}
	}
}
