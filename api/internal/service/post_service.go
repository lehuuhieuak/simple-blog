package service

import (
	"blog-api/internal/domain"
	"blog-api/internal/dto"
	"blog-api/internal/repository"
	"blog-api/utils"
	"errors"
	"math"
)

// PostService defines the interface for post operations
type PostService interface {
	CreatePost(req *dto.PostRequest, authorID int) (*domain.Post, error)
	GetPostBySlug(slug string) (*domain.Post, error)
	UpdatePost(slug string, req *dto.PostRequest, authorID int) (*domain.Post, error)
	DeletePost(slug string, authorID int) error
	GetPosts(page, limit int) (*domain.PostsResponse, error)
	GetMyPosts(authorID, page, limit int) (*domain.PostsResponse, error)
	GetPostsByTag(tagSlug string, page, limit int) (*domain.PostsResponse, error)
}

type postService struct {
	postRepo repository.PostRepository
	tagRepo  repository.TagRepository
}

// NewPostService creates a new post service
func NewPostService(postRepo repository.PostRepository, tagRepo repository.TagRepository) PostService {
	return &postService{
		postRepo: postRepo,
		tagRepo:  tagRepo,
	}
}

// CreatePost creates a new post
func (s *postService) CreatePost(req *dto.PostRequest, authorID int) (*domain.Post, error) {
	// Generate slug from title
	slug := utils.GenerateSlug(req.Title)

	post := &domain.Post{
		Title:     req.Title,
		Slug:      slug,
		Content:   req.Content,
		AuthorID:  authorID,
		Published: req.Published,
	}

	// Create post
	createdPost, err := s.postRepo.Create(post)
	if err != nil {
		return nil, err
	}

	// Add tags if provided
	if len(req.TagIDs) > 0 {
		err = s.postRepo.AddTags(createdPost.ID, req.TagIDs)
		if err != nil {
			return nil, err
		}
	}

	// Return post with full details
	return s.postRepo.GetByID(createdPost.ID)
}

// GetPostBySlug retrieves a post by slug
func (s *postService) GetPostBySlug(slug string) (*domain.Post, error) {
	return s.postRepo.GetBySlug(slug)
}

// UpdatePost updates a post
func (s *postService) UpdatePost(slug string, req *dto.PostRequest, authorID int) (*domain.Post, error) {
	// Get existing post
	existingPost, err := s.postRepo.GetBySlug(slug)
	if err != nil {
		return nil, err
	}

	// Check if user is the author
	if existingPost.AuthorID != authorID {
		return nil, errors.New("unauthorized to update this post")
	}

	// Generate new slug if title changed
	newSlug := slug
	if existingPost.Title != req.Title {
		newSlug = utils.GenerateSlug(req.Title)
	}

	// Update post
	existingPost.Title = req.Title
	existingPost.Slug = newSlug
	existingPost.Content = req.Content
	existingPost.Published = req.Published

	updatedPost, err := s.postRepo.Update(existingPost)
	if err != nil {
		return nil, err
	}

	// Update tags
	err = s.postRepo.RemoveTags(updatedPost.ID)
	if err != nil {
		return nil, err
	}

	if len(req.TagIDs) > 0 {
		err = s.postRepo.AddTags(updatedPost.ID, req.TagIDs)
		if err != nil {
			return nil, err
		}
	}

	// Return post with full details
	return s.postRepo.GetByID(updatedPost.ID)
}

// DeletePost deletes a post
func (s *postService) DeletePost(slug string, authorID int) error {
	// Get existing post
	existingPost, err := s.postRepo.GetBySlug(slug)
	if err != nil {
		return err
	}

	// Check if user is the author
	if existingPost.AuthorID != authorID {
		return errors.New("unauthorized to delete this post")
	}

	// Remove tags first
	err = s.postRepo.RemoveTags(existingPost.ID)
	if err != nil {
		return err
	}

	// Delete post
	return s.postRepo.Delete(existingPost.ID)
}

// GetPosts retrieves all published posts with pagination
func (s *postService) GetPosts(page, limit int) (*domain.PostsResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	posts, total, err := s.postRepo.GetAll(page, limit)
	if err != nil {
		return nil, err
	}

	pages := int(math.Ceil(float64(total) / float64(limit)))

	return &domain.PostsResponse{
		Posts: posts,
		Pagination: domain.Pagination{
			Page:  page,
			Limit: limit,
			Total: total,
			Pages: pages,
		},
	}, nil
}

// GetMyPosts retrieves posts by author with pagination
func (s *postService) GetMyPosts(authorID, page, limit int) (*domain.PostsResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	posts, total, err := s.postRepo.GetByAuthorID(authorID, page, limit)
	if err != nil {
		return nil, err
	}

	pages := int(math.Ceil(float64(total) / float64(limit)))

	return &domain.PostsResponse{
		Posts: posts,
		Pagination: domain.Pagination{
			Page:  page,
			Limit: limit,
			Total: total,
			Pages: pages,
		},
	}, nil
}

// GetPostsByTag retrieves posts by tag slug with pagination
func (s *postService) GetPostsByTag(tagSlug string, page, limit int) (*domain.PostsResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	posts, total, err := s.postRepo.GetByTagSlug(tagSlug, page, limit)
	if err != nil {
		return nil, err
	}

	pages := int(math.Ceil(float64(total) / float64(limit)))

	return &domain.PostsResponse{
		Posts: posts,
		Pagination: domain.Pagination{
			Page:  page,
			Limit: limit,
			Total: total,
			Pages: pages,
		},
	}, nil
}
