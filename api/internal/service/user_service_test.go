package service

import (
	"blog-api/internal/domain"
	"blog-api/internal/dto"
	"database/sql"
	"errors"
	"testing"
)

// Mock user repository for testing
type mockUserRepository struct {
	users             map[int]*domain.User
	nextID            int
	shouldFailCreate  bool
	shouldFailUpdate  bool
	shouldFailDelete  bool
	shouldFailGetByID bool
	shouldFailGetAll  bool
	shouldFailExists  bool
}

func newMockUserRepository() *mockUserRepository {
	return &mockUserRepository{
		users:  make(map[int]*domain.User),
		nextID: 1,
	}
}

func (m *mockUserRepository) Create(user *domain.User) (*domain.User, error) {
	if m.shouldFailCreate {
		return nil, errors.New("create failed")
	}

	user.ID = m.nextID
	m.nextID++
	m.users[user.ID] = user
	return user, nil
}

func (m *mockUserRepository) GetByEmail(email string) (*domain.User, error) {
	for _, user := range m.users {
		if user.Email == email {
			return user, nil
		}
	}
	return nil, sql.ErrNoRows
}

func (m *mockUserRepository) GetByID(id int) (*domain.User, error) {
	if m.shouldFailGetByID {
		return nil, errors.New("get by id failed")
	}

	user, exists := m.users[id]
	if !exists {
		return nil, sql.ErrNoRows
	}
	return user, nil
}

func (m *mockUserRepository) ExistsByEmailOrUsername(email, username string) (bool, error) {
	if m.shouldFailExists {
		return false, errors.New("exists check failed")
	}

	for _, user := range m.users {
		if user.Email == email || user.Username == username {
			return true, nil
		}
	}
	return false, nil
}

func (m *mockUserRepository) GetAll(filter *dto.UserFilter) ([]domain.User, int, error) {
	if m.shouldFailGetAll {
		return nil, 0, errors.New("get all failed")
	}

	var users []domain.User
	for _, user := range m.users {
		users = append(users, *user)
	}
	return users, len(users), nil
}

func (m *mockUserRepository) Update(id int, user *domain.User) (*domain.User, error) {
	if m.shouldFailUpdate {
		return nil, errors.New("update failed")
	}

	existing, exists := m.users[id]
	if !exists {
		return nil, sql.ErrNoRows
	}

	if user.Email != "" {
		existing.Email = user.Email
	}
	if user.Username != "" {
		existing.Username = user.Username
	}
	if user.Password != "" {
		existing.Password = user.Password
	}

	return existing, nil
}

func (m *mockUserRepository) Delete(id int) error {
	if m.shouldFailDelete {
		return errors.New("delete failed")
	}

	_, exists := m.users[id]
	if !exists {
		return sql.ErrNoRows
	}

	delete(m.users, id)
	return nil
}

func (m *mockUserRepository) ExistsByEmailOrUsernameExcludingID(email, username string, excludeID int) (bool, error) {
	if m.shouldFailExists {
		return false, errors.New("exists check failed")
	}

	for _, user := range m.users {
		if user.ID != excludeID && (user.Email == email || user.Username == username) {
			return true, nil
		}
	}
	return false, nil
}

func TestUserService_GetAllUsers(t *testing.T) {
	mockRepo := newMockUserRepository()
	service := NewUserService(mockRepo)

	// Add test users
	mockRepo.users[1] = &domain.User{ID: 1, Email: "test1@example.com", Username: "user1"}
	mockRepo.users[2] = &domain.User{ID: 2, Email: "test2@example.com", Username: "user2"}

	filter := &dto.UserFilter{Page: 1, Limit: 10}
	result, err := service.GetAllUsers(filter)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if result.Pagination.Total != 2 {
		t.Errorf("Expected total 2, got %d", result.Pagination.Total)
	}

	if len(result.Users) != 2 {
		t.Errorf("Expected 2 users, got %d", len(result.Users))
	}
}

func TestUserService_CreateUser(t *testing.T) {
	tests := []struct {
		name          string
		request       *dto.CreateUserRequest
		existingUsers map[int]*domain.User
		expectError   bool
		errorMessage  string
	}{
		{
			name: "successful creation",
			request: &dto.CreateUserRequest{
				Email:    "new@example.com",
				Username: "newuser",
				Password: "password123",
			},
			existingUsers: make(map[int]*domain.User),
			expectError:   false,
		},
		{
			name: "email already exists",
			request: &dto.CreateUserRequest{
				Email:    "existing@example.com",
				Username: "newuser",
				Password: "password123",
			},
			existingUsers: map[int]*domain.User{
				1: {ID: 1, Email: "existing@example.com", Username: "existinguser"},
			},
			expectError:  true,
			errorMessage: "user with this email or username already exists",
		},
		{
			name: "username already exists",
			request: &dto.CreateUserRequest{
				Email:    "new@example.com",
				Username: "existinguser",
				Password: "password123",
			},
			existingUsers: map[int]*domain.User{
				1: {ID: 1, Email: "existing@example.com", Username: "existinguser"},
			},
			expectError:  true,
			errorMessage: "user with this email or username already exists",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := newMockUserRepository()
			mockRepo.users = tt.existingUsers
			service := NewUserService(mockRepo)

			result, err := service.CreateUser(tt.request)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error, got nil")
				} else if err.Error() != tt.errorMessage {
					t.Errorf("Expected error message '%s', got '%s'", tt.errorMessage, err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error, got %v", err)
				}
				if result == nil {
					t.Errorf("Expected result, got nil")
				}
				if result.Email != tt.request.Email {
					t.Errorf("Expected email %s, got %s", tt.request.Email, result.Email)
				}
				if result.Username != tt.request.Username {
					t.Errorf("Expected username %s, got %s", tt.request.Username, result.Username)
				}
			}
		})
	}
}

func TestUserService_UpdateUser(t *testing.T) {
	tests := []struct {
		name          string
		userID        int
		request       *dto.UpdateUserRequest
		existingUsers map[int]*domain.User
		expectError   bool
		errorMessage  string
	}{
		{
			name:   "successful update",
			userID: 1,
			request: &dto.UpdateUserRequest{
				Email:    "updated@example.com",
				Username: "updateduser",
			},
			existingUsers: map[int]*domain.User{
				1: {ID: 1, Email: "old@example.com", Username: "olduser"},
			},
			expectError: false,
		},
		{
			name:   "user not found",
			userID: 999,
			request: &dto.UpdateUserRequest{
				Email: "updated@example.com",
			},
			existingUsers: map[int]*domain.User{
				1: {ID: 1, Email: "old@example.com", Username: "olduser"},
			},
			expectError:  true,
			errorMessage: "user not found",
		},
		{
			name:   "email conflict with another user",
			userID: 1,
			request: &dto.UpdateUserRequest{
				Email: "conflict@example.com",
			},
			existingUsers: map[int]*domain.User{
				1: {ID: 1, Email: "user1@example.com", Username: "user1"},
				2: {ID: 2, Email: "conflict@example.com", Username: "user2"},
			},
			expectError:  true,
			errorMessage: "user with this email or username already exists",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := newMockUserRepository()
			mockRepo.users = tt.existingUsers
			service := NewUserService(mockRepo)

			result, err := service.UpdateUser(tt.userID, tt.request)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error, got nil")
				} else if err.Error() != tt.errorMessage {
					t.Errorf("Expected error message '%s', got '%s'", tt.errorMessage, err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error, got %v", err)
				}
				if result == nil {
					t.Errorf("Expected result, got nil")
				}
			}
		})
	}
}

func TestUserService_DeleteUser(t *testing.T) {
	tests := []struct {
		name          string
		userID        int
		existingUsers map[int]*domain.User
		expectError   bool
		errorMessage  string
	}{
		{
			name:   "successful deletion",
			userID: 1,
			existingUsers: map[int]*domain.User{
				1: {ID: 1, Email: "test@example.com", Username: "testuser"},
			},
			expectError: false,
		},
		{
			name:          "user not found",
			userID:        999,
			existingUsers: make(map[int]*domain.User),
			expectError:   true,
			errorMessage:  "user not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := newMockUserRepository()
			mockRepo.users = tt.existingUsers
			service := NewUserService(mockRepo)

			err := service.DeleteUser(tt.userID)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error, got nil")
				} else if err.Error() != tt.errorMessage {
					t.Errorf("Expected error message '%s', got '%s'", tt.errorMessage, err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error, got %v", err)
				}
				// Verify user was deleted
				_, exists := mockRepo.users[tt.userID]
				if exists {
					t.Errorf("Expected user to be deleted, but it still exists")
				}
			}
		})
	}
}
