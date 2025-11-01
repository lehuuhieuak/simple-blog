package service

import (
	"database/sql"
	"errors"
	"blog-api/internal/domain"
	"blog-api/internal/dto"
	"blog-api/internal/repository"
	"blog-api/utils"
)

// AuthService defines the interface for authentication operations
type AuthService interface {
	Register(req *dto.RegisterRequest) (*dto.AuthResponse, error)
	Login(req *dto.LoginRequest) (*dto.AuthResponse, error)
	GetUserByID(id int) (*domain.UserResponse, error)
}

type authService struct {
	userRepo repository.UserRepository
}

// NewAuthService creates a new auth service
func NewAuthService(userRepo repository.UserRepository) AuthService {
	return &authService{
		userRepo: userRepo,
	}
}

// Register registers a new user
func (s *authService) Register(req *dto.RegisterRequest) (*dto.AuthResponse, error) {
	// Check if user already exists
	exists, err := s.userRepo.ExistsByEmailOrUsername(req.Email, req.Username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("user with this email or username already exists")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &domain.User{
		Email:    req.Email,
		Username: req.Username,
		Password: hashedPassword,
	}

	createdUser, err := s.userRepo.Create(user)
	if err != nil {
		return nil, err
	}

	userResponse := createdUser.ToResponse()

	// Generate token
	token, err := utils.GenerateToken(*userResponse)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		User:  userResponse,
		Token: token,
	}, nil
}

// Login authenticates a user
func (s *authService) Login(req *dto.LoginRequest) (*dto.AuthResponse, error) {
	// Get user by email
	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("invalid email or password")
		}
		return nil, err
	}

	// Verify password
	if !utils.VerifyPassword(req.Password, user.Password) {
		return nil, errors.New("invalid email or password")
	}

	userResponse := user.ToResponse()

	// Generate token
	token, err := utils.GenerateToken(*userResponse)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		User:  userResponse,
		Token: token,
	}, nil
}

// GetUserByID retrieves a user by ID
func (s *authService) GetUserByID(id int) (*domain.UserResponse, error) {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	return user.ToResponse(), nil
}