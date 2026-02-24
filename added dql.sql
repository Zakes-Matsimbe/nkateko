DROP TABLE IF EXISTS learner_term_marks;
-- Term open/close control
CREATE TABLE term_settings (
    term INT PRIMARY KEY,
    is_open BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO term_settings (term, is_open)
VALUES (1,false),(2,false),(3,false),(4,false)
ON CONFLICT DO NOTHING;


-- Learner term submissions
CREATE TABLE learner_term_marks (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    term INT NOT NULL,
    marks JSON NOT NULL,
    report_path TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, term)
);

UPDATE term_settings SET is_open = TRUE WHERE term = 2;

-- Reviews table
CREATE TABLE IF NOT EXISTS teacher_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    learner_id INT NOT NULL,
    staff_id INT NOT NULL,              -- references staff.id (teacher/tutor)
    subject VARCHAR(100) NOT NULL,      -- e.g. "Mathematics", "Physical Sciences"
    rating DECIMAL(3,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE RESTRICT
);

-- Settings table (toggle reviews open/closed)
CREATE TABLE IF NOT EXISTS review_settings (
    id INT PRIMARY KEY DEFAULT 1,
    is_open BOOLEAN DEFAULT TRUE,       -- start open
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default setting if missing
INSERT IGNORE INTO review_settings (id, is_open) VALUES (1, TRUE);

CREATE TABLE IF NOT EXISTS learner_warnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    learner_id INT NOT NULL,
    warning_type ENUM('Yellow', 'Red', 'Blue', 'Green') NOT NULL,  -- Yellow = medium, Red = high, etc.
    reason TEXT NOT NULL,                                          -- e.g. 'Low attendance in Term 1'
    severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP NULL DEFAULT NULL,                   -- when learner saw/confirmed it
    resolved_at TIMESTAMP NULL DEFAULT NULL,                       -- if/when issue fixed
    status ENUM('Active', 'Acknowledged', 'Resolved', 'Archived') DEFAULT 'Active',
    created_by INT NULL,                                           -- staff/admin who issued it (optional)
    FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES staff(id) ON DELETE SET NULL,
    INDEX idx_learner_active (learner_id, status)
);