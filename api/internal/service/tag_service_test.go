package service

import (
	"errors"
	"testing"
	"time"

	"blog-api/internal/domain"
	"blog-api/internal/dto"
)

// MockTagRepositoryForTagService implements repository.TagRepository for testing
type MockTagRepositoryForTagService struct {
	tags            map[int]*domain.Tag
	tagsByName      map[string]*domain.Tag
	createFunc      func(tag *domain.Tag) (*domain.Tag, error)
	getByIDFunc     func(id int) (*domain.Tag, error)
	updateFunc      func(tag *domain.Tag) (*domain.Tag, error)
	deleteFunc      func(id int) error
	getAllFunc      func(page, limit int) ([]domain.Tag, int, error)
	existsByNameFunc func(name string) (bool, error)
}

func NewMockTagRepositoryForTagService() *MockTagRepositoryForTagService {
	return &MockTagRepositoryForTagService{
		tags:       make(map[int]*domain.Tag),
		tagsByName: make(map[string]*domain.Tag),
	}
}

func (m *MockTagRepositoryForTagService) Create(tag *domain.Tag) (*domain.Tag, error) {
	if m.createFunc != nil {
		return m.createFunc(tag)
	}
	
	tag.ID = len(m.tags) + 1
	tag.CreatedAt = time.Now()
	tag.UpdatedAt = time.Now()
	
	m.tags[tag.ID] = tag
	m.tagsByName[tag.Name] = tag
	
	return tag, nil
}

func (m *MockTagRepositoryForTagService) GetByID(id int) (*domain.Tag, error) {
	if m.getByIDFunc != nil {
		return m.getByIDFunc(id)
	}
	
	tag, exists := m.tags[id]
	if !exists {
		return nil, errors.New("tag not found")
	}
	return tag, nil
}

func (m *MockTagRepositoryForTagService) GetBySlug(slug string) (*domain.Tag, error) {
	for _, tag := range m.tags {
		if tag.Slug == slug {
			return tag, nil
		}
	}
	return nil, errors.New("tag not found")
}

func (m *MockTagRepositoryForTagService) Update(tag *domain.Tag) (*domain.Tag, error) {
	if m.updateFunc != nil {
		return m.updateFunc(tag)
	}
	
	tag.UpdatedAt = time.Now()
	m.tags[tag.ID] = tag
	m.tagsByName[tag.Name] = tag
	
	return tag, nil
}

func (m *MockTagRepositoryForTagService) Delete(id int) error {
	if m.deleteFunc != nil {
		return m.deleteFunc(id)
	}
	
	tag, exists := m.tags[id]
	if !exists {
		return errors.New("tag not found")
	}
	
	delete(m.tags, id)
	delete(m.tagsByName, tag.Name)
	
	return nil
}

func (m *MockTagRepositoryForTagService) GetAll(page, limit int) ([]domain.Tag, int, error) {
	if m.getAllFunc != nil {
		return m.getAllFunc(page, limit)
	}
	
	tags := make([]domain.Tag, 0, len(m.tags))
	for _, tag := range m.tags {
		tags = append(tags, *tag)
	}
	
	return tags, len(tags), nil
}

func (m *MockTagRepositoryForTagService) ExistsByName(name string) (bool, error) {
	if m.existsByNameFunc != nil {
		return m.existsByNameFunc(name)
	}
	
	_, exists := m.tagsByName[name]
	return exists, nil
}

func TestTagService_CreateTag(t *testing.T) {
	tests := []struct {
		name          string
		request       *dto.TagRequest
		mockSetup     func(*MockTagRepositoryForTagService)
		expectedError string
		expectSuccess bool
	}{
		{
			name: "successful tag creation",
			request: &dto.TagRequest{
				Name:        "Technology",
				Description: "Posts about technology",
				Color:       "#FF5733",
			},
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.existsByNameFunc = func(name string) (bool, error) {
					return false, nil
				}
			},
			expectSuccess: true,
		},
		{
			name: "tag already exists",
			request: &dto.TagRequest{
				Name:        "Existing Tag",
				Description: "This tag already exists",
				Color:       "#FF5733",
			},
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.existsByNameFunc = func(name string) (bool, error) {
					return true, nil
				}
			},
			expectedError: "tag with this name already exists",
		},
		{
			name: "repository error on exists check",
			request: &dto.TagRequest{
				Name:        "Technology",
				Description: "Posts about technology",
				Color:       "#FF5733",
			},
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.existsByNameFunc = func(name string) (bool, error) {
					return false, errors.New("database error")
				}
			},
			expectedError: "database error",
		},
		{
			name: "repository error on create",
			request: &dto.TagRequest{
				Name:        "Technology",
				Description: "Posts about technology",
				Color:       "#FF5733",
			},
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.existsByNameFunc = func(name string) (bool, error) {
					return false, nil
				}
				repo.createFunc = func(tag *domain.Tag) (*domain.Tag, error) {
					return nil, errors.New("create error")
				}
			},
			expectedError: "create error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := NewMockTagRepositoryForTagService()
			if tt.mockSetup != nil {
				tt.mockSetup(mockRepo)
			}

			service := NewTagService(mockRepo)
			result, err := service.CreateTag(tt.request)

			if tt.expectedError != "" {
				if err == nil {
					t.Errorf("expected error %q, got nil", tt.expectedError)
					return
				}
				if err.Error() != tt.expectedError {
					t.Errorf("expected error %q, got %q", tt.expectedError, err.Error())
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if !tt.expectSuccess {
				t.Errorf("expected failure but got success")
				return
			}

			if result == nil {
				t.Errorf("expected result, got nil")
				return
			}

			if result.Name != tt.request.Name {
				t.Errorf("expected name %s, got %s", tt.request.Name, result.Name)
			}

			if result.Description != tt.request.Description {
				t.Errorf("expected description %s, got %s", tt.request.Description, result.Description)
			}

			if result.Color != tt.request.Color {
				t.Errorf("expected color %s, got %s", tt.request.Color, result.Color)
			}

			if result.Slug == "" {
				t.Errorf("expected slug to be generated, got empty string")
			}
		})
	}
}

func TestTagService_GetTags(t *testing.T) {
	tests := []struct {
		name          string
		page          int
		limit         int
		mockSetup     func(*MockTagRepositoryForTagService)
		expectedError string
		expectSuccess bool
		expectedPage  int
		expectedLimit int
	}{
		{
			name:  "successful get tags with valid pagination",
			page:  1,
			limit: 10,
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.getAllFunc = func(page, limit int) ([]domain.Tag, int, error) {
					return []domain.Tag{}, 0, nil
				}
			},
			expectSuccess: true,
			expectedPage:  1,
			expectedLimit: 10,
		},
		{
			name:  "invalid page defaults to 1",
			page:  0,
			limit: 10,
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.getAllFunc = func(page, limit int) ([]domain.Tag, int, error) {
					return []domain.Tag{}, 0, nil
				}
			},
			expectSuccess: true,
			expectedPage:  1,
			expectedLimit: 10,
		},
		{
			name:  "invalid limit defaults to 10",
			page:  1,
			limit: 0,
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.getAllFunc = func(page, limit int) ([]domain.Tag, int, error) {
					return []domain.Tag{}, 0, nil
				}
			},
			expectSuccess: true,
			expectedPage:  1,
			expectedLimit: 10,
		},
		{
			name:  "limit too high defaults to 10",
			page:  1,
			limit: 200,
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.getAllFunc = func(page, limit int) ([]domain.Tag, int, error) {
					return []domain.Tag{}, 0, nil
				}
			},
			expectSuccess: true,
			expectedPage:  1,
			expectedLimit: 10,
		},
		{
			name:  "repository error",
			page:  1,
			limit: 10,
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.getAllFunc = func(page, limit int) ([]domain.Tag, int, error) {
					return nil, 0, errors.New("database error")
				}
			},
			expectedError: "database error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := NewMockTagRepositoryForTagService()
			if tt.mockSetup != nil {
				tt.mockSetup(mockRepo)
			}

			service := NewTagService(mockRepo)
			result, err := service.GetTags(tt.page, tt.limit)

			if tt.expectedError != "" {
				if err == nil {
					t.Errorf("expected error %q, got nil", tt.expectedError)
					return
				}
				if err.Error() != tt.expectedError {
					t.Errorf("expected error %q, got %q", tt.expectedError, err.Error())
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if result == nil {
				t.Errorf("expected result, got nil")
				return
			}

			if result.Pagination.Page != tt.expectedPage {
				t.Errorf("expected page %d, got %d", tt.expectedPage, result.Pagination.Page)
			}

			if result.Pagination.Limit != tt.expectedLimit {
				t.Errorf("expected limit %d, got %d", tt.expectedLimit, result.Pagination.Limit)
			}
		})
	}
}

func TestTagService_UpdateTag(t *testing.T) {
	existingTag := &domain.Tag{
		ID:          1,
		Name:        "Original Name",
		Slug:        "original-name",
		Description: "Original description",
		Color:       "#FF5733",
	}

	tests := []struct {
		name          string
		tagID         int
		request       *dto.TagRequest
		mockSetup     func(*MockTagRepositoryForTagService)
		expectedError string
		expectSuccess bool
	}{
		{
			name:  "successful update",
			tagID: 1,
			request: &dto.TagRequest{
				Name:        "Updated Name",
				Description: "Updated description",
				Color:       "#00FF00",
			},
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.getByIDFunc = func(id int) (*domain.Tag, error) {
					if id == 1 {
						return existingTag, nil
					}
					return nil, errors.New("tag not found")
				}
				repo.existsByNameFunc = func(name string) (bool, error) {
					return false, nil
				}
			},
			expectSuccess: true,
		},
		{
			name:  "tag not found",
			tagID: 999,
			request: &dto.TagRequest{
				Name:        "Updated Name",
				Description: "Updated description",
				Color:       "#00FF00",
			},
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.getByIDFunc = func(id int) (*domain.Tag, error) {
					return nil, errors.New("tag not found")
				}
			},
			expectedError: "tag not found",
		},
		{
			name:  "name already exists",
			tagID: 1,
			request: &dto.TagRequest{
				Name:        "Existing Name",
				Description: "Updated description",
				Color:       "#00FF00",
			},
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.getByIDFunc = func(id int) (*domain.Tag, error) {
					return existingTag, nil
				}
				repo.existsByNameFunc = func(name string) (bool, error) {
					if name == "Existing Name" {
						return true, nil
					}
					return false, nil
				}
			},
			expectedError: "tag with this name already exists",
		},
		{
			name:  "same name update (should succeed)",
			tagID: 1,
			request: &dto.TagRequest{
				Name:        "Original Name",
				Description: "Updated description",
				Color:       "#00FF00",
			},
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.getByIDFunc = func(id int) (*domain.Tag, error) {
					return existingTag, nil
				}
			},
			expectSuccess: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := NewMockTagRepositoryForTagService()
			if tt.mockSetup != nil {
				tt.mockSetup(mockRepo)
			}

			service := NewTagService(mockRepo)
			result, err := service.UpdateTag(tt.tagID, tt.request)

			if tt.expectedError != "" {
				if err == nil {
					t.Errorf("expected error %q, got nil", tt.expectedError)
					return
				}
				if err.Error() != tt.expectedError {
					t.Errorf("expected error %q, got %q", tt.expectedError, err.Error())
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if !tt.expectSuccess {
				t.Errorf("expected failure but got success")
				return
			}

			if result == nil {
				t.Errorf("expected result, got nil")
				return
			}

			if result.Name != tt.request.Name {
				t.Errorf("expected name %s, got %s", tt.request.Name, result.Name)
			}

			if result.Description != tt.request.Description {
				t.Errorf("expected description %s, got %s", tt.request.Description, result.Description)
			}

			if result.Color != tt.request.Color {
				t.Errorf("expected color %s, got %s", tt.request.Color, result.Color)
			}
		})
	}
}

func TestTagService_DeleteTag(t *testing.T) {
	existingTag := &domain.Tag{
		ID:   1,
		Name: "Test Tag",
	}

	tests := []struct {
		name          string
		tagID         int
		mockSetup     func(*MockTagRepositoryForTagService)
		expectedError string
		expectSuccess bool
	}{
		{
			name:  "successful delete",
			tagID: 1,
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.getByIDFunc = func(id int) (*domain.Tag, error) {
					if id == 1 {
						return existingTag, nil
					}
					return nil, errors.New("tag not found")
				}
				repo.deleteFunc = func(id int) error {
					return nil // Successful delete
				}
			},
			expectSuccess: true,
		},
		{
			name:  "tag not found",
			tagID: 999,
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.getByIDFunc = func(id int) (*domain.Tag, error) {
					return nil, errors.New("tag not found")
				}
			},
			expectedError: "tag not found",
		},
		{
			name:  "repository error on delete",
			tagID: 1,
			mockSetup: func(repo *MockTagRepositoryForTagService) {
				repo.getByIDFunc = func(id int) (*domain.Tag, error) {
					return existingTag, nil
				}
				repo.deleteFunc = func(id int) error {
					return errors.New("delete error")
				}
			},
			expectedError: "delete error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := NewMockTagRepositoryForTagService()
			if tt.mockSetup != nil {
				tt.mockSetup(mockRepo)
			}

			service := NewTagService(mockRepo)
			err := service.DeleteTag(tt.tagID)

			if tt.expectedError != "" {
				if err == nil {
					t.Errorf("expected error %q, got nil", tt.expectedError)
					return
				}
				if err.Error() != tt.expectedError {
					t.Errorf("expected error %q, got %q", tt.expectedError, err.Error())
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if !tt.expectSuccess {
				t.Errorf("expected failure but got success")
			}
		})
	}
}