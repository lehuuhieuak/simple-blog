package handlers

import (
	"database/sql"
	"math"
	"net/http"
	"strconv"

	"blog-api/database"
	"blog-api/models"
	"blog-api/utils"

	"github.com/gin-gonic/gin"
)

func GetPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	// Get posts
	rows, err := database.DB.Query(`
		SELECT 
			p.id, p.title, p.slug, p.excerpt, p.created_at, p.published,
			u.username as author_username
		FROM posts p
		JOIN users u ON p.author_id = u.id
		WHERE p.published = 1
		ORDER BY p.created_at DESC
		OFFSET @p1 ROWS FETCH NEXT @p2 ROWS ONLY
	`, offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var post models.Post
		err := rows.Scan(&post.ID, &post.Title, &post.Slug, &post.Excerpt, &post.CreatedAt, &post.Published, &post.AuthorUsername)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
			return
		}
		posts = append(posts, post)
	}

	// Get total count
	var total int
	err = database.DB.QueryRow("SELECT COUNT(*) FROM posts WHERE published = 1").Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}

	response := models.PostsResponse{
		Posts: posts,
		Pagination: models.Pagination{
			Page:  page,
			Limit: limit,
			Total: total,
			Pages: int(math.Ceil(float64(total) / float64(limit))),
		},
	}

	c.JSON(http.StatusOK, response)
}

func GetPostBySlug(c *gin.Context) {
	slug := c.Param("slug")

	var post models.Post
	err := database.DB.QueryRow(`
		SELECT 
			p.id, p.title, p.slug, p.content, p.excerpt, p.created_at, p.updated_at, p.published, p.author_id,
			u.username as author_username, u.email as author_email
		FROM posts p
		JOIN users u ON p.author_id = u.id
		WHERE p.slug = @p1 AND p.published = 1
	`, slug).Scan(&post.ID, &post.Title, &post.Slug, &post.Content, &post.Excerpt, &post.CreatedAt, &post.UpdatedAt, &post.Published, &post.AuthorID, &post.AuthorUsername, &post.AuthorEmail)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"message": "Post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, post)
}

func CreatePost(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
		return
	}

	userObj := user.(*models.UserResponse)

	var req models.PostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	// Generate slug and excerpt
	slug := utils.GenerateSlug(req.Title)
	excerpt := utils.GenerateExcerpt(req.Content, 150)

	// Create post
	var postID int
	err := database.DB.QueryRow("INSERT INTO posts (title, slug, content, excerpt, author_id, published) OUTPUT INSERTED.id VALUES (@p1, @p2, @p3, @p4, @p5, @p6)",
		req.Title, slug, req.Content, excerpt, userObj.ID, req.Published).Scan(&postID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}

	post := models.Post{
		ID:        postID,
		Title:     req.Title,
		Slug:      slug,
		Content:   req.Content,
		Excerpt:   excerpt,
		AuthorID:  userObj.ID,
		Published: req.Published,
	}

	c.JSON(http.StatusCreated, post)
}

func UpdatePost(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
		return
	}

	userObj := user.(*models.UserResponse)
	slug := c.Param("slug")

	var req models.PostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	// Check if post exists and user owns it
	var post models.Post
	err := database.DB.QueryRow("SELECT id, author_id FROM posts WHERE slug = @p1", slug).
		Scan(&post.ID, &post.AuthorID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"message": "Post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}

	if post.AuthorID != userObj.ID {
		c.JSON(http.StatusForbidden, gin.H{"message": "Unauthorized"})
		return
	}

	// Generate new slug and excerpt
	newSlug := utils.GenerateSlug(req.Title)
	excerpt := utils.GenerateExcerpt(req.Content, 150)

	// Update post
	_, err = database.DB.Exec("UPDATE posts SET title = @p1, slug = @p2, content = @p3, excerpt = @p4, published = @p5 WHERE id = @p6",
		req.Title, newSlug, req.Content, excerpt, req.Published, post.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}

	updatedPost := models.Post{
		ID:        post.ID,
		Title:     req.Title,
		Slug:      newSlug,
		Content:   req.Content,
		Excerpt:   excerpt,
		Published: req.Published,
	}

	c.JSON(http.StatusOK, updatedPost)
}

func DeletePost(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
		return
	}

	userObj := user.(*models.UserResponse)
	slug := c.Param("slug")

	// Check if post exists and user owns it
	var post models.Post
	err := database.DB.QueryRow("SELECT id, author_id FROM posts WHERE slug = @p1", slug).
		Scan(&post.ID, &post.AuthorID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"message": "Post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}

	if post.AuthorID != userObj.ID {
		c.JSON(http.StatusForbidden, gin.H{"message": "Unauthorized"})
		return
	}

	// Delete post
	_, err = database.DB.Exec("DELETE FROM posts WHERE id = @p1", post.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}

func GetMyPosts(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
		return
	}

	userObj := user.(*models.UserResponse)
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	// Get user's posts
	rows, err := database.DB.Query(`
		SELECT 
			p.id, p.title, p.slug, p.excerpt, p.created_at, p.updated_at, p.published,
			u.username as author_username
		FROM posts p
		JOIN users u ON p.author_id = u.id
		WHERE p.author_id = @p1
		ORDER BY p.created_at DESC
		OFFSET @p2 ROWS FETCH NEXT @p3 ROWS ONLY
	`, userObj.ID, offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var post models.Post
		err := rows.Scan(&post.ID, &post.Title, &post.Slug, &post.Excerpt, &post.CreatedAt, &post.UpdatedAt, &post.Published, &post.AuthorUsername)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
			return
		}
		posts = append(posts, post)
	}

	// Get total count
	var total int
	err = database.DB.QueryRow("SELECT COUNT(*) FROM posts WHERE author_id = @p1", userObj.ID).Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}

	response := models.PostsResponse{
		Posts: posts,
		Pagination: models.Pagination{
			Page:  page,
			Limit: limit,
			Total: total,
			Pages: int(math.Ceil(float64(total) / float64(limit))),
		},
	}

	c.JSON(http.StatusOK, response)
}