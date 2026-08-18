const mysql = require('mysql2/promise');
require('dotenv').config();

const run = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.execute('ALTER TABLE users MODIFY phone VARCHAR(20) NULL');
    await connection.execute('ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL');
    const [inviteColumns] = await connection.execute(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'invite_code'`,
      [process.env.DB_NAME]
    );
    if (inviteColumns.length === 0) {
      await connection.execute('ALTER TABLE users ADD COLUMN invite_code VARCHAR(20) UNIQUE NULL AFTER password_hash');
    }
    const [profileColumns] = await connection.execute(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_data'`,
      [process.env.DB_NAME]
    );
    if (profileColumns.length === 0) {
      await connection.execute('ALTER TABLE users ADD COLUMN profile_data JSON NULL AFTER avatar');
    }
    await connection.execute('ALTER TABLE users MODIFY avatar MEDIUMTEXT NULL');
    await connection.execute(`UPDATE users SET invite_code = CONCAT('LOVE', LPAD(UPPER(HEX(id)), 8, '0')) WHERE invite_code IS NULL`);
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS auth_identities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        provider VARCHAR(30) NOT NULL,
        provider_user_id VARCHAR(128) NOT NULL,
        union_id VARCHAR(128) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_provider_user (provider, provider_user_id),
        KEY idx_union_id (union_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sms_verification_codes (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        purpose VARCHAR(20) NOT NULL,
        code_hash CHAR(64) NOT NULL,
        attempt_count TINYINT UNSIGNED DEFAULT 0,
        expires_at DATETIME NOT NULL,
        consumed_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_sms_lookup (phone, purpose, created_at),
        KEY idx_sms_expiry (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS couple_calm_modes (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        requested_by INT NOT NULL,
        partner_id INT NOT NULL,
        accepted_by INT DEFAULT NULL,
        status ENUM('pending','active','ended') DEFAULT 'pending',
        ends_at DATETIME NOT NULL,
        accepted_at DATETIME DEFAULT NULL,
        ended_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'text',
        content LONGTEXT NOT NULL,
        metadata JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at DATETIME DEFAULT NULL,
        KEY idx_chat_conversation (sender_id, receiver_id, id),
        KEY idx_chat_receiver (receiver_id, read_at),
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS call_records (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        caller_id INT NOT NULL,
        receiver_id INT NOT NULL,
        call_type ENUM('voice','video') NOT NULL,
        status ENUM('ringing','active','ended','rejected','missed','failed') NOT NULL DEFAULT 'ringing',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        answered_at DATETIME DEFAULT NULL,
        ended_at DATETIME DEFAULT NULL,
        duration_seconds INT UNSIGNED NOT NULL DEFAULT 0,
        KEY idx_call_user_time (caller_id, receiver_id, id),
        KEY idx_call_receiver_status (receiver_id, status),
        FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sharing_preferences (
        user_id INT PRIMARY KEY,
        share_anniversary BOOLEAN NOT NULL DEFAULT TRUE,
        share_wishes BOOLEAN NOT NULL DEFAULT TRUE,
        share_plans BOOLEAN NOT NULL DEFAULT TRUE,
        share_fund BOOLEAN NOT NULL DEFAULT TRUE,
        share_photos BOOLEAN NOT NULL DEFAULT TRUE,
        share_diary BOOLEAN NOT NULL DEFAULT FALSE,
        share_mood BOOLEAN NOT NULL DEFAULT FALSE,
        share_checkin BOOLEAN NOT NULL DEFAULT TRUE,
        share_location BOOLEAN NOT NULL DEFAULT FALSE,
        share_device_activity BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const [deviceActivityColumns] = await connection.execute(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sharing_preferences' AND COLUMN_NAME = 'share_device_activity'`,
      [process.env.DB_NAME]
    );
    if (deviceActivityColumns.length === 0) {
      await connection.execute(
        'ALTER TABLE sharing_preferences ADD COLUMN share_device_activity BOOLEAN NOT NULL DEFAULT FALSE AFTER share_location'
      );
    }
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS couple_shared_state (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_low_id INT NOT NULL,
        user_high_id INT NOT NULL,
        module_key VARCHAR(30) NOT NULL,
        payload LONGTEXT NOT NULL,
        updated_by INT NOT NULL,
        version INT NOT NULL DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_couple_module (user_low_id, user_high_id, module_key),
        FOREIGN KEY (user_low_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user_high_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Mobile authentication migration completed.');
  } finally {
    await connection.end();
  }
};

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
