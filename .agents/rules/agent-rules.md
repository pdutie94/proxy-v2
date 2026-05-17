---
trigger: always_on
---

# 🚀 ANTIGRAVITY PROJECT RULES & WORKFLOW (MVP)

## Stack

- Next.js 16
- React 19
- TypeScript 5.8+
- Tailwind CSS v4 & HeroUI
- Prisma 6
- MySQL 8
- Auth.js v5
- HeroUI (React Components) & Lucide Icons (Dần di chuyển và thay thế hoàn toàn Shopify Polaris)
- Zustand
- Zod
- React Hook Form
- TanStack Query v5
- Redis
- BullMQ

---

# 1. PROJECT GOAL

Xây dựng MVP hệ thống quản lý proxy:

- Login / Authentication
- User management
- Server management
- SSH setup server
- Proxy management
- Rotate proxy
- Expiration system
- Basic settings
- Dashboard admin

---

# 2. MVP PRINCIPLES

## ƯU TIÊN

- Đơn giản
- Dễ maintain
- Dễ iterate
- Dễ debug
- Đủ ổn định để chạy production nhỏ

---

## KHÔNG ƯU TIÊN

- Microservices
- Kubernetes-level orchestration
- Distributed systems complexity
- Realtime phức tạp
- Event-driven architecture
- Multi-region
- Billing
- Docker/K8s giai đoạn đầu

---

# 3. ARCHITECTURE

## Core Architecture

```txt
Next.js App
    ↓
API Routes
    ↓
BullMQ Queue
    ↓
Worker Process
    ↓
SSH Service
    ↓
Remote Servers
```

---

## Responsibilities

### Next.js Runtime

Chỉ xử lý:

- UI
- Authentication
- Validation
- CRUD metadata
- Dispatch jobs vào queue

KHÔNG:

- SSH trực tiếp
- Long-running jobs
- Rotation execution

---

### Worker Runtime

Xử lý:

- SSH execution
- Setup server
- Provision proxy
- Rotate proxy
- Expiration jobs

---

# 4. GLOBAL ARCHITECTURE RULES

## 4.1 BẮT BUỘC

### Không viết business logic trực tiếp trong:

- page.tsx
- route.ts
- component

---

## Route handlers chỉ:

- validate
- auth check
- gọi service
- enqueue jobs

---

## Worker xử lý:

- SSH
- long-running tasks
- provisioning
- rotation

---

# 5. TYPESCRIPT RULES

## STRICT MODE

```json
{
	"strict": true
}
```

---

## KHÔNG DÙNG

- any
- ts-ignore
- unknown bừa bãi

---

## PHẢI DÙNG

- interface
- type
- enum
- zod schema

---

# 6. DATABASE RULES

## Prisma only

KHÔNG:

- raw SQL trừ khi bắt buộc

---

## Mọi table phải có:

```txt
id
createdAt
updatedAt
```

---

## Datetime

- UTC only

---

# 7. API RULES

## Response format

```ts
{
  success: boolean
  message?: string
  data?: unknown
}
```

---

## Error format

```ts
{
  success: false,
  message: string
}
```

---

# 8. AUTH RULES

## Auth.js v5

Role:

- ADMIN
- USER

---

## Middleware

Protect:

- dashboard routes
- api routes

---

# 9. PACKAGE RULES

## Luôn dùng stable major mới nhất

---

## Core

```bash
next@latest
react@latest
react-dom@latest
typescript@latest
```

---

## Database

```bash
prisma@latest
@prisma/client@latest
mysql2@latest
```

---

## Auth

```bash
next-auth@beta
```

---

## Queue

```bash
bullmq
ioredis
```

---

## Validation

```bash
zod
react-hook-form
@hookform/resolvers
```

---

## State

```bash
zustand
@tanstack/react-query
```

---

## SSH

```bash
ssh2
```

KHÔNG dùng:

- node-ssh

---

# 10. FOLDER STRUCTURE

```txt
src/
├── app/
├── components/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── servers/
│   ├── proxies/
│   ├── settings/
│   └── dashboard/
│
├── worker/
│   ├── jobs/
│   ├── queue/
│   └── ssh/
│
├── lib/
├── types/
├── hooks/
├── utils/
└── constants/
```

---

# 11. MODULE STRUCTURE

```txt
module-name/
├── components/
├── services/
├── repositories/
├── schemas/
├── types/
├── hooks/
└── utils/
```

---

# 12. DATABASE STRUCTURE

## USER

```txt
id
email
password
role
createdAt
updatedAt
```

---

## SERVER

```txt
id
name
host
port
username
passwordEncrypted
provider
status
maxProxies
notes
createdAt
updatedAt
```

---

## PROXY

```txt
id
serverId
port
username
password
ipv6
status
expiresAt
lastRotatedAt
createdAt
updatedAt
```

---

## SERVER_JOB

```txt
id
type
status
serverId
proxyId
logs
startedAt
finishedAt
createdAt
updatedAt
```

---

# 13. ENUMS

## USER ROLE

```txt
ADMIN
USER
```

---

## SERVER STATUS

```txt
PENDING
ONLINE
OFFLINE
ERROR
```

---

## PROXY STATUS

```txt
CREATING
ACTIVE
EXPIRED
ERROR
```

---

## JOB STATUS

```txt
WAITING
ACTIVE
COMPLETED
FAILED
```

---

# 14. SERVER WORKFLOW

## CREATE SERVER

```txt
dashboard
↓
save DB
↓
enqueue setup job
↓
worker SSH setup
↓
update status
```

---

## SETUP SERVER

```txt
1. connect SSH
2. upload scripts
3. install gost
4. setup systemd
5. verify service
6. update status
```

---

# 15. PROXY WORKFLOW

## CREATE PROXY

```txt
dashboard
↓
save DB
↓
enqueue provision job
↓
worker generate config
↓
upload config
↓
reload gost
↓
update status
```

---

## ROTATE PROXY

```txt
dashboard
↓
enqueue rotate job
↓
worker SSH execute
↓
update DB
```

---

## DELETE PROXY

```txt
dashboard
↓
remove DB
↓
enqueue sync job
↓
reload config
```

---

# 16. CONFIG MANAGEMENT RULES

## DB là source of truth

KHÔNG:

- edit config manual trên server

---

## Config workflow

```txt
generate config
↓
upload temp file
↓
replace config
↓
reload service
```

---

# 17. SSH RULES

## SSH chỉ chạy trong worker

KHÔNG chạy SSH trong:

- route handlers
- server actions
- page.tsx

---

## SSH service phải có:

- connection reuse
- timeout
- reconnect safe

---

## KHÔNG

connect/disconnect mỗi command.

---

# 18. QUEUE RULES

## BullMQ bắt buộc cho:

- setup server
- create proxy
- rotate proxy
- expiration cleanup

---

## KHÔNG chạy trực tiếp trong API request

---

# 19. LOCK RULES

## Basic Redis lock

Ví dụ:

```txt
lock:server:{id}
lock:proxy:{id}
```

---

## Chỉ cần:

- SETNX
- expiration timeout

KHÔNG cần Redlock giai đoạn MVP.

---

# 20. EXPIRATION SYSTEM

## BullMQ repeatable jobs

Ví dụ:

```txt
every 5 minutes
↓
find expired proxies
↓
disable/remove
```

---

# 21. LOGGING RULES

## PHẢI LOG

- login
- create server
- setup server
- create proxy
- rotate proxy
- delete proxy
- SSH errors

---

## Dùng

- pino

---

## Format

```txt
[TIME] [MODULE] MESSAGE
```

---

# 22. ERROR HANDLING RULES

## KHÔNG

```ts
catch (e) {}
```

---

## PHẢI

```ts
catch (error) {
  logger.error(error)
}
```

---

# 23. UI RULES

## Style

- simple
- clean
- minimal
- responsive

---

## KHÔNG

- heavy animation
- glassmorphism
- gradient lòe loẹt

---

## Sidebar

```txt
Dashboard
Servers
Proxies
Users
Logs
Settings
```

---

# 24. PERFORMANCE RULES

## PHẢI

- pagination
- lazy loading
- caching
- query invalidation

---

## KHÔNG

- fetch waterfall
- render huge table không pagination

---

# 25. SECURITY RULES

## PHẢI

- zod validation
- bcrypt password hashing
- middleware auth
- RBAC
- encrypt SSH password nếu lưu DB

---

## KHÔNG

- eval
- exec raw user input
- raw shell injection

---

# 26. ENV RULES

```env
DATABASE_URL=
REDIS_URL=
AUTH_SECRET=
AUTH_URL=
```

---

## KHÔNG hardcode

- passwords
- secrets
- IPs

---

# 27. CODING STYLE

## FILES

```txt
kebab-case
```

---

## COMPONENTS

```txt
PascalCase
```

---

## FUNCTIONS

```txt
camelCase
```

---

# 28. DEVELOPMENT PHASES

## PHASE 1

- next setup
- prisma
- mysql
- auth
- dashboard layout

---

## PHASE 2

- user CRUD
- server CRUD

---

## PHASE 3

- worker
- bullmq
- redis
- ssh service

---

## PHASE 4

- proxy CRUD
- provisioning

---

## PHASE 5

- rotation
- expiration

---

## PHASE 6

- logs
- dashboard polish

---

# 29. IMPORTANT

## MVP GOAL

Ưu tiên:

- ship nhanh
- stable
- maintainable

KHÔNG:

- overengineering
- enterprise abstractions
- premature optimization

---

# 30. PROJECT INIT

```bash
npx create-next-app@latest antigravity \
--typescript \
--tailwind \
--eslint \
--app \
--src-dir \
--use-npm
```

---

# 31. PACKAGE INSTALL

```bash
npm install prisma @prisma/client mysql2

npm install next-auth

npm install bullmq ioredis

npm install zod react-hook-form @hookform/resolvers

npm install zustand @tanstack/react-query

npm install ssh2

npm install bcryptjs

npm install clsx tailwind-merge class-variance-authority

npm install lucide-react

npm install date-fns

npm install sonner

npm install pino pino-pretty
```

---

# 32. DEV DEPENDENCIES

```bash
npm install -D \
@types/node \
@types/react \
@types/react-dom \
@types/bcryptjs
```
