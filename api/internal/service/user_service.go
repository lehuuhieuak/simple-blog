package service

import (
	"blog-api/internal/domain"
	"blog-api/internal/dto"
	"blog-api/internal/repository"
	"blog-api/utils"
	"database/sql"
	"errors"
	"math"
)

// UserService defines the interface for user operations
type UserService interface {
	GetAllUsers(filter *dto.UserFilter) (*dto.UsersListResponse, error)
	GetUserByID(id int) (*dto.UserResponse, error)
	CreateUser(req *dto.CreateUserRequest) (*dto.UserResponse, error)
	UpdateUser(id int, req *dto.UpdateUserRequest) (*dto.UserResponse, error)
	DeleteUser(id int) error
}

type userService struct {
	userRepo repository.UserRepository
}

// NewUserService creates a new user service
func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{
		userRepo: userRepo,
	}
}

// GetAllUsers retrieves all users with pagination and filtering
func (s *userService) GetAllUsers(filter *dto.UserFilter) (*dto.UsersListResponse, error) {
	users, total, err := s.userRepo.GetAll(filter)
	if err != nil {
		return nil, err
	}

	// Convert domain users to response DTOs
	var userResponses []dto.UserResponse
	for _, user := range users {
		userResponses = append(userResponses, dto.UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			Username:  user.Username,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
		})
	}

	// Calculate total pages
	totalPages := int(math.Ceil(float64(total) / float64(filter.Limit)))

	return &dto.UsersListResponse{
		Users: userResponses,
		Pagination: dto.Pagination{
			Page:  filter.Page,
			Limit: filter.Limit,
			Total: total,
			Pages: totalPages,
		},
	}, nil
}

// GetUserByID retrieves a user by ID
func (s *userService) GetUserByID(id int) (*dto.UserResponse, error) {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return &dto.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		Username:  user.Username,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}, nil
}

// CreateUser creates a new user
func (s *userService) CreateUser(req *dto.CreateUserRequest) (*dto.UserResponse, error) {
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

	return &dto.UserResponse{
		ID:        createdUser.ID,
		Email:     createdUser.Email,
		Username:  createdUser.Username,
		CreatedAt: createdUser.CreatedAt,
		UpdatedAt: createdUser.UpdatedAt,
	}, nil
}

// UpdateUser updates a user by ID
func (s *userService) UpdateUser(id int, req *dto.UpdateUserRequest) (*dto.UserResponse, error) {
	// Check if user exists
	existingUser, err := s.userRepo.GetByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	// Check for email/username conflicts (excluding current user)
	if req.Email != "" || req.Username != "" {
		email := req.Email
		username := req.Username

		// Use existing values if not provided in update
		if email == "" {
			email = existingUser.Email
		}
		if username == "" {
			username = existingUser.Username
		}

		exists, err := s.userRepo.ExistsByEmailOrUsernameExcludingID(email, username, id)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, errors.New("user with this email or username already exists")
		}
	}

	// Prepare update data
	updateUser := &domain.User{}

	if req.Email != "" {
		updateUser.Email = req.Email
	}

	if req.Username != "" {
		updateUser.Username = req.Username
	}

	if req.Password != "" {
		hashedPassword, err := utils.HashPassword(req.Password)
		if err != nil {
			return nil, err
		}
		updateUser.Password = hashedPassword
	}

	// Update user
	updatedUser, err := s.userRepo.Update(id, updateUser)
	if err != nil {
		return nil, err
	}

	return &dto.UserResponse{
		ID:        updatedUser.ID,
		Email:     updatedUser.Email,
		Username:  updatedUser.Username,
		CreatedAt: updatedUser.CreatedAt,
		UpdatedAt: updatedUser.UpdatedAt,
	}, nil
}

// DeleteUser deletes a user by ID
func (s *userService) DeleteUser(id int) error {
	// Check if user exists
	_, err := s.userRepo.GetByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("user not found")
		}
		return err
	}

	// Delete user
	err = s.userRepo.Delete(id)
	if err != nil {
		return err
	}

	return nil
}
