package repository

import (
	"blog-api/internal/domain"
	"blog-api/internal/dto"
	"database/sql"
	"fmt"
	"strings"
)

// UserRepository defines the interface for user data operations
type UserRepository interface {
	Create(user *domain.User) (*domain.User, error)
	GetByEmail(email string) (*domain.User, error)
	GetByID(id int) (*domain.User, error)
	ExistsByEmailOrUsername(email, username string) (bool, error)
	GetAll(filter *dto.UserFilter) ([]domain.User, int, error)
	Update(id int, user *domain.User) (*domain.User, error)
	Delete(id int) error
	ExistsByEmailOrUsernameExcludingID(email, username string, excludeID int) (bool, error)
}

// userRepository implements UserRepository interface
type userRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{db: db}
}

// Create creates a new user
func (r *userRepository) Create(user *domain.User) (*domain.User, error) {
	query := `INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, created_at, updated_at`
	err := r.db.QueryRow(query, user.Email, user.Username, user.Password).
		Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetByEmail retrieves a user by email
func (r *userRepository) GetByEmail(email string) (*domain.User, error) {
	user := &domain.User{}
	query := `SELECT id, email, username, password, created_at, updated_at, is_admin FROM users WHERE email = $1`
	err := r.db.QueryRow(query, email).
		Scan(&user.ID, &user.Email, &user.Username, &user.Password, &user.CreatedAt, &user.UpdatedAt, &user.IsAdmin)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetByID retrieves a user by ID
func (r *userRepository) GetByID(id int) (*domain.User, error) {
	user := &domain.User{}
	query := `SELECT id, email, username, password, is_admin, created_at, updated_at FROM users WHERE id = $1`
	err := r.db.QueryRow(query, id).
		Scan(&user.ID, &user.Email, &user.Username, &user.Password, &user.IsAdmin, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// ExistsByEmailOrUsername checks if a user exists by email or username
func (r *userRepository) ExistsByEmailOrUsername(email, username string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM users WHERE email = $1 OR username = $2`
	err := r.db.QueryRow(query, email, username).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetAll retrieves all users with pagination and filtering
func (r *userRepository) GetAll(filter *dto.UserFilter) ([]domain.User, int, error) {
	var users []domain.User
	var total int

	// Build WHERE clause for filtering
	var conditions []string
	var args []interface{}
	argIndex := 1

	if filter.Search != "" {
		conditions = append(conditions, fmt.Sprintf("(username ILIKE $%d OR email ILIKE $%d)", argIndex, argIndex+1))
		searchPattern := "%" + filter.Search + "%"
		args = append(args, searchPattern, searchPattern)
		argIndex += 2
	}

	if filter.Email != "" {
		conditions = append(conditions, fmt.Sprintf("email ILIKE $%d", argIndex))
		args = append(args, "%"+filter.Email+"%")
		argIndex++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM users %s", whereClause)
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Calculate pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 10
	}

	offset := (filter.Page - 1) * filter.Limit

	// Get users with pagination
	query := fmt.Sprintf(`
		SELECT id, email, username, password, created_at, updated_at 
		FROM users %s 
		ORDER BY created_at DESC 
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, filter.Limit, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var user domain.User
		err := rows.Scan(&user.ID, &user.Email, &user.Username, &user.Password,
			&user.CreatedAt, &user.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, user)
	}

	return users, total, nil
}

// Update updates a user by ID
func (r *userRepository) Update(id int, user *domain.User) (*domain.User, error) {
	var setParts []string
	var args []interface{}
	argIndex := 1

	if user.Email != "" {
		setParts = append(setParts, fmt.Sprintf("email = $%d", argIndex))
		args = append(args, user.Email)
		argIndex++
	}

	if user.Username != "" {
		setParts = append(setParts, fmt.Sprintf("username = $%d", argIndex))
		args = append(args, user.Username)
		argIndex++
	}

	if user.Password != "" {
		setParts = append(setParts, fmt.Sprintf("password = $%d", argIndex))
		args = append(args, user.Password)
		argIndex++
	}

	if len(setParts) == 0 {
		return r.GetByID(id)
	}

	query := fmt.Sprintf(`
		UPDATE users 
		SET %s 
		WHERE id = $%d 
		RETURNING id, email, username, password, created_at, updated_at
	`, strings.Join(setParts, ", "), argIndex)

	args = append(args, id)

	updatedUser := &domain.User{}
	err := r.db.QueryRow(query, args...).Scan(
		&updatedUser.ID, &updatedUser.Email, &updatedUser.Username,
		&updatedUser.Password, &updatedUser.CreatedAt, &updatedUser.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return updatedUser, nil
}

// Delete deletes a user by ID
func (r *userRepository) Delete(id int) error {
	query := `DELETE FROM users WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

// ExistsByEmailOrUsernameExcludingID checks if a user exists by email or username, excluding a specific ID
func (r *userRepository) ExistsByEmailOrUsernameExcludingID(email, username string, excludeID int) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM users WHERE (email = $1 OR username = $2) AND id != $3`
	err := r.db.QueryRow(query, email, username, excludeID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
