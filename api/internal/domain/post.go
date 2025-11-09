package domain

import "time"

// Post represents the post domain entity
type Post struct {
	ID             int       `json:"id" db:"id"`
	Title          string    `json:"title" db:"title"`
	Slug           string    `json:"slug" db:"slug"`
	Content        string    `json:"content" db:"content"`
	AuthorID       int       `json:"author_id" db:"author_id"`
	Published      bool      `json:"published" db:"published"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
	AuthorUsername string    `json:"author_username,omitempty" db:"author_username"`
	AuthorEmail    string    `json:"author_email,omitempty" db:"author_email"`
	Tags           []Tag     `json:"tags,omitempty"`
}

// Tag represents the tag domain entity
type Tag struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Slug      string    `json:"slug" db:"slug"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// Pagination represents pagination information
type Pagination struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
	Total int `json:"total"`
	Pages int `json:"pages"`
}

// PostsResponse represents the posts response with pagination
type PostsResponse struct {
	Posts      []Post     `json:"posts"`
	Pagination Pagination `json:"pagination"`
}

// TagsResponse represents the tags response with pagination
type TagsResponse struct {
	Tags       []Tag      `json:"tags"`
	Pagination Pagination `json:"pagination"`
}