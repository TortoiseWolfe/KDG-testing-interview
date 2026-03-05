# Manual Setup — Rebuild From Scratch

Copy-paste each block in order. No AI or SDK required — just Docker and a terminal.

---

## 1. Project Skeleton

```bash
mkdir -p kdg/{server/src/KdgApi/{Models,Data,Controllers},server/tests/KdgApi.Tests,client/src/{components/__tests__,services/__tests__,types},scripts,loadtest,e2e,context}
cd kdg
git init
```

## 2. Root Config

```bash
cat <<'EOF' > .env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=kdgdb
EOF
```

```bash
cat <<'EOF' > .gitignore
node_modules/
dist/
bin/
obj/
.env
.vs/
.vscode/
*.user
*.suo
TestResults/
coverage/
screenshots/
.DS_Store
Thumbs.db
EOF
```

```bash
cat <<'EOF' > compose.yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  api:
    build:
      context: ./server
      target: dev
    ports:
      - "5000:8080"
    environment:
      - ASPNETCORE_URLS=http://+:8080
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=db;Database=${POSTGRES_DB};Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD}
      - DOTNET_WATCH_SUPPRESS_MSBUILD_INCREMENTALISM=1
    volumes:
      - ./server:/app
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  api-tests:
    build:
      context: ./server
      target: test
    environment:
      - ConnectionStrings__DefaultConnection=Host=db;Database=${POSTGRES_DB};Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD}
    depends_on:
      db:
        condition: service_healthy
    profiles:
      - test

  client:
    build:
      context: ./client
      target: dev
    ports:
      - "3000:5173"
    volumes:
      - ./client:/app
      - /app/node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true
    depends_on:
      - api
    develop:
      watch:
        - action: rebuild
          path: package.json
        - action: sync
          path: ./src
          target: /app/src
    restart: unless-stopped

  client-tests:
    build:
      context: ./client
      target: test
    profiles:
      - test

  k6:
    image: grafana/k6:latest
    volumes:
      - ./loadtest:/scripts
    network_mode: "host"
    profiles:
      - test

  e2e-tests:
    image: mcr.microsoft.com/playwright:v1.52.0-noble
    working_dir: /e2e
    volumes:
      - ./e2e:/e2e
    network_mode: "host"
    entrypoint: ["npx", "playwright", "test"]
    depends_on:
      - client
    profiles:
      - test

volumes:
  pgdata:
EOF
```

## 3. Backend — .NET API

### Dockerfile

```bash
cat <<'EOF' > server/Dockerfile
# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS base
WORKDIR /app
COPY KdgApi.sln .
COPY src/KdgApi/KdgApi.csproj src/KdgApi/
COPY tests/KdgApi.Tests/KdgApi.Tests.csproj tests/KdgApi.Tests/
RUN dotnet restore

FROM base AS dev
COPY . .
WORKDIR /app/src/KdgApi
ENV DOTNET_WATCH_SUPPRESS_MSBUILD_INCREMENTALISM=1
ENTRYPOINT ["dotnet", "watch", "run", "--urls", "http://+:8080"]

FROM base AS test
COPY . .
WORKDIR /app/tests/KdgApi.Tests
ENTRYPOINT ["dotnet", "test", "--logger", "console;verbosity=detailed"]
EOF
```

```bash
cat <<'EOF' > server/.dockerignore
bin/
obj/
*.user
*.suo
TestResults/
.vs/
EOF
```

### Solution file

```bash
cat <<'EOF' > server/KdgApi.sln
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
MinimumVisualStudioVersion = 10.0.40219.1
Project("{2150E333-8FDC-42A3-9474-1A3956D46DE8}") = "src", "src", "{679C0D25-D88F-49D6-8DEC-A14A9B07D722}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "KdgApi", "src\KdgApi\KdgApi.csproj", "{E9C95B97-96A8-41DF-BDE3-2C492A3FFE80}"
EndProject
Project("{2150E333-8FDC-42A3-9474-1A3956D46DE8}") = "tests", "tests", "{3480273E-3676-4421-A0B6-987D851BF005}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "KdgApi.Tests", "tests\KdgApi.Tests\KdgApi.Tests.csproj", "{9857E875-8B45-4B17-B51B-14CB397929C6}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{E9C95B97-96A8-41DF-BDE3-2C492A3FFE80}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{E9C95B97-96A8-41DF-BDE3-2C492A3FFE80}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{E9C95B97-96A8-41DF-BDE3-2C492A3FFE80}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{E9C95B97-96A8-41DF-BDE3-2C492A3FFE80}.Release|Any CPU.Build.0 = Release|Any CPU
		{9857E875-8B45-4B17-B51B-14CB397929C6}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{9857E875-8B45-4B17-B51B-14CB397929C6}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{9857E875-8B45-4B17-B51B-14CB397929C6}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{9857E875-8B45-4B17-B51B-14CB397929C6}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
	GlobalSection(NestedProjects) = preSolution
		{E9C95B97-96A8-41DF-BDE3-2C492A3FFE80} = {679C0D25-D88F-49D6-8DEC-A14A9B07D722}
		{9857E875-8B45-4B17-B51B-14CB397929C6} = {3480273E-3676-4421-A0B6-987D851BF005}
	EndGlobalSection
EndGlobal
EOF
```

### Project file

```bash
cat <<'EOF' > server/src/KdgApi/KdgApi.csproj
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.24" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.11">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.11" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.6.2" />
  </ItemGroup>

</Project>
EOF
```

### Source files

```bash
cat <<'EOF' > server/src/KdgApi/Program.cs
using Microsoft.EntityFrameworkCore;
using KdgApi.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.Run();
EOF
```

```bash
cat <<'EOF' > server/src/KdgApi/appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=db;Database=kdgdb;Username=postgres;Password=postgres"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
EOF
```

```bash
cat <<'EOF' > server/src/KdgApi/appsettings.Development.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}
EOF
```

```bash
cat <<'EOF' > server/src/KdgApi/Models/Customer.cs
using System.ComponentModel.DataAnnotations;

namespace KdgApi.Models;

public class Customer
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
EOF
```

```bash
cat <<'EOF' > server/src/KdgApi/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;
using KdgApi.Models;

namespace KdgApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Customer> Customers { get; set; }
}
EOF
```

```bash
cat <<'EOF' > server/src/KdgApi/Controllers/CustomersController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KdgApi.Data;
using KdgApi.Models;

namespace KdgApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _context;

    public CustomersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<Customer>>> GetAll()
    {
        return await _context.Customers.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Customer>> GetById(int id)
    {
        var customer = await _context.Customers.FindAsync(id);
        if (customer == null) return NotFound();
        return customer;
    }

    [HttpPost]
    public async Task<ActionResult<Customer>> Create(Customer customer)
    {
        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Customer customer)
    {
        if (id != customer.Id) return BadRequest();
        _context.Entry(customer).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var customer = await _context.Customers.FindAsync(id);
        if (customer == null) return NotFound();
        _context.Customers.Remove(customer);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
EOF
```

### Backend tests

```bash
cat <<'EOF' > server/tests/KdgApi.Tests/KdgApi.Tests.csproj
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="coverlet.collector" Version="6.0.0" />
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.0.11" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="8.0.11" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.8.0" />
    <PackageReference Include="xunit" Version="2.5.3" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.5.3" />
  </ItemGroup>

  <ItemGroup>
    <Using Include="Xunit" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\src\KdgApi\KdgApi.csproj" />
  </ItemGroup>

</Project>
EOF
```

```bash
cat <<'EOF' > server/tests/KdgApi.Tests/UnitTest1.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KdgApi.Controllers;
using KdgApi.Data;
using KdgApi.Models;

namespace KdgApi.Tests;

public class CustomersControllerTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetAll_ReturnsEmptyList_WhenNoCustomers()
    {
        using var context = CreateContext(nameof(GetAll_ReturnsEmptyList_WhenNoCustomers));
        var controller = new CustomersController(context);

        var result = await controller.GetAll();

        Assert.NotNull(result.Value);
        Assert.Empty(result.Value);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenCustomerDoesNotExist()
    {
        using var context = CreateContext(nameof(GetById_ReturnsNotFound_WhenCustomerDoesNotExist));
        var controller = new CustomersController(context);

        var result = await controller.GetById(999);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedCustomer_WithGeneratedId()
    {
        using var context = CreateContext(nameof(Create_ReturnsCreatedCustomer_WithGeneratedId));
        var controller = new CustomersController(context);
        var customer = new Customer { Name = "Jane Doe", Email = "jane@example.com" };

        var result = await controller.Create(customer);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returned = Assert.IsType<Customer>(created.Value);
        Assert.Equal("Jane Doe", returned.Name);
        Assert.Equal("jane@example.com", returned.Email);
        Assert.True(returned.Id > 0);
    }

    [Fact]
    public async Task Update_ReturnsNoContent_WhenCustomerExists()
    {
        using var context = CreateContext(nameof(Update_ReturnsNoContent_WhenCustomerExists));
        var controller = new CustomersController(context);
        var customer = new Customer { Name = "Jane Doe", Email = "jane@example.com" };
        context.Customers.Add(customer);
        await context.SaveChangesAsync();

        customer.Name = "Jane Smith";
        var result = await controller.Update(customer.Id, customer);

        Assert.IsType<NoContentResult>(result);
        var updated = await context.Customers.FindAsync(customer.Id);
        Assert.Equal("Jane Smith", updated!.Name);
    }

    [Fact]
    public async Task Update_ReturnsBadRequest_WhenIdMismatch()
    {
        using var context = CreateContext(nameof(Update_ReturnsBadRequest_WhenIdMismatch));
        var controller = new CustomersController(context);
        var customer = new Customer { Id = 1, Name = "Jane Doe", Email = "jane@example.com" };

        var result = await controller.Update(999, customer);

        Assert.IsType<BadRequestResult>(result);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent_WhenCustomerExists()
    {
        using var context = CreateContext(nameof(Delete_ReturnsNoContent_WhenCustomerExists));
        var controller = new CustomersController(context);
        var customer = new Customer { Name = "Jane Doe", Email = "jane@example.com" };
        context.Customers.Add(customer);
        await context.SaveChangesAsync();

        var result = await controller.Delete(customer.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.Null(await context.Customers.FindAsync(customer.Id));
    }

    [Fact]
    public async Task Delete_ReturnsNotFound_WhenCustomerDoesNotExist()
    {
        using var context = CreateContext(nameof(Delete_ReturnsNotFound_WhenCustomerDoesNotExist));
        var controller = new CustomersController(context);

        var result = await controller.Delete(999);

        Assert.IsType<NotFoundResult>(result);
    }
}
EOF
```

## 4. Frontend — React + TypeScript

### Dockerfile

```bash
cat <<'EOF' > client/Dockerfile
# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
USER node
WORKDIR /app

FROM base AS deps
COPY --chown=node:node package.json package-lock.json* ./
RUN npm ci

FROM base AS dev
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .
EXPOSE 5173
CMD ["npx", "vite", "--host", "0.0.0.0"]

FROM base AS test
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .
CMD ["npx", "vitest", "run"]
EOF
```

### package.json and install

```bash
cat <<'EOF' > client/package.json
{
  "name": "client-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^24.10.1",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "jsdom": "^28.1.0",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.48.0",
    "vite": "^7.3.1",
    "vitest": "^4.0.18"
  }
}
EOF

cd client && npm install && cd ..
```

### Config files

```bash
cat <<'EOF' > client/index.html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>client-app</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF
```

```bash
cat <<'EOF' > client/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://api:8080',
        changeOrigin: true,
      },
    },
  },
})
EOF
```

```bash
cat <<'EOF' > client/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
})
EOF
```

```bash
cat <<'EOF' > client/tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
EOF
```

```bash
cat <<'EOF' > client/tsconfig.app.json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
EOF
```

```bash
cat <<'EOF' > client/tsconfig.node.json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
EOF
```

```bash
cat <<'EOF' > client/eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
EOF
```

### Source files

```bash
cat <<'EOF' > client/src/setupTests.ts
import '@testing-library/jest-dom'
EOF
```

```bash
cat <<'EOF' > client/src/vite-env.d.ts
/// <reference types="vite/client" />
EOF
```

```bash
cat <<'EOF' > client/src/index.css
:root {
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
}
EOF
```

```bash
cat <<'EOF' > client/src/App.css
#root {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  margin-bottom: 1.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th,
td {
  text-align: left;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #333;
}

th {
  font-weight: 600;
  border-bottom-width: 2px;
}

tbody tr:nth-child(even) {
  background-color: rgba(255, 255, 255, 0.04);
}

@media (prefers-color-scheme: light) {
  th, td { border-bottom-color: #ddd; }
  tbody tr:nth-child(even) { background-color: rgba(0, 0, 0, 0.03); }
}
EOF
```

```bash
cat <<'EOF' > client/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
EOF
```

```bash
cat <<'EOF' > client/src/App.tsx
import { CustomerList } from './components/CustomerList'
import './App.css'

function App() {
  return (
    <>
      <h1>KDG Customers</h1>
      <CustomerList />
    </>
  )
}

export default App
EOF
```

```bash
cat <<'EOF' > client/src/types/Customer.ts
export interface Customer {
  id: number
  name: string
  email: string
  createdAt: string
}
EOF
```

```bash
cat <<'EOF' > client/src/services/customerService.ts
import type { Customer } from '../types/Customer'

const API_BASE = '/api/customers'

export async function getCustomers(): Promise<Customer[]> {
  const response = await fetch(API_BASE)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

export async function createCustomer(
  customer: Omit<Customer, 'id' | 'createdAt'>
): Promise<Customer> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}
EOF
```

```bash
cat <<'EOF' > client/src/components/CustomerList.tsx
import { useEffect, useState } from 'react'
import { getCustomers } from '../services/customerService'
import type { Customer } from '../types/Customer'

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {customers.map((c) => (
          <tr key={c.id}>
            <td>{c.name}</td>
            <td>{c.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
EOF
```

### Frontend tests

```bash
cat <<'EOF' > client/src/components/__tests__/CustomerList.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomerList } from '../CustomerList'

describe('CustomerList', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {})
    )
    render(<CustomerList />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders customers after fetch', async () => {
    const mockCustomers = [
      { id: 1, name: 'Jane Doe', email: 'jane@example.com', createdAt: '2026-01-01' },
      { id: 2, name: 'John Smith', email: 'john@example.com', createdAt: '2026-01-02' },
    ]

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCustomers),
    } as Response)

    render(<CustomerList />)

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.getByText('John Smith')).toBeInTheDocument()
    })
  })

  it('renders error message when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network failure'))

    render(<CustomerList />)

    await waitFor(() => {
      expect(screen.getByText('Error: Network failure')).toBeInTheDocument()
    })
  })
})
EOF
```

```bash
cat <<'EOF' > client/src/services/__tests__/customerService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCustomers, createCustomer } from '../customerService'

describe('customerService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('getCustomers', () => {
    it('returns parsed customer array on success', async () => {
      const mockData = [{ id: 1, name: 'Jane', email: 'jane@test.com', createdAt: '2026-01-01' }]
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response)

      const result = await getCustomers()

      expect(result).toEqual(mockData)
      expect(fetch).toHaveBeenCalledWith('/api/customers')
    })

    it('throws on non-OK response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
      } as Response)

      await expect(getCustomers()).rejects.toThrow('HTTP 500')
    })
  })

  describe('createCustomer', () => {
    it('sends POST with correct body and returns customer', async () => {
      const input = { name: 'Jane', email: 'jane@test.com' }
      const mockResponse = { id: 1, ...input, createdAt: '2026-01-01' }
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await createCustomer(input)

      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
    })

    it('throws on non-OK response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 400,
      } as Response)

      await expect(createCustomer({ name: '', email: '' })).rejects.toThrow('HTTP 400')
    })
  })
})
EOF
```

## 5. Scripts & Testing

### Seed script

```bash
cat <<'SEEDEOF' > scripts/seed.sh
#!/bin/bash
API_URL="http://localhost:5000/api/customers"

FIRST_NAMES=("James" "Mary" "Robert" "Patricia" "John" "Jennifer" "Michael" "Linda" "David" "Elizabeth"
  "William" "Barbara" "Richard" "Susan" "Joseph" "Jessica" "Thomas" "Sarah" "Christopher" "Karen"
  "Charles" "Lisa" "Daniel" "Nancy" "Matthew" "Betty" "Anthony" "Margaret" "Mark" "Sandra"
  "Donald" "Ashley" "Steven" "Dorothy" "Andrew" "Kimberly" "Paul" "Emily" "Joshua" "Donna"
  "Kenneth" "Michelle" "Kevin" "Carol" "Brian" "Amanda" "George" "Melissa" "Timothy" "Deborah")

LAST_NAMES=("Smith" "Johnson" "Williams" "Brown" "Jones" "Garcia" "Miller" "Davis" "Rodriguez" "Martinez"
  "Hernandez" "Lopez" "Gonzalez" "Wilson" "Anderson" "Thomas" "Taylor" "Moore" "Jackson" "Martin"
  "Lee" "Perez" "Thompson" "White" "Harris" "Sanchez" "Clark" "Ramirez" "Lewis" "Robinson"
  "Walker" "Young" "Allen" "King" "Wright" "Scott" "Torres" "Nguyen" "Hill" "Flores"
  "Green" "Adams" "Nelson" "Baker" "Hall" "Rivera" "Campbell" "Mitchell" "Carter" "Roberts")

DOMAINS=("gmail.com" "yahoo.com" "outlook.com" "company.com" "example.com")

echo "Seeding 100 customers..."

for i in $(seq 1 100); do
  first=${FIRST_NAMES[$((RANDOM % ${#FIRST_NAMES[@]}))]}
  last=${LAST_NAMES[$((RANDOM % ${#LAST_NAMES[@]}))]}
  domain=${DOMAINS[$((RANDOM % ${#DOMAINS[@]}))]}
  email=$(echo "${first}.${last}${i}@${domain}" | tr '[:upper:]' '[:lower:]')

  response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${first} ${last}\",\"email\":\"${email}\"}")

  if [ "$response" = "201" ]; then
    printf "\r  %d/100 created" "$i"
  else
    printf "\r  %d/100 FAILED (HTTP %s)" "$i" "$response"
  fi
done

echo ""
echo "Done. Verify at $API_URL"
SEEDEOF

chmod +x scripts/seed.sh
```

### k6 load test

```bash
cat <<'EOF' > loadtest/script.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const listDuration = new Trend('list_customers_duration');
const getDuration = new Trend('get_customer_duration');
const createDuration = new Trend('create_customer_duration');

const BASE_URL = 'http://localhost:5000/api/customers';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    errors: ['rate<0.01'],
    list_customers_duration: ['p(95)<500'],
    get_customer_duration: ['p(95)<500'],
    create_customer_duration: ['p(95)<500'],
  },
};

export default function () {
  const listRes = http.get(BASE_URL);
  listDuration.add(listRes.timings.duration);
  const listOk = check(listRes, {
    'list: status 200': (r) => r.status === 200,
    'list: is array': (r) => Array.isArray(JSON.parse(r.body)),
  });
  errorRate.add(!listOk);

  const id = Math.floor(Math.random() * 100) + 1;
  const getRes = http.get(`${BASE_URL}/${id}`);
  getDuration.add(getRes.timings.duration);
  const getOk = check(getRes, {
    'get: status 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  errorRate.add(!getOk);

  const payload = JSON.stringify({
    name: `LoadTest User ${Date.now()}`,
    email: `load${Date.now()}@test.com`,
  });
  const createRes = http.post(BASE_URL, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  createDuration.add(createRes.timings.duration);
  const createOk = check(createRes, {
    'create: status 201': (r) => r.status === 201,
  });
  errorRate.add(!createOk);

  sleep(0.1);
}
EOF
```

### Playwright E2E

```bash
cat <<'EOF' > e2e/package.json
{
  "private": true,
  "devDependencies": {
    "@playwright/test": "1.52.0"
  }
}
EOF

cd e2e && npm install && cd ..
```

```bash
cat <<'EOF' > e2e/playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  use: { baseURL: 'http://localhost:3000' },
})
EOF
```

```bash
cat <<'EOF' > e2e/smoke.spec.ts
import { test, expect } from '@playwright/test'

test('homepage renders customer table with seeded data', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('KDG Customers')
  await expect(page.locator('table')).toBeVisible()
  const rows = page.locator('tbody tr')
  await expect(rows).toHaveCount(100)
})

test('table has Name and Email columns', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('th').nth(0)).toHaveText('Name')
  await expect(page.locator('th').nth(1)).toHaveText('Email')
})
EOF
```

## 6. Build & Run

```bash
docker compose up -d
```

Wait for all services to be healthy (~30s for first build):

```bash
docker compose ps
```

Seed the database:

```bash
bash scripts/seed.sh
```

## 7. Verify

```bash
# API returns customers
curl -s http://localhost:5000/api/customers | head -c 200

# Backend tests (7 passing)
docker compose --profile test run --rm api-tests

# Frontend tests (7 passing)
docker compose --profile test run --rm client-tests

# E2E smoke tests (2 passing)
docker compose --profile test run --rm e2e-tests

# Load test (10 VUs, 30s)
docker compose --profile test run --rm k6 run /scripts/script.js
```

Open in browser:
- Client: http://localhost:3000
- API: http://localhost:5000/api/customers
- Swagger: http://localhost:5000/swagger
