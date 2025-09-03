package handlers

import (
	"database/sql"
	"net/http"

	"blog-api/database"
	"blog-api/models"
	"blog-api/utils"

	"github.com/gin-gonic/gin"
)

func Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	// Check if user already exists
	var count int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM users WHERE email = @p1 OR username = @p2", req.Email, req.Username).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}

	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "User with this email or username already exists"})
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}

	// Create user
	var userID int
	err = database.DB.QueryRow("INSERT INTO users (email, username, password) OUTPUT INSERTED.id VALUES (@p1, @p2, @p3)",
		req.Email, req.Username, hashedPassword).Scan(&userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}

	user := models.UserResponse{
		ID:       userID,
		Email:    req.Email,
		Username: req.Username,
	}

	// Generate token
	token, err := utils.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"user":  user,
		"token": token,
	})
}

func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	// Get user by email
	var user models.User
	err := database.DB.QueryRow("SELECT id, email, username, password FROM users WHERE email = @p1", req.Email).
		Scan(&user.ID, &user.Email, &user.Username, &user.Password)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid email or password"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}

	// Verify password
	if !utils.VerifyPassword(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid email or password"})
		return
	}

	userResponse := models.UserResponse{
		ID:       user.ID,
		Email:    user.Email,
		Username: user.Username,
	}

	// Generate token
	token, err := utils.GenerateToken(userResponse)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":  userResponse,
		"token": token,
	})
}

func GetMe(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Not authenticated"})
		return
	}

	c.JSON(http.StatusOK, user)
}
