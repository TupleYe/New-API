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

// GetAgentInfo 获取当前用户的代理信息
func GetAgentInfo(c *gin.Context) {
	userId := c.GetInt("userId")
	
	agent, err := model.GetAgentByUserId(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": nil})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": agent})
}

// ApplyForAgent 申请成为代理
func ApplyForAgent(c *gin.Context) {
	userId := c.GetInt("userId")
	
	_, err := model.GetAgentByUserId(userId)
	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "您已经是代理"})
		return
	}
	
	agent := &model.Agent{
		UserId:     userId,
		ParentId:   0,
		AgentLevel: 1,
		Status:     1,
	}
	agent.InviteCode = generateAgentInviteCode()
	
	if err := agent.Create(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "申请失败: " + err.Error()})
		return
	}
	
	user, err := model.GetUserById(userId, true)
	if err == nil {
		user.Role = common.RoleAgentUser
		model.DB.Save(user)
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": agent})
}

// GetAgentStats 获取代理统计数据
func GetAgentStats(c *gin.Context) {
	userId := c.GetInt("userId")
	
	agent, err := model.GetAgentByUserId(userId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "您还不是代理"})
		return
	}
	
	stats, err := model.GetAgentStats(agent.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取统计数据失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": stats})
}

// GetAgentCommissions 获取代理佣金记录
func GetAgentCommissions(c *gin.Context) {
	userId := c.GetInt("userId")
	
	agent, err := model.GetAgentByUserId(userId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "您还不是代理"})
		return
	}
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	
	var status *int
	if s := c.Query("status"); s != "" {
		st := 0
		st, _ = strconv.Atoi(s)
		status = &st
	}
	
	commissions, total, err := model.GetAgentCommissions(agent.ID, status, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取佣金记录失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
		"items": commissions,
		"total": total,
		"page":  page,
		"size":  pageSize,
	}})
}

// GetAgentWithdrawals 获取代理提现记录
func GetAgentWithdrawals(c *gin.Context) {
	userId := c.GetInt("userId")
	
	agent, err := model.GetAgentByUserId(userId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "您还不是代理"})
		return
	}
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	
	var status *int
	if s := c.Query("status"); s != "" {
		st, _ := strconv.Atoi(s)
		status = &st
	}
	
	withdrawals, total, err := model.GetAgentWithdrawals(agent.ID, status, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取提现记录失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
		"items": withdrawals,
		"total": total,
		"page":  page,
		"size":  pageSize,
	}})
}

// RequestWithdrawal 申请提现
func RequestWithdrawal(c *gin.Context) {
	userId := c.GetInt("userId")
	
	agent, err := model.GetAgentByUserId(userId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "您还不是代理"})
		return
	}
	
	var req struct {
		Amount      float64 `json:"amount" binding:"required,gt=0"`
		Method      string  `json:"method" binding:"required"`
		Account     string  `json:"account" binding:"required"`
		AccountName string  `json:"account_name"`
		BankName    string  `json:"bank_name"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "参数错误"})
		return
	}
	
	availableBalance := agent.TotalCommission - agent.WithdrawnAmount
	if req.Amount > availableBalance {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "余额不足"})
		return
	}
	
	fee := req.Amount * 0.05
	actualAmount := req.Amount - fee
	
	withdrawal := &model.AgentWithdrawal{
		AgentId:      agent.ID,
		Amount:       req.Amount,
		Fee:          fee,
		ActualAmount: actualAmount,
		Method:       req.Method,
		Account:      req.Account,
		AccountName:  req.AccountName,
		BankName:     req.BankName,
		Status:       0,
	}
	
	if err := withdrawal.Create(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "申请提现失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": withdrawal})
}

// GetAgentInvitedUsers 获取邀请的用户列表
func GetAgentInvitedUsers(c *gin.Context) {
	userId := c.GetInt("userId")
	
	agent, err := model.GetAgentByUserId(userId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "您还不是代理"})
		return
	}
	
	users, err := agent.GetInvitedUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取邀请用户失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": users})
}

func generateAgentInviteCode() string {
	code := common.GetRandomString(8)
	for {
		_, err := model.GetAgentByInviteCode(code)
		if err != nil {
			break
		}
		code = common.GetRandomString(8)
	}
	return code
}

// AdminGetAllAgents 获取所有代理 (管理员)
func AdminGetAllAgents(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	level, _ := strconv.Atoi(c.Query("level"))
	status, _ := strconv.Atoi(c.Query("status"))
	
	offset := (page - 1) * pageSize
	
	query := model.DB.Model(&model.Agent{})
	
	if level > 0 {
		query = query.Where("agent_level = ?", level)
	}
	if status > 0 {
		query = query.Where("status = ?", status)
	}
	
	var agents []model.Agent
	var total int64
	query.Count(&total)
	
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&agents).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取代理列表失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
		"items": agents,
		"total": total,
		"page":  page,
		"size":  pageSize,
	}})
}

// AdminGetAgentDetails 获取代理详情 (管理员)
func AdminGetAgentDetails(c *gin.Context) {
	agentId, _ := strconv.Atoi(c.Param("id"))
	
	agent, err := model.GetAgentById(agentId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "代理不存在"})
		return
	}
	
	stats, _ := model.GetAgentStats(agentId)
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
		"agent": agent,
		"stats": stats,
	}})
}

// AdminUpdateAgent 更新代理信息 (管理员)
func AdminUpdateAgent(c *gin.Context) {
	agentId, _ := strconv.Atoi(c.Param("id"))
	
	agent, err := model.GetAgentById(agentId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "代理不存在"})
		return
	}
	
	var req struct {
		AgentLevel     int     `json:"agent_level"`
		CommissionRate float64 `json:"commission_rate"`
		Status         int     `json:"status"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "参数错误"})
		return
	}
	
	if req.AgentLevel > 0 {
		agent.AgentLevel = req.AgentLevel
	}
	if req.CommissionRate > 0 {
		agent.CommissionRate = req.CommissionRate
	}
	if req.Status > 0 {
		agent.Status = req.Status
	}
	
	if err := agent.Update(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "更新失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": agent})
}

// AdminGetAllWithdrawals 获取所有提现申请 (管理员)
func AdminGetAllWithdrawals(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	status, _ := strconv.Atoi(c.Query("status"))
	
	offset := (page - 1) * pageSize
	
	query := model.DB.Model(&model.AgentWithdrawal{})
	if status > 0 {
		query = query.Where("status = ?", status)
	}
	
	var withdrawals []model.AgentWithdrawal
	var total int64
	query.Count(&total)
	
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&withdrawals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取提现列表失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
		"items": withdrawals,
		"total": total,
		"page":  page,
		"size":  pageSize,
	}})
}

// AdminProcessWithdrawal 处理提现申请 (管理员)
func AdminProcessWithdrawal(c *gin.Context) {
	withdrawalId, _ := strconv.Atoi(c.Param("id"))
	
	var req struct {
		Status int    `json:"status" binding:"required"`
		Remark string `json:"remark"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "参数错误"})
		return
	}
	
	if req.Status != 2 && req.Status != 3 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "状态值无效"})
		return
	}
	
	var withdrawal model.AgentWithdrawal
	if err := model.DB.First(&withdrawal, withdrawalId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "提现记录不存在"})
		return
	}
	
	if req.Status == 3 && withdrawal.Status == 0 {
		var agent model.Agent
		if err := model.DB.First(&agent, withdrawal.AgentId).Error; err == nil {
			agent.PendingCommission += withdrawal.Amount
			model.DB.Save(&agent)
		}
	}
	
	if req.Status == 2 && withdrawal.Status == 0 {
		var agent model.Agent
		if err := model.DB.First(&agent, withdrawal.AgentId).Error; err == nil {
			agent.WithdrawnAmount += withdrawal.ActualAmount
			agent.PendingCommission -= withdrawal.Amount
			model.DB.Save(&agent)
		}
	}
	
	now := time.Now()
	withdrawal.Status = req.Status
	withdrawal.Remark = req.Remark
	withdrawal.ProcessedAt = &now
	
	model.DB.Save(&withdrawal)
	
	c.JSON(http.StatusOK, gin.H{"success": true, "data": withdrawal})
}
