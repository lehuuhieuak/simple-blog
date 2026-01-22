// @title Blog API
// @version 1.0
// @description A blog API with authentication and CRUD operations for posts and tags
// @host localhost:8080
// @BasePath /
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.
package main

import (
	"log"

	"blog-api/config"
	"blog-api/database"
	_ "blog-api/docs"
	"blog-api/internal/handler"
	"blog-api/internal/middleware"
	"blog-api/internal/repository"
	"blog-api/internal/service"
	"blog-api/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
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

	// Initialize repositories
	userRepo := repository.NewUserRepository(database.DB)
	postRepo := repository.NewPostRepository(database.DB)
	tagRepo := repository.NewTagRepository(database.DB)

	// Initialize services
	authService := service.NewAuthService(userRepo)
	userService := service.NewUserService(userRepo)
	postService := service.NewPostService(postRepo, tagRepo)
	tagService := service.NewTagService(tagRepo)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	postHandler := handler.NewPostHandler(postService)
	tagHandler := handler.NewTagHandler(tagService, postService)
	dbHandler := handler.NewDatabaseHandler()

	// Initialize Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000", "https://blog.lehuuhieu.dev"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Swagger documentation
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := r.Group("/api")
	{
		// Database initialization
		api.POST("/init-db", dbHandler.InitDatabase)

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", middleware.AuthMiddleware(), authHandler.GetMe)
		}

		// Posts routes
		posts := api.Group("/posts")
		{
			posts.GET("", postHandler.GetPosts)
			posts.GET("/:slug", postHandler.GetPostBySlug)
			posts.POST("", middleware.AuthMiddleware(), postHandler.CreatePost)
			posts.PUT("/:slug", middleware.AuthMiddleware(), postHandler.UpdatePost)
			posts.DELETE("/:slug", middleware.AuthMiddleware(), postHandler.DeletePost)
			posts.GET("/my-posts", middleware.AuthMiddleware(), postHandler.GetMyPosts)
		}

		// Tags routes
		tags := api.Group("/tags")
		{
			tags.GET("", tagHandler.GetTags)
			tags.POST("", middleware.AuthMiddleware(), tagHandler.CreateTag)
			tags.PUT("/:id", middleware.AuthMiddleware(), tagHandler.UpdateTag)
			tags.DELETE("/:id", middleware.AuthMiddleware(), tagHandler.DeleteTag)
			tags.GET("/:slug/posts", tagHandler.GetPostsByTag)
		}

		// Users routes
		users := api.Group("/users")
		{
			users.GET("", middleware.AuthMiddleware(), userHandler.GetUsers)
			users.GET("/:id", middleware.AuthMiddleware(), userHandler.GetUser)
			users.POST("", middleware.AuthMiddleware(), userHandler.CreateUser)
			users.PUT("/:id", middleware.AuthMiddleware(), userHandler.UpdateUser)
			users.DELETE("/:id", middleware.AuthMiddleware(), userHandler.DeleteUser)
		}
	}

	log.Printf("Server starting on port %s", cfg.Port)
	log.Printf("Swagger documentation available at: http://localhost:%s/swagger/index.html", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
