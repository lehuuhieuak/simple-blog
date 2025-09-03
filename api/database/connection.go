package database

import (
	"database/sql"
	"fmt"
	"log"

	"blog-api/config"

	_ "github.com/denisenkom/go-mssqldb"
)

var DB *sql.DB

func Connect(cfg *config.Config) error {
	connString := fmt.Sprintf("server=%s;user id=%s;password=%s;port=%d;database=%s;encrypt=%t;TrustServerCertificate=%t",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBPort, cfg.DBName, cfg.DBEncrypt, cfg.DBTrustCert)

	var err error
	DB, err = sql.Open("sqlserver", connString)
	if err != nil {
		return fmt.Errorf("error opening database: %v", err)
	}

	if err = DB.Ping(); err != nil {
		return fmt.Errorf("error connecting to database: %v", err)
	}

	log.Println("Successfully connected to MSSQL database")
	return nil
}

func Close() {
	if DB != nil {
		DB.Close()
	}
}