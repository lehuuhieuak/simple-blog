package repository

import (
	"database/sql"
	"blog-api/internal/domain"
)

// TagRepository defines the interface for tag data operations
type TagRepository interface {
	Create(tag *domain.Tag) (*domain.Tag, error)
	GetByID(id int) (*domain.Tag, error)
	GetBySlug(slug string) (*domain.Tag, error)
	Update(tag *domain.Tag) (*domain.Tag, error)
	Delete(id int) error
	GetAll(page, limit int) ([]domain.Tag, int, error)
	ExistsByName(name string) (bool, error)
}

type tagRepository struct {
	db *sql.DB
}

// NewTagRepository creates a new tag repository
func NewTagRepository(db *sql.DB) TagRepository {
	return &tagRepository{db: db}
}

// Create creates a new tag
func (r *tagRepository) Create(tag *domain.Tag) (*domain.Tag, error) {
	query := `INSERT INTO tags (name, slug)
			  VALUES ($1, $2)
			  RETURNING id, created_at, updated_at`
	err := r.db.QueryRow(query, tag.Name, tag.Slug).
		Scan(&tag.ID, &tag.CreatedAt, &tag.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return tag, nil
}

// GetByID retrieves a tag by ID
func (r *tagRepository) GetByID(id int) (*domain.Tag, error) {
	tag := &domain.Tag{}
	query := `SELECT id, name, slug, created_at, updated_at
			  FROM tags WHERE id = $1`
	err := r.db.QueryRow(query, id).
		Scan(&tag.ID, &tag.Name, &tag.Slug,
			 &tag.CreatedAt, &tag.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return tag, nil
}

// GetBySlug retrieves a tag by slug
func (r *tagRepository) GetBySlug(slug string) (*domain.Tag, error) {
	tag := &domain.Tag{}
	query := `SELECT id, name, slug, created_at, updated_at
			  FROM tags WHERE slug = $1`
	err := r.db.QueryRow(query, slug).
		Scan(&tag.ID, &tag.Name, &tag.Slug,
			 &tag.CreatedAt, &tag.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return tag, nil
}

// Update updates a tag
func (r *tagRepository) Update(tag *domain.Tag) (*domain.Tag, error) {
	query := `UPDATE tags SET name = $1, slug = $2, updated_at = NOW()
			  WHERE id = $3 RETURNING updated_at`
	err := r.db.QueryRow(query, tag.Name, tag.Slug, tag.ID).
		Scan(&tag.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return tag, nil
}

// Delete deletes a tag
func (r *tagRepository) Delete(id int) error {
	query := `DELETE FROM tags WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

// GetAll retrieves all tags with pagination
func (r *tagRepository) GetAll(page, limit int) ([]domain.Tag, int, error) {
	offset := (page - 1) * limit

	// Get total count
	var total int
	countQuery := `SELECT COUNT(*) FROM tags`
	err := r.db.QueryRow(countQuery).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get tags
	query := `SELECT id, name, slug, created_at, updated_at
			  FROM tags
			  ORDER BY name ASC
			  LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var tags []domain.Tag
	for rows.Next() {
		var tag domain.Tag
		err := rows.Scan(&tag.ID, &tag.Name, &tag.Slug,
						&tag.CreatedAt, &tag.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}
		tags = append(tags, tag)
	}

	return tags, total, nil
}

// ExistsByName checks if a tag exists by name
func (r *tagRepository) ExistsByName(name string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM tags WHERE name = $1`
	err := r.db.QueryRow(query, name).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}