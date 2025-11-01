package service

import (
	"database/sql"
	"errors"
	"testing"
	"time"

	"blog-api/internal/domain"
	"blog-api/internal/dto"
)

// MockUserRepository implements repository.UserRepository for testing
type MockUserRepository struct {
	users                    map[int]*domain.User
	usersByEmail            map[string]*domain.User
	existsByEmailOrUsername func(email, username string) (bool, error)
	createFunc              func(user *domain.User) (*domain.User, error)
	getByEmailFunc          func(email string) (*domain.User, error)
	getByIDFunc             func(id int) (*domain.User, error)
}

func NewMockUserRepository() *MockUserRepository {
	return &MockUserRepository{
		users:        make(map[int]*domain.User),
		usersByEmail: make(map[string]*domain.User),
	}
}

func (m *MockUserRepository) ExistsByEmailOrUsername(email, username string) (bool, error) {
	if m.existsByEmailOrUsername != nil {
		return m.existsByEmailOrUsername(email, username)
	}
	
	for _, user := range m.users {
		if user.Email == email || user.Username == username {
			return true, nil
		}
	}
	return false, nil
}

func (m *MockUserRepository) Create(user *domain.User) (*domain.User, error) {
	if m.createFunc != nil {
		return m.createFunc(user)
	}
	
	user.ID = len(m.users) + 1
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	
	m.users[user.ID] = user
	m.usersByEmail[user.Email] = user
	
	return user, nil
}

func (m *MockUserRepository) GetByEmail(email string) (*domain.User, error) {
	if m.getByEmailFunc != nil {
		return m.getByEmailFunc(email)
	}
	
	user, exists := m.usersByEmail[email]
	if !exists {
		return nil, sql.ErrNoRows
	}
	return user, nil
}

func (m *MockUserRepository) GetByID(id int) (*domain.User, error) {
	if m.getByIDFunc != nil {
		return m.getByIDFunc(id)
	}
	
	user, exists := m.users[id]
	if !exists {
		return nil, sql.ErrNoRows
	}
	return user, nil
}

func TestAuthService_Register(t *testing.T) {
	tests := []struct {
		name           string
		request        *dto.RegisterRequest
		mockSetup      func(*MockUserRepository)
		expectedError  string
		expectSuccess  bool
	}{
		{
			name: "successful registration",
			request: &dto.RegisterRequest{
				Email:    "test@example.com",
				Username: "testuser",
				Password: "password123",
			},
			mockSetup: func(repo *MockUserRepository) {
				repo.existsByEmailOrUsername = func(email, username string) (bool, error) {
					return false, nil
				}
			},
			expectSuccess: true,
		},
		{
			name: "user already exists",
			request: &dto.RegisterRequest{
				Email:    "existing@example.com",
				Username: "existinguser",
				Password: "password123",
			},
			mockSetup: func(repo *MockUserRepository) {
				repo.existsByEmailOrUsername = func(email, username string) (bool, error) {
					return true, nil
				}
			},
			expectedError: "user with this email or username already exists",
		},
		{
			name: "repository error on exists check",
			request: &dto.RegisterRequest{
				Email:    "test@example.com",
				Username: "testuser",
				Password: "password123",
			},
			mockSetup: func(repo *MockUserRepository) {
				repo.existsByEmailOrUsername = func(email, username string) (bool, error) {
					return false, errors.New("database error")
				}
			},
			expectedError: "database error",
		},
		{
			name: "repository error on create",
			request: &dto.RegisterRequest{
				Email:    "test@example.com",
				Username: "testuser",
				Password: "password123",
			},
			mockSetup: func(repo *MockUserRepository) {
				repo.existsByEmailOrUsername = func(email, username string) (bool, error) {
					return false, nil
				}
				repo.createFunc = func(user *domain.User) (*domain.User, error) {
					return nil, errors.New("create error")
				}
			},
			expectedError: "create error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := NewMockUserRepository()
			if tt.mockSetup != nil {
				tt.mockSetup(mockRepo)
			}

			service := NewAuthService(mockRepo)
			result, err := service.Register(tt.request)

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

			if result.Token == "" {
				t.Errorf("expected token, got empty string")
			}

			if result.User == nil {
				t.Errorf("expected user, got nil")
			}
		})
	}
}

func TestAuthService_Login(t *testing.T) {
	// Create a test user with hashed password
	testUser := &domain.User{
		ID:       1,
		Email:    "test@example.com",
		Username: "testuser",
		Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // "password"
	}

	tests := []struct {
		name          string
		request       *dto.LoginRequest
		mockSetup     func(*MockUserRepository)
		expectedError string
		expectSuccess bool
	}{
		{
			name: "successful login",
			request: &dto.LoginRequest{
				Email:    "test@example.com",
				Password: "password",
			},
			mockSetup: func(repo *MockUserRepository) {
				repo.getByEmailFunc = func(email string) (*domain.User, error) {
					if email == "test@example.com" {
						return testUser, nil
					}
					return nil, sql.ErrNoRows
				}
			},
			expectSuccess: true,
		},
		{
			name: "user not found",
			request: &dto.LoginRequest{
				Email:    "nonexistent@example.com",
				Password: "password",
			},
			mockSetup: func(repo *MockUserRepository) {
				repo.getByEmailFunc = func(email string) (*domain.User, error) {
					return nil, sql.ErrNoRows
				}
			},
			expectedError: "invalid email or password",
		},
		{
			name: "wrong password",
			request: &dto.LoginRequest{
				Email:    "test@example.com",
				Password: "wrongpassword",
			},
			mockSetup: func(repo *MockUserRepository) {
				repo.getByEmailFunc = func(email string) (*domain.User, error) {
					return testUser, nil
				}
			},
			expectedError: "invalid email or password",
		},
		{
			name: "repository error",
			request: &dto.LoginRequest{
				Email:    "test@example.com",
				Password: "password",
			},
			mockSetup: func(repo *MockUserRepository) {
				repo.getByEmailFunc = func(email string) (*domain.User, error) {
					return nil, errors.New("database error")
				}
			},
			expectedError: "database error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := NewMockUserRepository()
			if tt.mockSetup != nil {
				tt.mockSetup(mockRepo)
			}

			service := NewAuthService(mockRepo)
			result, err := service.Login(tt.request)

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

			if result.Token == "" {
				t.Errorf("expected token, got empty string")
			}

			if result.User == nil {
				t.Errorf("expected user, got nil")
			}
		})
	}
}

func TestAuthService_GetUserByID(t *testing.T) {
	testUser := &domain.User{
		ID:       1,
		Email:    "test@example.com",
		Username: "testuser",
	}

	tests := []struct {
		name          string
		userID        int
		mockSetup     func(*MockUserRepository)
		expectedError string
		expectSuccess bool
	}{
		{
			name:   "successful get user",
			userID: 1,
			mockSetup: func(repo *MockUserRepository) {
				repo.getByIDFunc = func(id int) (*domain.User, error) {
					if id == 1 {
						return testUser, nil
					}
					return nil, sql.ErrNoRows
				}
			},
			expectSuccess: true,
		},
		{
			name:   "user not found",
			userID: 999,
			mockSetup: func(repo *MockUserRepository) {
				repo.getByIDFunc = func(id int) (*domain.User, error) {
					return nil, sql.ErrNoRows
				}
			},
			expectedError: "sql: no rows in result set",
		},
		{
			name:   "repository error",
			userID: 1,
			mockSetup: func(repo *MockUserRepository) {
				repo.getByIDFunc = func(id int) (*domain.User, error) {
					return nil, errors.New("database error")
				}
			},
			expectedError: "database error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := NewMockUserRepository()
			if tt.mockSetup != nil {
				tt.mockSetup(mockRepo)
			}

			service := NewAuthService(mockRepo)
			result, err := service.GetUserByID(tt.userID)

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

			if result.ID != testUser.ID {
				t.Errorf("expected user ID %d, got %d", testUser.ID, result.ID)
			}

			if result.Email != testUser.Email {
				t.Errorf("expected email %s, got %s", testUser.Email, result.Email)
			}

			if result.Username != testUser.Username {
				t.Errorf("expected username %s, got %s", testUser.Username, result.Username)
			}
		})
	}
}