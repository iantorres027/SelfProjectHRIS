#See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
RUN apt-get update && \
    apt-get install -y libc6 -f -o APT::Immediate-Configure=0 && \
    apt-get install -y \
        libgdiplus \
        libicu-dev \
        libharfbuzz0b \
        libfontconfig1 \
        libfreetype6 \
        libpango-1.0-0 \
        libpangocairo-1.0
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src
COPY ["src/Web/NuGet.config", "src/Web/"]
COPY ["src/Web/Template.Web.csproj", "src/Web/"]
COPY ["src/Application/Template.Application.csproj", "src/Application/"]
COPY ["src/Infrastructure/Template.Infrastructure.csproj", "src/Infrastructure/"]
COPY ["src/Domain/Template.Domain.csproj", "src/Domain/"]
RUN dotnet restore "src/Web/Template.Web.csproj"
COPY . .
WORKDIR "/src/src/Web"
RUN dotnet build "Template.Web.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Template.Web.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Template.Web.dll"]