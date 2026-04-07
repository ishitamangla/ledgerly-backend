# 🏦 Ledgerly Backend

> **Ledgerly** - Production-ready Node.js & MongoDB backend for secure financial ledger management with double-entry accounting, atomic transactions, and email notifications.

## 🚀 Project Overview

**Ledgerly-Backend** is a robust REST API for managing user accounts, transactions, and financial ledgers with enterprise-grade patterns:

- **Double-entry ledger system** (DEBIT + CREDIT entries per transaction)
- **Atomic transactions** using MongoDB sessions  
- **Idempotency keys** for safe retries
- **Email notifications** on transaction completion
- **JWT authentication** with secure HTTP-only cookies


## 🔧 Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js  |
| **Framework** | Express.js  |
| **Database** | MongoDB + Mongoose  |
| **Auth** | JWT + bcryptjs + cookie-parser |
| **Email** | Nodemailer |
| **Dev** | Nodemon |

## ✨ Core Features

### 1. **Double-Entry Ledger**
Every transaction → 2 ledger entries:
- ✅ DEBIT: Sender account (-amount)
- ✅ CREDIT: Receiver account (+amount)
- ✅ Balance = SUM(ledger entries)


### 2. **Atomic Transaction Flow (10 Steps)**
- 1.Validate params
- 2.Check idempotency key
- 3.Verify account status (ACTIVE)
- 4.Calculate sender balance (ledger sum)
- 5.Create transaction (PENDING)
- 6.Create DEBIT ledger entry
- 7.Create CREDIT ledger entry
- 8.Mark transaction COMPLETED
- 9.Commit MongoDB session (atomic)
- 10.Send email 

### 3. Smart Idempotency Strategy

**Zero duplicate transactions, even with network failures or double-clicks!**

### 🎯 User Transactions (Frontend Controls)
- ✅PENDING → "Already in progress" (HTTP 200)
- ✅COMPLETED → "Already done" (HTTP 200)
- ✅FAILED → Frontend sends NEW idempotency key to retry

### 🤖 System Transactions (Backend Auto-Handles)
- ✅FAILED → Backend marks PENDING + auto-retries
Frontend NEVER needs new key


### 4. Race Condition Protection
- ✅ MongoDB Sessions = Atomic (all or nothing)
- ✅ E11000 duplicate key error = Final safety net
- ✅ Same transaction NEVER runs twice


### 5. 🧪 Testing Strategy
- ✅ Artificial delays simulate concurrent requests
- ✅ MongoDB sessions ensure atomicity
- ✅ Idempotency prevents double-spend
- ✅ Balance calculated from ledger sum (not stored)


## 6.🔒 Security Features
- ✅ HTTP-only JWT cookies
- ✅ Bcrypt password hashing
- ✅ MongoDB atomic transactions
- ✅ Input validation middleware ready
- ✅ JWT blacklist on logout
- ✅ E11000 duplicate protection


## 7.🚀 Quick Start

### 1. **Google Cloud Setup**
- console.cloud.google.com → New Project
- → APIs & Services → OAuth consent screen → External → Save
- → Credentials → Create Credentials → OAuth client ID

### 2. **OAuth Playground**
- oauthplayground → Paste credentials → Scope: Gmail API v1 then https://mail.google.com/
- → Authorize → Exchange tokens → Copy REFRESH_TOKEN

### 3. **Run**
```bash
git clone https://github.com/ishitamangla/ledgerly-backend.git
cd ledgerly-backend
npm install
cp .env.example .env

# .env:
MONGO_URI=...
JWT_SECRET=...
EMAIL_USER=your@gmail.com
CLIENT_ID=...
CLIENT_SECRET=...
REFRESH_TOKEN=...

npm run dev
```

**✅ Server: `localhost:3000`** ✅

## 📌 API Endpoints
- Auth: POST /api/auth/register, /login, /logout
- Accounts: POST/GET /api/accounts, GET /api/accounts/balance/:id 🔐
- Transactions: POST /api/transactions, /system 🔐



## 📄 License
MIT
