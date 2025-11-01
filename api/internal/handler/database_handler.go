package handler

import (
	"net/http"
	"blog-api/database"

	"github.com/gin-gonic/gin"
)

// DatabaseHandler handles database related requests
type DatabaseHandler struct{}

// NewDatabaseHandler creates a new database handler
func NewDatabaseHandler() *DatabaseHandler {
	return &DatabaseHandler{}
}

// InitDatabase godoc
// @Summary Initialize database
// @Description Initialize database tables and seed data
// @Tags database
// @Produce json
// @Success 200 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/init-db [post]
func (h *DatabaseHandler) InitDatabase(c *gin.Context) {
	if err := database.InitializeDatabase(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to initialize database: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Database initialized successfully"})
}