export const PRESETS = {
  owasp: {
    language: 'javascript',
    fileName: 'login.js',
    code: `// Express.js Login Handler
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Vulnerable to SQL Injection
  const query = \`SELECT * FROM users WHERE username = '\${username}' AND password = '\${password}'\`;
  
  try {
    const result = await db.query(query);
    if (result.rows.length > 0) {
      res.status(200).json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;`,
    testCode: '',
  },
  soc2: {
    language: 'python',
    fileName: 'aws_uploader.py',
    code: `import boto3
import logging

# Hardcoded AWS Credentials (SOC2 Violation)
AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

def upload_user_data(user_id, email, password_hash, file_path):
    # Logging PII in plaintext (SOC2 Violation)
    logging.info(f"Uploading data for user {user_id} with email {email} and password {password_hash}")
    
    s3 = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY,
        region_name='us-east-1'
    )
    
    with open(file_path, 'rb') as f:
        s3.upload_fileobj(f, 'my-company-secure-bucket', f"{user_id}/data.bin")
        
    print("Upload complete")`,
    testCode: '',
  },
  tdd: {
    language: 'javascript',
    fileName: 'math.js',
    code: `/**
 * Adds two numbers together.
 */
function addNumbers(a, b) {
  // Deliberate bug for Autonomous TDD to fix
  return a - b;
}`,
    testCode: `expect(addNumbers(5, 5)).toEqual(10);\nexpect(addNumbers(-1, 1)).toEqual(0);`,
  }
};
