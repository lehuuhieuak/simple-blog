package database

import (
	"log"
)

func InitializeDatabase() error {
	// Create users table
	_, err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			username VARCHAR(100) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
			is_admin BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	// Create posts table
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS posts (
			id SERIAL PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			slug VARCHAR(255) UNIQUE NOT NULL,
			content TEXT NOT NULL,
			author_id INTEGER NOT NULL,
			published BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return err
	}

	// Create tags table
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS tags (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			slug VARCHAR(255) UNIQUE NOT NULL,
			description VARCHAR(255) NOT NULL,
			color VARCHAR(255) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	// Create post_tags table
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS post_tags (
			id SERIAL PRIMARY KEY,
			post_id SERIAL NOT NULL,
			tag_id SERIAL NOT NULL,
			FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
		    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return err
	}

	// Create indexes
	_, err = DB.Exec(`CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id)`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published)`)
	if err != nil {
		return err
	}

	// Create function for updating updated_at timestamp
	_, err = DB.Exec(`
		CREATE OR REPLACE FUNCTION update_updated_at_column()
		RETURNS TRIGGER AS $$
		BEGIN
			NEW.updated_at = CURRENT_TIMESTAMP;
			RETURN NEW;
		END;
		$$ language 'plpgsql'
	`)
	if err != nil {
		return err
	}

	// Create triggers for updated_at
	_, err = DB.Exec(`
		DROP TRIGGER IF EXISTS tr_users_updated_at ON users;
		CREATE TRIGGER tr_users_updated_at
			BEFORE UPDATE ON users
			FOR EACH ROW
			EXECUTE FUNCTION update_updated_at_column()
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`
		DROP TRIGGER IF EXISTS tr_posts_updated_at ON posts;
		CREATE TRIGGER tr_posts_updated_at
			BEFORE UPDATE ON posts
			FOR EACH ROW
			EXECUTE FUNCTION update_updated_at_column()
	`)
	if err != nil {
		return err
	}

	log.Println("Database tables initialized successfully")

	// Seed default tags
	err = SeedDefaultTags()
	if err != nil {
		log.Printf("Warning: Failed to seed default tags: %v", err)
		// Don't return error as this is not critical
	}

	return nil
}
