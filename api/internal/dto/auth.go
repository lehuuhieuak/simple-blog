package dto

// LoginRequest represents the login request DTO
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email" example:"user@example.com"`
	Password string `json:"password" binding:"required" example:"password123"`
}

// RegisterRequest represents the register request DTO
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email" example:"user@example.com"`
	Username string `json:"username" binding:"required,min=3,max=20" example:"username"`
	Password string `json:"password" binding:"required,min=6" example:"password123"`
}

// AuthResponse represents the authentication response DTO
type AuthResponse struct {
	User  interface{} `json:"user"`
	Token string      `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}