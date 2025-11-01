package database

import (
	"golang.org/x/crypto/bcrypt"
	"log"
)

func SeedDefaultTags() error {
	// Check if tags already exist
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM tags").Scan(&count)
	if err != nil {
		return err
	}

	// If tags already exist, skip seeding
	if count > 0 {
		log.Println("Tags already exist, skipping seeding")
		return nil
	}

	// Default tags to seed
	defaultTags := []struct {
		name        string
		description string
		color       string
	}{
		{"React", "JavaScript library for building user interfaces", "#61DAFB"},
		{"DevOps", "Development and Operations practices", "#326CE5"},
		{".NET", "Microsoft's development platform", "#512BD4"},
		{"JavaScript", "Programming language for web development", "#F7DF1E"},
		{"TypeScript", "Typed superset of JavaScript", "#3178C6"},
		{"Go", "Programming language developed by Google", "#00ADD8"},
		{"Python", "High-level programming language", "#3776AB"},
		{"Docker", "Containerization platform", "#2496ED"},
		{"Kubernetes", "Container orchestration platform", "#326CE5"},
		{"AWS", "Amazon Web Services cloud platform", "#FF9900"},
		{"PostgreSQL", "Open source relational database", "#336791"},
		{"MongoDB", "NoSQL document database", "#47A248"},
		{"Redis", "In-memory data structure store", "#DC382D"},
		{"GraphQL", "Query language for APIs", "#E10098"},
		{"REST API", "Representational State Transfer API", "#009688"},
		{"Microservices", "Architectural pattern", "#FF6B6B"},
		{"Machine Learning", "Artificial intelligence and ML", "#FF6F00"},
		{"Blockchain", "Distributed ledger technology", "#F7931A"},
		{"Security", "Cybersecurity and best practices", "#E53E3E"},
		{"Performance", "Optimization and performance tuning", "#38A169"},
	}

	for _, tag := range defaultTags {
		// Generate slug from name
		slug := generateSlug(tag.name)
		
		_, err := DB.Exec(`
			INSERT INTO tags (name, slug, description, color) 
			VALUES ($1, $2, $3, $4)
		`, tag.name, slug, tag.description, tag.color)
		
		if err != nil {
			log.Printf("Error seeding tag %s: %v", tag.name, err)
			continue
		}
		
		log.Printf("Seeded tag: %s", tag.name)
	}

	log.Println("Default tags seeded successfully")
	return nil
}

func generateSlug(name string) string {
	// Simple slug generation - convert to lowercase and replace spaces with hyphens
	slug := ""
	for _, char := range name {
		if char == ' ' {
			slug += "-"
		} else if (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9') {
			if char >= 'A' && char <= 'Z' {
				slug += string(char + 32) // Convert to lowercase
			} else {
				slug += string(char)
			}
		}
	}
	return slug
}

func SeedDefaultAdmin() error {
	// Check if admin user already exists
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM users WHERE is_admin = true").Scan(&count)
	if err != nil {
		return err
	}

	// If admin user already exists, skip seeding
	if count > 0 {
		log.Println("Admin user already exists, skipping seeding")
		return nil
	}

	// Hash the default admin password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Create default admin user
	_, err = DB.Exec(`
		INSERT INTO users (email, username, password, is_admin)
		VALUES ($1, $2, $3, $4)
	`, "admin@example.com", "admin", string(hashedPassword), true)

	if err != nil {
		log.Printf("Error seeding admin user: %v", err)
		return err
	}

	log.Println("Default admin user seeded successfully (email: admin@example.com, password: admin123)")
	return nil
}