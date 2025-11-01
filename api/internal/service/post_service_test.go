package service

import (
	"errors"
	"testing"
	"time"

	"blog-api/internal/domain"
	"blog-api/internal/dto"
)

// MockPostRepository implements repository.PostRepository for testing
type MockPostRepository struct {
	posts           map[int]*domain.Post
	postsBySlug     map[string]*domain.Post
	createFunc      func(post *domain.Post) (*domain.Post, error)
	getByIDFunc     func(id int) (*domain.Post, error)
	getBySlugFunc   func(slug string) (*domain.Post, error)
	updateFunc      func(post *domain.Post) (*domain.Post, error)
	deleteFunc      func(id int) error
	getAllFunc      func(page, limit int) ([]domain.Post, int, error)
	getByAuthorFunc func(authorID, page, limit int) ([]domain.Post, int, error)
	getByTagFunc    func(tagSlug string, page, limit int) ([]domain.Post, int, error)
	addTagsFunc     func(postID int, tagIDs []int) error
	removeTagsFunc  func(postID int) error
}

func NewMockPostRepository() *MockPostRepository {
	return &MockPostRepository{
		posts:       make(map[int]*domain.Post),
		postsBySlug: make(map[string]*domain.Post),
	}
}

func (m *MockPostRepository) Create(post *domain.Post) (*domain.Post, error) {
	if m.createFunc != nil {
		return m.createFunc(post)
	}
	
	post.ID = len(m.posts) + 1
	post.CreatedAt = time.Now()
	post.UpdatedAt = time.Now()
	
	m.posts[post.ID] = post
	m.postsBySlug[post.Slug] = post
	
	return post, nil
}

func (m *MockPostRepository) GetByID(id int) (*domain.Post, error) {
	if m.getByIDFunc != nil {
		return m.getByIDFunc(id)
	}
	
	post, exists := m.posts[id]
	if !exists {
		return nil, errors.New("post not found")
	}
	return post, nil
}

func (m *MockPostRepository) GetBySlug(slug string) (*domain.Post, error) {
	if m.getBySlugFunc != nil {
		return m.getBySlugFunc(slug)
	}
	
	post, exists := m.postsBySlug[slug]
	if !exists {
		return nil, errors.New("post not found")
	}
	return post, nil
}

func (m *MockPostRepository) Update(post *domain.Post) (*domain.Post, error) {
	if m.updateFunc != nil {
		return m.updateFunc(post)
	}
	
	post.UpdatedAt = time.Now()
	m.posts[post.ID] = post
	m.postsBySlug[post.Slug] = post
	
	return post, nil
}

func (m *MockPostRepository) Delete(id int) error {
	if m.deleteFunc != nil {
		return m.deleteFunc(id)
	}
	
	post, exists := m.posts[id]
	if !exists {
		return errors.New("post not found")
	}
	
	delete(m.posts, id)
	delete(m.postsBySlug, post.Slug)
	
	return nil
}

func (m *MockPostRepository) GetAll(page, limit int) ([]domain.Post, int, error) {
	if m.getAllFunc != nil {
		return m.getAllFunc(page, limit)
	}
	
	posts := make([]domain.Post, 0, len(m.posts))
	for _, post := range m.posts {
		if post.Published {
			posts = append(posts, *post)
		}
	}
	
	return posts, len(posts), nil
}

func (m *MockPostRepository) GetByAuthorID(authorID, page, limit int) ([]domain.Post, int, error) {
	if m.getByAuthorFunc != nil {
		return m.getByAuthorFunc(authorID, page, limit)
	}
	
	posts := make([]domain.Post, 0)
	for _, post := range m.posts {
		if post.AuthorID == authorID {
			posts = append(posts, *post)
		}
	}
	
	return posts, len(posts), nil
}

func (m *MockPostRepository) GetByTagSlug(tagSlug string, page, limit int) ([]domain.Post, int, error) {
	if m.getByTagFunc != nil {
		return m.getByTagFunc(tagSlug, page, limit)
	}
	
	// For simplicity, return empty slice
	return []domain.Post{}, 0, nil
}

func (m *MockPostRepository) AddTags(postID int, tagIDs []int) error {
	if m.addTagsFunc != nil {
		return m.addTagsFunc(postID, tagIDs)
	}
	return nil
}

func (m *MockPostRepository) RemoveTags(postID int) error {
	if m.removeTagsFunc != nil {
		return m.removeTagsFunc(postID)
	}
	return nil
}

// MockTagRepository for post service tests
type MockTagRepository struct{}

func (m *MockTagRepository) Create(tag *domain.Tag) (*domain.Tag, error)                { return tag, nil }
func (m *MockTagRepository) GetByID(id int) (*domain.Tag, error)                       { return nil, nil }
func (m *MockTagRepository) GetBySlug(slug string) (*domain.Tag, error)               { return nil, nil }
func (m *MockTagRepository) Update(tag *domain.Tag) (*domain.Tag, error)              { return tag, nil }
func (m *MockTagRepository) Delete(id int) error                                      { return nil }
func (m *MockTagRepository) GetAll(page, limit int) ([]domain.Tag, int, error)        { return nil, 0, nil }
func (m *MockTagRepository) ExistsByName(name string) (bool, error)                   { return false, nil }

func TestPostService_CreatePost(t *testing.T) {
	tests := []struct {
		name          string
		request       *dto.PostRequest
		authorID      int
		mockSetup     func(*MockPostRepository, *MockTagRepository)
		expectedError string
		expectSuccess bool
	}{
		{
			name: "successful post creation",
			request: &dto.PostRequest{
				Title:     "Test Post",
				Content:   "This is test content",
				Published: true,
				TagIDs:    []int{1, 2},
			},
			authorID: 1,
			mockSetup: func(postRepo *MockPostRepository, tagRepo *MockTagRepository) {
				// Default behavior is sufficient
			},
			expectSuccess: true,
		},
		{
			name: "post creation without tags",
			request: &dto.PostRequest{
				Title:     "Test Post",
				Content:   "This is test content",
				Published: false,
				TagIDs:    []int{},
			},
			authorID: 1,
			mockSetup: func(postRepo *MockPostRepository, tagRepo *MockTagRepository) {
				// Default behavior is sufficient
			},
			expectSuccess: true,
		},
		{
			name: "repository error on create",
			request: &dto.PostRequest{
				Title:     "Test Post",
				Content:   "This is test content",
				Published: true,
			},
			authorID: 1,
			mockSetup: func(postRepo *MockPostRepository, tagRepo *MockTagRepository) {
				postRepo.createFunc = func(post *domain.Post) (*domain.Post, error) {
					return nil, errors.New("create error")
				}
			},
			expectedError: "create error",
		},
		{
			name: "error adding tags",
			request: &dto.PostRequest{
				Title:     "Test Post",
				Content:   "This is test content",
				Published: true,
				TagIDs:    []int{1, 2},
			},
			authorID: 1,
			mockSetup: func(postRepo *MockPostRepository, tagRepo *MockTagRepository) {
				postRepo.addTagsFunc = func(postID int, tagIDs []int) error {
					return errors.New("add tags error")
				}
			},
			expectedError: "add tags error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockPostRepo := NewMockPostRepository()
			mockTagRepo := &MockTagRepository{}
			
			if tt.mockSetup != nil {
				tt.mockSetup(mockPostRepo, mockTagRepo)
			}

			service := NewPostService(mockPostRepo, mockTagRepo)
			result, err := service.CreatePost(tt.request, tt.authorID)

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

			if result.Title != tt.request.Title {
				t.Errorf("expected title %s, got %s", tt.request.Title, result.Title)
			}

			if result.Content != tt.request.Content {
				t.Errorf("expected content %s, got %s", tt.request.Content, result.Content)
			}

			if result.AuthorID != tt.authorID {
				t.Errorf("expected author ID %d, got %d", tt.authorID, result.AuthorID)
			}
		})
	}
}

func TestPostService_GetPostBySlug(t *testing.T) {
	testPost := &domain.Post{
		ID:       1,
		Title:    "Test Post",
		Slug:     "test-post",
		Content:  "Test content",
		AuthorID: 1,
	}

	tests := []struct {
		name          string
		slug          string
		mockSetup     func(*MockPostRepository)
		expectedError string
		expectSuccess bool
	}{
		{
			name: "successful get post",
			slug: "test-post",
			mockSetup: func(repo *MockPostRepository) {
				repo.getBySlugFunc = func(slug string) (*domain.Post, error) {
					if slug == "test-post" {
						return testPost, nil
					}
					return nil, errors.New("post not found")
				}
			},
			expectSuccess: true,
		},
		{
			name: "post not found",
			slug: "nonexistent-post",
			mockSetup: func(repo *MockPostRepository) {
				repo.getBySlugFunc = func(slug string) (*domain.Post, error) {
					return nil, errors.New("post not found")
				}
			},
			expectedError: "post not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockPostRepo := NewMockPostRepository()
			mockTagRepo := &MockTagRepository{}
			
			if tt.mockSetup != nil {
				tt.mockSetup(mockPostRepo)
			}

			service := NewPostService(mockPostRepo, mockTagRepo)
			result, err := service.GetPostBySlug(tt.slug)

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

			if result.Slug != tt.slug {
				t.Errorf("expected slug %s, got %s", tt.slug, result.Slug)
			}
		})
	}
}

func TestPostService_UpdatePost(t *testing.T) {
	existingPost := &domain.Post{
		ID:       1,
		Title:    "Original Title",
		Slug:     "original-title",
		Content:  "Original content",
		AuthorID: 1,
	}

	tests := []struct {
		name          string
		slug          string
		request       *dto.PostRequest
		authorID      int
		mockSetup     func(*MockPostRepository)
		expectedError string
		expectSuccess bool
	}{
		{
			name: "successful update",
			slug: "original-title",
			request: &dto.PostRequest{
				Title:     "Updated Title",
				Content:   "Updated content",
				Published: true,
				TagIDs:    []int{1},
			},
			authorID: 1,
			mockSetup: func(repo *MockPostRepository) {
				repo.getBySlugFunc = func(slug string) (*domain.Post, error) {
					if slug == "original-title" {
						return existingPost, nil
					}
					return nil, errors.New("post not found")
				}
			},
			expectSuccess: true,
		},
		{
			name: "unauthorized update",
			slug: "original-title",
			request: &dto.PostRequest{
				Title:   "Updated Title",
				Content: "Updated content",
			},
			authorID: 2, // Different author
			mockSetup: func(repo *MockPostRepository) {
				repo.getBySlugFunc = func(slug string) (*domain.Post, error) {
					return existingPost, nil
				}
			},
			expectedError: "unauthorized to update this post",
		},
		{
			name: "post not found",
			slug: "nonexistent-post",
			request: &dto.PostRequest{
				Title:   "Updated Title",
				Content: "Updated content",
			},
			authorID: 1,
			mockSetup: func(repo *MockPostRepository) {
				repo.getBySlugFunc = func(slug string) (*domain.Post, error) {
					return nil, errors.New("post not found")
				}
			},
			expectedError: "post not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockPostRepo := NewMockPostRepository()
			mockTagRepo := &MockTagRepository{}
			
			if tt.mockSetup != nil {
				tt.mockSetup(mockPostRepo)
			}

			service := NewPostService(mockPostRepo, mockTagRepo)
			result, err := service.UpdatePost(tt.slug, tt.request, tt.authorID)

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
			}
		})
	}
}

func TestPostService_DeletePost(t *testing.T) {
	existingPost := &domain.Post{
		ID:       1,
		Title:    "Test Post",
		Slug:     "test-post",
		AuthorID: 1,
	}

	tests := []struct {
		name          string
		slug          string
		authorID      int
		mockSetup     func(*MockPostRepository)
		expectedError string
		expectSuccess bool
	}{
		{
			name:     "successful delete",
			slug:     "test-post",
			authorID: 1,
			mockSetup: func(repo *MockPostRepository) {
				repo.getBySlugFunc = func(slug string) (*domain.Post, error) {
					if slug == "test-post" {
						return existingPost, nil
					}
					return nil, errors.New("post not found")
				}
				repo.deleteFunc = func(id int) error {
					return nil // Successful delete
				}
			},
			expectSuccess: true,
		},
		{
			name:     "unauthorized delete",
			slug:     "test-post",
			authorID: 2,
			mockSetup: func(repo *MockPostRepository) {
				repo.getBySlugFunc = func(slug string) (*domain.Post, error) {
					return existingPost, nil
				}
			},
			expectedError: "unauthorized to delete this post",
		},
		{
			name:     "post not found",
			slug:     "nonexistent-post",
			authorID: 1,
			mockSetup: func(repo *MockPostRepository) {
				repo.getBySlugFunc = func(slug string) (*domain.Post, error) {
					return nil, errors.New("post not found")
				}
			},
			expectedError: "post not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockPostRepo := NewMockPostRepository()
			mockTagRepo := &MockTagRepository{}
			
			if tt.mockSetup != nil {
				tt.mockSetup(mockPostRepo)
			}

			service := NewPostService(mockPostRepo, mockTagRepo)
			err := service.DeletePost(tt.slug, tt.authorID)

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
		})
	}
}

func TestPostService_GetPosts(t *testing.T) {
	tests := []struct {
		name          string
		page          int
		limit         int
		mockSetup     func(*MockPostRepository)
		expectedError string
		expectSuccess bool
		expectedPage  int
		expectedLimit int
	}{
		{
			name:  "successful get posts with valid pagination",
			page:  1,
			limit: 10,
			mockSetup: func(repo *MockPostRepository) {
				repo.getAllFunc = func(page, limit int) ([]domain.Post, int, error) {
					return []domain.Post{}, 0, nil
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
			mockSetup: func(repo *MockPostRepository) {
				repo.getAllFunc = func(page, limit int) ([]domain.Post, int, error) {
					return []domain.Post{}, 0, nil
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
			mockSetup: func(repo *MockPostRepository) {
				repo.getAllFunc = func(page, limit int) ([]domain.Post, int, error) {
					return []domain.Post{}, 0, nil
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
			mockSetup: func(repo *MockPostRepository) {
				repo.getAllFunc = func(page, limit int) ([]domain.Post, int, error) {
					return []domain.Post{}, 0, nil
				}
			},
			expectSuccess: true,
			expectedPage:  1,
			expectedLimit: 10,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockPostRepo := NewMockPostRepository()
			mockTagRepo := &MockTagRepository{}
			
			if tt.mockSetup != nil {
				tt.mockSetup(mockPostRepo)
			}

			service := NewPostService(mockPostRepo, mockTagRepo)
			result, err := service.GetPosts(tt.page, tt.limit)

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