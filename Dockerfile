FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/ReliefNexus.API/ReliefNexus.API.csproj backend/ReliefNexus.API/
RUN dotnet restore backend/ReliefNexus.API/ReliefNexus.API.csproj

COPY backend/ReliefNexus.API/ backend/ReliefNexus.API/

WORKDIR /src/backend/ReliefNexus.API
RUN dotnet publish ReliefNexus.API.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["sh", "-c", "dotnet ReliefNexus.API.dll --urls http://0.0.0.0:${PORT:-10000}"]
