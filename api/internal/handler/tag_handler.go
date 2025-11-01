package handler

import (
	"net/http"
	"strconv"
	"blog-api/internal/dto"
	"blog-api/internal/service"

	"github.com/gin-gonic/gin"
)

// TagHandler handles tag related requests
type TagHandler struct {
	tagService  service.TagService
	postService service.PostService
}

// NewTagHandler creates a new tag handler
func NewTagHandler(tagService service.TagService, postService service.PostService) *TagHandler {
	return &TagHandler{
		tagService:  tagService,
		postService: postService,
	}
}

// CreateTag godoc
// @Summary Create a new tag
// @Description Create a new tag
// @Tags tags
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.TagRequest true "Tag request"
// @Success 201 {object} domain.Tag
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/tags [post]
func (h *TagHandler) CreateTag(c *gin.Context) {
	var req dto.TagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	tag, err := h.tagService.CreateTag(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tag)
}

// GetTags godoc
// @Summary Get all tags
// @Description Get all tags with pagination
// @Tags tags
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} domain.TagsResponse
// @Failure 500 {object} map[string]string
// @Router /api/tags [get]
func (h *TagHandler) GetTags(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	response, err := h.tagService.GetTags(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// UpdateTag godoc
// @Summary Update a tag
// @Description Update an existing tag
// @Tags tags
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Tag ID"
// @Param request body dto.TagRequest true "Tag request"
// @Success 200 {object} domain.Tag
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/tags/{id} [put]
func (h *TagHandler) UpdateTag(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid tag ID"})
		return
	}

	var req dto.TagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	tag, err := h.tagService.UpdateTag(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tag)
}

// DeleteTag godoc
// @Summary Delete a tag
// @Description Delete an existing tag
// @Tags tags
// @Produce json
// @Security BearerAuth
// @Param id path int true "Tag ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/tags/{id} [delete]
func (h *TagHandler) DeleteTag(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid tag ID"})
		return
	}

	err = h.tagService.DeleteTag(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetPostsByTag godoc
// @Summary Get posts by tag
// @Description Get all posts associated with a specific tag
// @Tags tags
// @Produce json
// @Param slug path string true "Tag slug"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} domain.PostsResponse
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/tags/{slug}/posts [get]
func (h *TagHandler) GetPostsByTag(c *gin.Context) {
	slug := c.Param("slug")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	response, err := h.postService.GetPostsByTag(slug, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}