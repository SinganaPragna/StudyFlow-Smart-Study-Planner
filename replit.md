# Smart Study Planner

A React study-planning application using this architecture:

```text
React.js frontend
  ↓ REST API
Spring Boot backend
  ↓ JPA / Hibernate
MySQL database
```

PostgreSQL is not used by the running application.

## Stack

- Frontend: React, Vite, Tailwind CSS, TanStack Query
- Backend: Java 17, Spring Boot
- Backend database layer: Spring Data JPA / Hibernate
- Database: MySQL
- Package manager for frontend workspace: pnpm

The React app is configured to call the Spring Boot backend on port `8090`.

## Why not `localhost:8080`?

If `http://localhost:8080` opens Jenkins, Jenkins is already using port `8080` on your computer.

So this project uses:

```text
React website:      http://localhost:5173
Spring Boot API:    http://localhost:8090/api
API health check:   http://localhost:8090/api/healthz
```

You normally open only the React website link:

```text
http://localhost:5173
```

The React app will call the Java backend automatically through Vite proxy.

## Run locally on Windows

### 1. Create the MySQL database

Start MySQL, open MySQL Workbench or the MySQL command-line client, and run:

```sql
CREATE DATABASE studyplanner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Install frontend packages

Open PowerShell in the project root:

```powershell
cd "C:\Users\admin\Downloads\Study-Wise-Planner (1)\Study-Wise-Planner"
corepack enable
pnpm install
```

If `pnpm install` says `sh` is not recognized on Windows, run only the install command from Git Bash:

```bash
pnpm install
```

Then come back to PowerShell for the remaining commands.

### 3. Start the Spring Boot backend

Open PowerShell in the project root:

```powershell
cd "C:\Users\admin\Downloads\Study-Wise-Planner (1)\Study-Wise-Planner\java-backend"
$env:MYSQL_URL="jdbc:mysql://localhost:3306/studyplanner?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:MYSQL_USER="root"
$env:MYSQL_PASSWORD="YOUR_PASSWORD"
$env:PORT="8090"
mvn spring-boot:run
```

If your MySQL root account has no password, use:

```powershell
$env:MYSQL_PASSWORD=""
```

Check backend is running:

```text
http://localhost:8090/api/healthz
```

### 4. Start and open the React website

Keep Spring Boot running. Open a second PowerShell window:

```powershell
cd "C:\Users\admin\Downloads\Study-Wise-Planner (1)\Study-Wise-Planner"
$env:PORT="5173"
$env:BASE_PATH="/"
pnpm --filter @workspace/study-planner run dev
```

Open this website link in your browser:

```text
http://localhost:5173
```

## Important files

- `artifacts/study-planner/vite.config.ts` - sends `/api` calls to Spring Boot on port `8090`
- `artifacts/study-planner/src/` - React frontend
- `java-backend/src/main/java/com/studyplanner/controller/` - Spring Boot REST APIs
- `java-backend/src/main/java/com/studyplanner/model/` - JPA entities
- `java-backend/src/main/java/com/studyplanner/repository/` - Spring Data JPA repositories
- `java-backend/src/main/resources/application.properties` - MySQL and server configuration

## Useful verification commands

```powershell
cd "C:\Users\admin\Downloads\Study-Wise-Planner (1)\Study-Wise-Planner\java-backend"
mvn test
```

```powershell
cd "C:\Users\admin\Downloads\Study-Wise-Planner (1)\Study-Wise-Planner"
pnpm --filter @workspace/study-planner run typecheck
```
