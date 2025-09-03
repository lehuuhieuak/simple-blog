package config

import (
	"os"
	"strconv"
)

type Config struct {
	DBHost      string
	DBPort      int
	DBName      string
	DBUser      string
	DBPassword  string
	DBEncrypt   bool
	DBTrustCert bool
	JWTSecret   string
	Port        string
}

func Load() *Config {
	dbPort, _ := strconv.Atoi(getEnv("DB_PORT", "1433"))
	dbEncrypt, _ := strconv.ParseBool(getEnv("DB_ENCRYPT", "false"))
	dbTrustCert, _ := strconv.ParseBool(getEnv("DB_TRUST_CERT", "true"))

	return &Config{
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      dbPort,
		DBName:      getEnv("DB_NAME", "blog"),
		DBUser:      getEnv("DB_USER", "sa"),
		DBPassword:  getEnv("DB_PASSWORD", ""),
		DBEncrypt:   dbEncrypt,
		DBTrustCert: dbTrustCert,
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key"),
		Port:        getEnv("PORT", "8080"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}