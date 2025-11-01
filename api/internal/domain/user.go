package domain

import "time"

// User represents the user domain entity
type User struct {
	ID        int       `json:"id" db:"id"`
	Email     string    `json:"email" db:"email"`
	Username  string    `json:"username" db:"username"`
	Password  string    `json:"-" db:"password"`
	IsAdmin   bool      `json:"is_admin" db:"is_admin"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// ToResponse converts User to UserResponse
func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		ID:      u.ID,
		Email:   u.Email,
		Username: u.Username,
		IsAdmin: u.IsAdmin,
	}
}

// UserResponse represents the user response DTO
type UserResponse struct {
	ID      int    `json:"id"`
	Email   string `json:"email"`
	Username string `json:"username"`
	IsAdmin bool   `json:"is_admin"`
}