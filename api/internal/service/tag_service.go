package service

import (
	"errors"
	"math"
	"blog-api/internal/domain"
	"blog-api/internal/dto"
	"blog-api/internal/repository"
	"blog-api/utils"
)

// TagService defines the interface for tag operations
type TagService interface {
	CreateTag(req *dto.TagRequest) (*domain.Tag, error)
	GetTags(page, limit int) (*domain.TagsResponse, error)
	UpdateTag(id int, req *dto.TagRequest) (*domain.Tag, error)
	DeleteTag(id int) error
}

type tagService struct {
	tagRepo repository.TagRepository
}

// NewTagService creates a new tag service
func NewTagService(tagRepo repository.TagRepository) TagService {
	return &tagService{
		tagRepo: tagRepo,
	}
}

// CreateTag creates a new tag
func (s *tagService) CreateTag(req *dto.TagRequest) (*domain.Tag, error) {
	// Check if tag already exists
	exists, err := s.tagRepo.ExistsByName(req.Name)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("tag with this name already exists")
	}

	// Generate slug from name
	slug := utils.GenerateSlug(req.Name)

	tag := &domain.Tag{
		Name:        req.Name,
		Slug:        slug,
		Description: req.Description,
		Color:       req.Color,
	}

	return s.tagRepo.Create(tag)
}

// GetTags retrieves all tags with pagination
func (s *tagService) GetTags(page, limit int) (*domain.TagsResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	tags, total, err := s.tagRepo.GetAll(page, limit)
	if err != nil {
		return nil, err
	}

	pages := int(math.Ceil(float64(total) / float64(limit)))

	return &domain.TagsResponse{
		Tags: tags,
		Pagination: domain.Pagination{
			Page:  page,
			Limit: limit,
			Total: total,
			Pages: pages,
		},
	}, nil
}

// UpdateTag updates a tag
func (s *tagService) UpdateTag(id int, req *dto.TagRequest) (*domain.Tag, error) {
	// Get existing tag
	existingTag, err := s.tagRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Check if name is being changed and if new name already exists
	if existingTag.Name != req.Name {
		exists, err := s.tagRepo.ExistsByName(req.Name)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, errors.New("tag with this name already exists")
		}
	}

	// Generate new slug if name changed
	newSlug := existingTag.Slug
	if existingTag.Name != req.Name {
		newSlug = utils.GenerateSlug(req.Name)
	}

	// Update tag
	existingTag.Name = req.Name
	existingTag.Slug = newSlug
	existingTag.Description = req.Description
	existingTag.Color = req.Color

	return s.tagRepo.Update(existingTag)
}

// DeleteTag deletes a tag
func (s *tagService) DeleteTag(id int) error {
	// Check if tag exists
	_, err := s.tagRepo.GetByID(id)
	if err != nil {
		return err
	}

	return s.tagRepo.Delete(id)
}