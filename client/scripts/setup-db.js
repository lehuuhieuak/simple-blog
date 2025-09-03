import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function setupDatabase() {
  let pool;

  try {
    // MSSQL connection configuration
    const config = {
      server: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '1433'),
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
      },
    };

    // Connect to MSSQL server (without specifying database)
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('Connected to MSSQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'blog_db';
    await pool.request().query(`
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${dbName}')
      CREATE DATABASE [${dbName}]
    `);
    console.log(`Database '${dbName}' created or already exists`);

    // Close current connection and reconnect to the specific database
    await pool.close();

    config.database = dbName;
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log(`Connected to database '${dbName}'`);

    // Create users table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) UNIQUE NOT NULL,
        username NVARCHAR(100) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('Users table created');

    // Create posts table
    await pool.request().query(`
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
    `);
    console.log('Posts table created');

    // Create indexes
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_posts_slug')
      CREATE INDEX idx_posts_slug ON posts(slug)
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_posts_author')
      CREATE INDEX idx_posts_author ON posts(author_id)
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_posts_published')
      CREATE INDEX idx_posts_published ON posts(published)
    `);

    // Create triggers for updated_at
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'tr_users_updated_at')
      EXEC('
      CREATE TRIGGER tr_users_updated_at
      ON users
      AFTER UPDATE
      AS
      BEGIN
        UPDATE users 
        SET updated_at = GETDATE()
        FROM users u
        INNER JOIN inserted i ON u.id = i.id
      END')
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'tr_posts_updated_at')
      EXEC('
      CREATE TRIGGER tr_posts_updated_at
      ON posts
      AFTER UPDATE
      AS
      BEGIN
        UPDATE posts 
        SET updated_at = GETDATE()
        FROM posts p
        INNER JOIN inserted i ON p.id = i.id
      END')
    `);

    console.log('MSSQL database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up MSSQL database:', error);
    console.error(
      'Make sure MSSQL Server is running and credentials are correct',
    );
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

setupDatabase();
