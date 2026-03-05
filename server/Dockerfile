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
