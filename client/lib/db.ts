import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'blog',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Use encryption for Azure SQL
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true', // Trust self-signed certificates
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
  }
  return pool;
}

export default getPool;

// Execute query helper function
export async function executeQuery(query: string, params: any[] = []): Promise<sql.IResult<any>> {
  const pool = await getPool();
  const request = pool.request();
  
  // Add parameters to the request
  params.forEach((param, index) => {
    request.input(`param${index}`, param);
  });
  
  return await request.query(query);
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    const pool = await getPool();
    
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

    // Create trigger for updated_at
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'tr_users_updated_at')
      CREATE TRIGGER tr_users_updated_at
      ON users
      AFTER UPDATE
      AS
      BEGIN
        UPDATE users 
        SET updated_at = GETDATE()
        FROM users u
        INNER JOIN inserted i ON u.id = i.id
      END
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'tr_posts_updated_at')
      CREATE TRIGGER tr_posts_updated_at
      ON posts
      AFTER UPDATE
      AS
      BEGIN
        UPDATE posts 
        SET updated_at = GETDATE()
        FROM posts p
        INNER JOIN inserted i ON p.id = i.id
      END
    `);

    console.log('MSSQL database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing MSSQL database:', error);
    throw error;
  }
}