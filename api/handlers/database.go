package handlers

import (
	"net/http"

	"blog-api/database"

	"github.com/gin-gonic/gin"
)

func InitDatabase(c *gin.Context) {
	err := database.InitializeDatabase()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to initialize database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Database initialized successfully"})
}