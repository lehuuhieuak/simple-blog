package repository

import (
	"blog-api/internal/domain"
	"database/sql"
	"fmt"
	"strings"
)

// PostRepository defines the interface for post data operations
type PostRepository interface {
	Create(post *domain.Post) (*domain.Post, error)
	GetBySlug(slug string) (*domain.Post, error)
	GetByID(id int) (*domain.Post, error)
	Update(post *domain.Post) (*domain.Post, error)
	Delete(id int) error
	GetAll(page, limit int) ([]domain.Post, int, error)
	GetByAuthorID(authorID, page, limit int) ([]domain.Post, int, error)
	GetByTagSlug(tagSlug string, page, limit int) ([]domain.Post, int, error)
	AddTags(postID int, tagIDs []int) error
	RemoveTags(postID int) error
}

type postRepository struct {
	db *sql.DB
}

// NewPostRepository creates a new post repository
func NewPostRepository(db *sql.DB) PostRepository {
	return &postRepository{db: db}
}

// Create creates a new post
func (r *postRepository) Create(post *domain.Post) (*domain.Post, error) {
	query := `INSERT INTO posts (title, slug, content, author_id, published) 
			  VALUES ($1, $2, $3, $4, $5) 
			  RETURNING id, created_at, updated_at`
	err := r.db.QueryRow(query, post.Title, post.Slug, post.Content, post.AuthorID, post.Published).
		Scan(&post.ID, &post.CreatedAt, &post.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return post, nil
}

// GetBySlug retrieves a post by slug
func (r *postRepository) GetBySlug(slug string) (*domain.Post, error) {
	post := &domain.Post{}
	query := `SELECT p.id, p.title, p.slug, p.content, p.author_id, p.published, 
			         p.created_at, p.updated_at, u.username, u.email
			  FROM posts p 
			  JOIN users u ON p.author_id = u.id 
			  WHERE p.slug = $1`
	err := r.db.QueryRow(query, slug).
		Scan(&post.ID, &post.Title, &post.Slug, &post.Content, &post.AuthorID,
			&post.Published, &post.CreatedAt, &post.UpdatedAt,
			&post.AuthorUsername, &post.AuthorEmail)
	if err != nil {
		return nil, err
	}

	// Load tags
	tags, err := r.getPostTags(post.ID)
	if err != nil {
		return nil, err
	}
	post.Tags = tags

	return post, nil
}

// GetByID retrieves a post by ID
func (r *postRepository) GetByID(id int) (*domain.Post, error) {
	post := &domain.Post{}
	query := `SELECT p.id, p.title, p.slug, p.content, p.author_id, p.published, 
			         p.created_at, p.updated_at, u.username, u.email
			  FROM posts p []
			  JOIN users u ON p.author_id = u.id 
			  WHERE p.id = $1`
	err := r.db.QueryRow(query, id).
		Scan(&post.ID, &post.Title, &post.Slug, &post.Content, &post.AuthorID,
			&post.Published, &post.CreatedAt, &post.UpdatedAt,
			&post.AuthorUsername, &post.AuthorEmail)
	if err != nil {
		return nil, err
	}

	// Load tags
	tags, err := r.getPostTags(post.ID)
	if err != nil {
		return nil, err
	}
	post.Tags = tags

	return post, nil
}

// Update updates a post
func (r *postRepository) Update(post *domain.Post) (*domain.Post, error) {
	query := `UPDATE posts SET title = $1, slug = $2, content = $3, published = $4, updated_at = NOW() 
			  WHERE id = $5 RETURNING updated_at`
	err := r.db.QueryRow(query, post.Title, post.Slug, post.Content, post.Published, post.ID).
		Scan(&post.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return post, nil
}

// Delete deletes a post
func (r *postRepository) Delete(id int) error {
	query := `DELETE FROM posts WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

// GetAll retrieves all posts with pagination
func (r *postRepository) GetAll(page, limit int) ([]domain.Post, int, error) {
	offset := (page - 1) * limit

	// Get total count
	var total int
	countQuery := `SELECT COUNT(*) FROM posts WHERE published = true`
	err := r.db.QueryRow(countQuery).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get posts
	query := `SELECT p.id, p.title, p.slug, p.content, p.author_id, p.published, 
			         p.created_at, p.updated_at, u.username, u.email
			  FROM posts p 
			  JOIN users u ON p.author_id = u.id 
			  WHERE p.published = true
			  ORDER BY p.created_at DESC 
			  LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var posts []domain.Post
	for rows.Next() {
		var post domain.Post
		err := rows.Scan(&post.ID, &post.Title, &post.Slug, &post.Content, &post.AuthorID,
			&post.Published, &post.CreatedAt, &post.UpdatedAt,
			&post.AuthorUsername, &post.AuthorEmail)
		if err != nil {
			return nil, 0, err
		}

		// Load tags for each post
		tags, err := r.getPostTags(post.ID)
		if err != nil {
			return nil, 0, err
		}
		post.Tags = tags

		posts = append(posts, post)
	}

	return posts, total, nil
}

// GetByAuthorID retrieves posts by author ID
func (r *postRepository) GetByAuthorID(authorID, page, limit int) ([]domain.Post, int, error) {
	offset := (page - 1) * limit

	// Get total count
	var total int
	countQuery := `SELECT COUNT(*) FROM posts WHERE author_id = $1`
	err := r.db.QueryRow(countQuery, authorID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get posts
	query := `SELECT p.id, p.title, p.slug, p.content, p.author_id, p.published, 
			         p.created_at, p.updated_at, u.username, u.email
			  FROM posts p 
			  JOIN users u ON p.author_id = u.id 
			  WHERE p.author_id = $1
			  ORDER BY p.created_at DESC 
			  LIMIT $2 OFFSET $3`

	rows, err := r.db.Query(query, authorID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var posts []domain.Post
	for rows.Next() {
		var post domain.Post
		err := rows.Scan(&post.ID, &post.Title, &post.Slug, &post.Content, &post.AuthorID,
			&post.Published, &post.CreatedAt, &post.UpdatedAt,
			&post.AuthorUsername, &post.AuthorEmail)
		if err != nil {
			return nil, 0, err
		}

		// Load tags for each post
		tags, err := r.getPostTags(post.ID)
		if err != nil {
			return nil, 0, err
		}
		post.Tags = tags

		posts = append(posts, post)
	}

	return posts, total, nil
}

// GetByTagSlug retrieves posts by tag slug
func (r *postRepository) GetByTagSlug(tagSlug string, page, limit int) ([]domain.Post, int, error) {
	offset := (page - 1) * limit

	// Get total count
	var total int
	countQuery := `SELECT COUNT(DISTINCT p.id) FROM posts p 
				   JOIN post_tags pt ON p.id = pt.post_id 
				   JOIN tags t ON pt.tag_id = t.id 
				   WHERE t.slug = $1 AND p.published = true`
	err := r.db.QueryRow(countQuery, tagSlug).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get posts
	query := `SELECT DISTINCT p.id, p.title, p.slug, p.content, p.author_id, p.published, 
			         p.created_at, p.updated_at, u.username, u.email
			  FROM posts p 
			  JOIN users u ON p.author_id = u.id
			  JOIN post_tags pt ON p.id = pt.post_id 
			  JOIN tags t ON pt.tag_id = t.id 
			  WHERE t.slug = $1 AND p.published = true
			  ORDER BY p.created_at DESC 
			  LIMIT $2 OFFSET $3`

	rows, err := r.db.Query(query, tagSlug, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var posts []domain.Post
	for rows.Next() {
		var post domain.Post
		err := rows.Scan(&post.ID, &post.Title, &post.Slug, &post.Content, &post.AuthorID,
			&post.Published, &post.CreatedAt, &post.UpdatedAt,
			&post.AuthorUsername, &post.AuthorEmail)
		if err != nil {
			return nil, 0, err
		}

		// Load tags for each post
		tags, err := r.getPostTags(post.ID)
		if err != nil {
			return nil, 0, err
		}
		post.Tags = tags

		posts = append(posts, post)
	}

	return posts, total, nil
}

// AddTags adds tags to a post
func (r *postRepository) AddTags(postID int, tagIDs []int) error {
	if len(tagIDs) == 0 {
		return nil
	}

	// Build bulk insert query
	valueStrings := make([]string, 0, len(tagIDs))
	valueArgs := make([]interface{}, 0, len(tagIDs)*2)

	for i, tagID := range tagIDs {
		valueStrings = append(valueStrings, fmt.Sprintf("($%d, $%d)", i*2+1, i*2+2))
		valueArgs = append(valueArgs, postID, tagID)
	}

	query := fmt.Sprintf("INSERT INTO post_tags (post_id, tag_id) VALUES %s ON CONFLICT DO NOTHING",
		strings.Join(valueStrings, ","))

	_, err := r.db.Exec(query, valueArgs...)
	return err
}

// RemoveTags removes all tags from a post
func (r *postRepository) RemoveTags(postID int) error {
	query := `DELETE FROM post_tags WHERE post_id = $1`
	_, err := r.db.Exec(query, postID)
	return err
}

// getPostTags retrieves tags for a specific post
func (r *postRepository) getPostTags(postID int) ([]domain.Tag, error) {
	query := `SELECT t.id, t.name, t.slug, t.description, t.color, t.created_at, t.updated_at
			  FROM tags t 
			  JOIN post_tags pt ON t.id = pt.tag_id 
			  WHERE pt.post_id = $1`

	rows, err := r.db.Query(query, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []domain.Tag
	for rows.Next() {
		var tag domain.Tag
		err := rows.Scan(&tag.ID, &tag.Name, &tag.Slug, &tag.Description,
			&tag.Color, &tag.CreatedAt, &tag.UpdatedAt)
		if err != nil {
			return nil, err
		}
		tags = append(tags, tag)
	}

	return tags, nil
}
