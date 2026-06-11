/*
Copyright (C) 2023-2026 QuantumNous
*/
package controller

import (
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// GetMyMessages 获取我的消息列表
func GetMyMessages(c *gin.Context) {
	userId := c.GetInt("userId")
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	
	var isRead *bool
	if r := c.Query("is_read"); r != "" {
		read := r == "true"
		isRead = &read
	}
	
	msgType := c.Query("type")
	
	messages, total, err := model.GetUserMessages(userId, isRead, msgType, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取消息列表失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
		"items": messages,
		"total": total,
		"page":  page,
		"size":  pageSize,
	}})
}

// GetUnreadMessageCount 获取未读消息数
func GetUnreadMessageCount(c *gin.Context) {
	userId := c.GetInt("userId")
	
	count, err := model.GetUnreadCount(userId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取未读数失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"unread_count": count}})
}

// MarkMessageAsRead 标记消息为已读
func MarkMessageAsRead(c *gin.Context) {
	userId := c.GetInt("userId")
	messageId, _ := strconv.Atoi(c.Param("id"))
	
	message, err := model.GetMessageById(messageId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "消息不存在"})
		return
	}
	
	if message.UserId != userId && message.UserId != 0 {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "无权限"})
		return
	}
	
	if err := message.MarkAsRead(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "标记失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": message})
}

// MarkAllMessagesAsRead 标记所有消息为已读
func MarkAllMessagesAsRead(c *gin.Context) {
	userId := c.GetInt("userId")
	
	if err := model.MarkAllAsRead(userId); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "标记失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"message": "已全部标记为已读"}})
}

// DeleteMessage 删除消息
func DeleteMessage(c *gin.Context) {
	userId := c.GetInt("userId")
	messageId, _ := strconv.Atoi(c.Param("id"))
	
	message, err := model.GetMessageById(messageId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "消息不存在"})
		return
	}
	
	if message.UserId != userId && message.UserId != 0 {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "无权限"})
		return
	}
	
	if err := message.Delete(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "删除失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"message": "删除成功"}})
}

// AdminSendMessage 发送消息 (管理员)
func AdminSendMessage(c *gin.Context) {
	var req struct {
		UserId  int    `json:"user_id"`
		Title   string `json:"title" binding:"required"`
		Content string `json:"content" binding:"required"`
		Type    string `json:"type"`
		Link    string `json:"link"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "参数错误"})
		return
	}
	
	msgType := req.Type
	if msgType == "" {
		msgType = "notice"
	}
	
	if req.UserId == 0 {
		if err := model.Broadcast(req.Title, req.Content, msgType); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "发送失败"})
			return
		}
	} else {
		if err := model.SendToUser(req.UserId, req.Title, req.Content, msgType, req.Link); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "发送失败"})
			return
		}
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"message": "发送成功"}})
}

// AdminGetAllMessages 获取所有消息 (管理员)
func AdminGetAllMessages(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	
	userId, _ := strconv.Atoi(c.Query("user_id"))
	
	query := model.DB.Model(&model.Message{})
	
	if userId > 0 {
		query = query.Where("user_id = ? OR user_id = 0", userId)
	}
	
	var messages []model.Message
	var total int64
	query.Count(&total)
	
	if err := query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取消息列表失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
		"items": messages,
		"total": total,
		"page":  page,
		"size":  pageSize,
	}})
}

// AdminDeleteMessage 管理员删除消息
func AdminDeleteMessage(c *gin.Context) {
	messageId, _ := strconv.Atoi(c.Param("id"))
	
	message, err := model.GetMessageById(messageId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "消息不存在"})
		return
	}
	
	if err := message.Delete(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "删除失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"message": "删除成功"}})
}
