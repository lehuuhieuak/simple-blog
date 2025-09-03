package main

import (
	"log"

	"blog-api/config"
	"blog-api/database"
	"blog-api/handlers"
	"blog-api/middleware"
	"blog-api/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Load configuration
	cfg := config.Load()

	// Set JWT secret
	utils.SetJWTSecret(cfg.JWTSecret)

	// Connect to database
	if err := database.Connect(cfg); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.Close()

	// Initialize Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := r.Group("/api")
	{
		// Database initialization
		api.POST("/init-db", handlers.InitDatabase)

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.GET("/me", middleware.AuthMiddleware(), handlers.GetMe)
		}

		// Posts routes
		posts := api.Group("/posts")
		{
			posts.GET("", handlers.GetPosts)
			posts.GET("/:slug", handlers.GetPostBySlug)
			posts.POST("", middleware.AuthMiddleware(), handlers.CreatePost)
			posts.PUT("/:slug", middleware.AuthMiddleware(), handlers.UpdatePost)
			posts.DELETE("/:slug", middleware.AuthMiddleware(), handlers.DeletePost)
			posts.GET("/my-posts", middleware.AuthMiddleware(), handlers.GetMyPosts)
		}
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}