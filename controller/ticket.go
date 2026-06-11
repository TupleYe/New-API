/*
Copyright (C) 2023-2026 QuantumNous
*/
package controller

import (
	"time"
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// CreateTicket 创建工单
func CreateTicket(c *gin.Context) {
	userId := c.GetInt("userId")
	
	var req struct {
		Category    string `json:"category" binding:"required"`
		Priority    int    `json:"priority"`
		Title       string `json:"title" binding:"required,min=1,max=255"`
		Content     string `json:"content" binding:"required,min=1"`
		Attachments string `json:"attachments"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "参数错误: " + err.Error()})
		return
	}
	
	priority := req.Priority
	if priority < 1 || priority > 4 {
		priority = 1
	}
	
	ticket := &model.Ticket{
		UserId:      userId,
		Category:    req.Category,
		Priority:    priority,
		Title:       req.Title,
		Content:     req.Content,
		Attachments: req.Attachments,
		Status:      0,
	}
	
	if err := ticket.Create(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "创建工单失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": ticket})
}

// GetMyTickets 获取我的工单列表
func GetMyTickets(c *gin.Context) {
	userId := c.GetInt("userId")
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	
	var status *int
	if s := c.Query("status"); s != "" {
		st, _ := strconv.Atoi(s)
		status = &st
	}
	
	tickets, total, err := model.GetUserTickets(userId, status, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取工单列表失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
		"items": tickets,
		"total": total,
		"page":  page,
		"size":  pageSize,
	}})
}

// GetTicketDetail 获取工单详情
func GetTicketDetail(c *gin.Context) {
	userId := c.GetInt("userId")
	ticketId, _ := strconv.Atoi(c.Param("id"))
	
	ticket, err := model.GetTicketById(ticketId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "工单不存在"})
		return
	}
	
	isAdmin := common.IsAdminUser(c.GetInt("role")) || common.IsRootUser(c.GetInt("role"))
	if !isAdmin && ticket.UserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "无权限查看"})
		return
	}
	
	replies, _ := model.GetTicketReplies(ticketId)
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
		"ticket":  ticket,
		"replies": replies,
	}})
}

// ReplyTicket 回复工单
func ReplyTicket(c *gin.Context) {
	userId := c.GetInt("userId")
	ticketId, _ := strconv.Atoi(c.Param("id"))
	
	ticket, err := model.GetTicketById(ticketId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "工单不存在"})
		return
	}
	
	isAdmin := common.IsAdminUser(c.GetInt("role")) || common.IsRootUser(c.GetInt("role"))
	if !isAdmin && ticket.UserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "无权限回复"})
		return
	}
	
	var req struct {
		Content      string `json:"content" binding:"required,min=1"`
		Attachments  string `json:"attachments"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "参数错误"})
		return
	}
	
	reply := &model.TicketReply{
		TicketId:    ticketId,
		UserId:      userId,
		IsStaff:     isAdmin,
		Content:     req.Content,
		Attachments: req.Attachments,
	}
	
	if err := reply.Create(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "回复失败"})
		return
	}
	
	if isAdmin && ticket.Status == model.TicketStatusPending {
		ticket.Status = model.TicketStatusProcessing
		ticket.AssignedTo = userId
		ticket.Update()
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": reply})
}

// RateTicket 评价工单
func RateTicket(c *gin.Context) {
	userId := c.GetInt("userId")
	ticketId, _ := strconv.Atoi(c.Param("id"))
	
	ticket, err := model.GetTicketById(ticketId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "工单不存在"})
		return
	}
	
	if ticket.UserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "无权限评价"})
		return
	}
	
	if ticket.Status != model.TicketStatusCompleted && ticket.Status != model.TicketStatusClosed {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "工单未完成，无法评价"})
		return
	}
	
	var req struct {
		Rating    int    `json:"rating" binding:"required,min=1,max=5"`
		RatingNote string `json:"rating_note"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "参数错误"})
		return
	}
	
	ticket.Rating = req.Rating
	ticket.RatingNote = req.RatingNote
	
	if err := ticket.Update(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "评价失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": ticket})
}

// CloseTicket 关闭工单
func CloseTicket(c *gin.Context) {
	userId := c.GetInt("userId")
	ticketId, _ := strconv.Atoi(c.Param("id"))
	
	ticket, err := model.GetTicketById(ticketId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "工单不存在"})
		return
	}
	
	isAdmin := common.IsAdminUser(c.GetInt("role")) || common.IsRootUser(c.GetInt("role"))
	if !isAdmin && ticket.UserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "无权限关闭"})
		return
	}
	
	if ticket.Status == model.TicketStatusClosed || ticket.Status == model.TicketStatusCompleted {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "工单已关闭"})
		return
	}
	
	ticket.Status = model.TicketStatusClosed
	now := time.Now()
	ticket.ClosedAt = &now
	
	if err := ticket.Update(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "关闭失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": ticket})
}

// GetTicketCategories 获取工单分类
func GetTicketCategories(c *gin.Context) {
	var categories []model.TicketCategory
	if err := model.DB.Where("status = 1").Order("sort_order ASC").Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取分类失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": categories})
}

// AdminGetAllTickets 获取所有工单 (管理员)
func AdminGetAllTickets(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	
	category := c.Query("category")
	keyword := c.Query("keyword")
	
	var status, priority, assignedTo *int
	if s := c.Query("status"); s != "" {
		st, _ := strconv.Atoi(s)
		status = &st
	}
	if p := c.Query("priority"); p != "" {
		pr, _ := strconv.Atoi(p)
		priority = &pr
	}
	if a := c.Query("assigned_to"); a != "" {
		at, _ := strconv.Atoi(a)
		assignedTo = &at
	}
	
	tickets, total, err := model.GetAllTickets(category, status, priority, assignedTo, keyword, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取工单列表失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
		"items": tickets,
		"total": total,
		"page":  page,
		"size":  pageSize,
	}})
}

// AdminAssignTicket 分配工单 (管理员)
func AdminAssignTicket(c *gin.Context) {
	ticketId, _ := strconv.Atoi(c.Param("id"))
	
	ticket, err := model.GetTicketById(ticketId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "工单不存在"})
		return
	}
	
	var req struct {
		AssignedTo int `json:"assigned_to" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "参数错误"})
		return
	}
	
	ticket.AssignedTo = req.AssignedTo
	if ticket.Status == model.TicketStatusPending {
		ticket.Status = model.TicketStatusProcessing
	}
	
	if err := ticket.Update(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "分配失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": ticket})
}

// AdminCloseTicket 管理员关闭工单
func AdminCloseTicket(c *gin.Context) {
	ticketId, _ := strconv.Atoi(c.Param("id"))
	
	ticket, err := model.GetTicketById(ticketId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "工单不存在"})
		return
	}
	
	var req struct {
		Remark string `json:"remark"`
	}
	c.ShouldBindJSON(&req)
	
	ticket.Status = model.TicketStatusClosed
	ticket.Remark = req.Remark
	now := time.Now()
	ticket.ClosedAt = &now
	
	if err := ticket.Update(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "关闭失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": ticket})
}

// AdminCompleteTicket 管理员完成工单
func AdminCompleteTicket(c *gin.Context) {
	ticketId, _ := strconv.Atoi(c.Param("id"))
	
	ticket, err := model.GetTicketById(ticketId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "工单不存在"})
		return
	}
	
	ticket.Status = model.TicketStatusCompleted
	now := time.Now()
	ticket.ClosedAt = &now
	
	if err := ticket.Update(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "操作失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": ticket})
}
