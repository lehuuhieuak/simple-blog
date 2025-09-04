package models

import "time"

type Post struct {
	ID             int       `json:"id" db:"id"`
	Title          string    `json:"title" db:"title"`
	Slug           string    `json:"slug" db:"slug"`
	Content        string    `json:"content" db:"content"`
	Excerpt        string    `json:"excerpt" db:"excerpt"`
	AuthorID       int       `json:"author_id" db:"author_id"`
	Published      bool      `json:"published" db:"published"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
	AuthorUsername string    `json:"author_username,omitempty" db:"author_username"`
	AuthorEmail    string    `json:"author_email,omitempty" db:"author_email"`
}

type PostRequest struct {
	Title     string   `json:"title" binding:"required,max=255"`
	Content   string   `json:"content" binding:"required"`
	Published bool     `json:"published"`
}

type PostsResponse struct {
	Posts      []Post     `json:"posts"`
	Pagination Pagination `json:"pagination"`
}

type Pagination struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
	Total int `json:"total"`
	Pages int `json:"pages"`
}