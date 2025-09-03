package database

import (
	"log"
)

func InitializeDatabase() error {
	// Create users table
	_, err := DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
		CREATE TABLE users (
			id INT IDENTITY(1,1) PRIMARY KEY,
			email NVARCHAR(255) UNIQUE NOT NULL,
			username NVARCHAR(100) UNIQUE NOT NULL,
			password NVARCHAR(255) NOT NULL,
			created_at DATETIME2 DEFAULT GETDATE(),
			updated_at DATETIME2 DEFAULT GETDATE()
		)
	`)
	if err != nil {
		return err
	}

	// Create posts table
	_, err = DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='posts' AND xtype='U')
		CREATE TABLE posts (
			id INT IDENTITY(1,1) PRIMARY KEY,
			title NVARCHAR(255) NOT NULL,
			slug NVARCHAR(255) UNIQUE NOT NULL,
			content NTEXT NOT NULL,
			excerpt NTEXT,
			author_id INT NOT NULL,
			published BIT DEFAULT 0,
			created_at DATETIME2 DEFAULT GETDATE(),
			updated_at DATETIME2 DEFAULT GETDATE(),
			FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return err
	}

	// Create indexes
	_, err = DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_posts_slug')
		CREATE INDEX idx_posts_slug ON posts(slug)
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_posts_author')
		CREATE INDEX idx_posts_author ON posts(author_id)
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_posts_published')
		CREATE INDEX idx_posts_published ON posts(published)
	`)
	if err != nil {
		return err
	}

	// Create triggers for updated_at
	_, err = DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'tr_users_updated_at')
		EXEC('CREATE TRIGGER tr_users_updated_at
		ON users
		AFTER UPDATE
		AS
		BEGIN
			UPDATE users 
			SET updated_at = GETDATE()
			FROM users u
			INNER JOIN inserted i ON u.id = i.id
		END')
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`
		IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'tr_posts_updated_at')
		EXEC('CREATE TRIGGER tr_posts_updated_at
		ON posts
		AFTER UPDATE
		AS
		BEGIN
			UPDATE posts 
			SET updated_at = GETDATE()
			FROM posts p
			INNER JOIN inserted i ON p.id = i.id
		END')
	`)
	if err != nil {
		return err
	}

	log.Println("Database tables initialized successfully")
	return nil
}