package handler

import (
	"blog-api/internal/domain"
	"blog-api/internal/dto"
	"blog-api/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// PostHandler handles post related requests
type PostHandler struct {
	postService service.PostService
}

// NewPostHandler creates a new post handler
func NewPostHandler(postService service.PostService) *PostHandler {
	return &PostHandler{
		postService: postService,
	}
}

// CreatePost godoc
// @Summary Create a new post
// @Description Create a new blog post
// @Tags posts
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.PostRequest true "Post request"
// @Success 201 {object} domain.Post
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/posts [post]
func (h *PostHandler) CreatePost(c *gin.Context) {
	var req dto.PostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Not authenticated"})
		return
	}

	userResponse, ok := user.(*domain.UserResponse)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Invalid user data"})
		return
	}

	post, err := h.postService.CreatePost(&req, userResponse.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, post)
}

// GetPosts godoc
// @Summary Get all posts
// @Description Get all published posts with pagination
// @Tags posts
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} domain.PostsResponse
// @Failure 500 {object} map[string]string
// @Router /api/posts [get]
func (h *PostHandler) GetPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	response, err := h.postService.GetPosts(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetPostBySlug godoc
// @Summary Get post by slug
// @Description Get a specific post by its slug
// @Tags posts
// @Produce json
// @Param slug path string true "Post slug"
// @Success 200 {object} domain.Post
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/posts/{slug} [get]
func (h *PostHandler) GetPostBySlug(c *gin.Context) {
	slug := c.Param("slug")

	post, err := h.postService.GetPostBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Post not found"})
		return
	}

	c.JSON(http.StatusOK, post)
}

// UpdatePost godoc
// @Summary Update a post
// @Description Update an existing post
// @Tags posts
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param slug path string true "Post slug"
// @Param request body dto.PostRequest true "Post request"
// @Success 200 {object} domain.Post
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/posts/{slug} [put]
func (h *PostHandler) UpdatePost(c *gin.Context) {
	slug := c.Param("slug")

	var req dto.PostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Not authenticated"})
		return
	}

	userResponse, ok := user.(*domain.UserResponse)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Invalid user data"})
		return
	}

	post, err := h.postService.UpdatePost(slug, &req, userResponse.ID)
	if err != nil {
		if err.Error() == "unauthorized to update this post" {
			c.JSON(http.StatusForbidden, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, post)
}

// DeletePost godoc
// @Summary Delete a post
// @Description Delete an existing post
// @Tags posts
// @Produce json
// @Security BearerAuth
// @Param slug path string true "Post slug"
// @Success 204 "No Content"
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/posts/{slug} [delete]
func (h *PostHandler) DeletePost(c *gin.Context) {
	slug := c.Param("slug")

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Not authenticated"})
		return
	}

	userResponse, ok := user.(*domain.UserResponse)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Invalid user data"})
		return
	}

	err := h.postService.DeletePost(slug, userResponse.ID)
	if err != nil {
		if err.Error() == "unauthorized to delete this post" {
			c.JSON(http.StatusForbidden, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetMyPosts godoc
// @Summary Get current user's posts
// @Description Get all posts created by the current user
// @Tags posts
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} domain.PostsResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/posts/my-posts [get]
func (h *PostHandler) GetMyPosts(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Not authenticated"})
		return
	}

	userResponse, ok := user.(*domain.UserResponse)

	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Invalid user data"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	response, err := h.postService.GetMyPosts(userResponse.ID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}
