package dto

import "time"

// CreateUserRequest represents the create user request DTO
type CreateUserRequest struct {
	Email    string `json:"email" binding:"required,email" example:"user@example.com"`
	Username string `json:"username" binding:"required,min=3,max=20" example:"username"`
	Password string `json:"password" binding:"required,min=6" example:"password123"`
}

// UpdateUserRequest represents the update user request DTO
type UpdateUserRequest struct {
	Email    string `json:"email" binding:"omitempty,email" example:"user@example.com"`
	Username string `json:"username" binding:"omitempty,min=3,max=20" example:"username"`
	Password string `json:"password" binding:"omitempty,min=6" example:"newpassword123"`
}

// UserResponse represents the user response DTO
type UserResponse struct {
	ID        int       `json:"id" example:"1"`
	Email     string    `json:"email" example:"user@example.com"`
	Username  string    `json:"username" example:"username"`
	CreatedAt time.Time `json:"created_at" example:"2023-01-01T00:00:00Z"`
	UpdatedAt time.Time `json:"updated_at" example:"2023-01-01T00:00:00Z"`
}

// Pagination represents pagination information
type Pagination struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
	Total int `json:"total"`
	Pages int `json:"pages"`
}

// UsersListResponse represents the paginated users list response
type UsersListResponse struct {
	Users      []UserResponse `json:"users"`
	Pagination Pagination     `json:"pagination"`
}

// UserFilter represents user filtering options
type UserFilter struct {
	Search string `form:"search" example:"john"`
	Email  string `form:"email" example:"user@example.com"`
	Page   int    `form:"page,default=1" example:"1"`
	Limit  int    `form:"limit,default=10" example:"10"`
}
