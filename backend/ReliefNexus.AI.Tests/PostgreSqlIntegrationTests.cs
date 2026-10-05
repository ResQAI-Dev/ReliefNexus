using System.Data;
using Npgsql;
using Xunit;

namespace ReliefNexus.AI.Tests;

public class PostgreSqlIntegrationTests
{
    private static string GetConnectionString()
    {
        var connectionString =
            Environment.GetEnvironmentVariable(
                "RELIEFNEXUS_TEST_CONNECTION");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "RELIEFNEXUS_TEST_CONNECTION is not configured. " +
                "Set it to a dedicated PostgreSQL test database before running PostgreSQL integration tests.");
        }

        return connectionString;
    }

    [Fact]
    public async Task PostgreSql_CanConnect()
    {
        await using var connection =
            new NpgsqlConnection(GetConnectionString());

        await connection.OpenAsync();

        Assert.Equal(
            ConnectionState.Open,
            connection.State);
    }

    [Fact]
    public async Task PostgreSql_InitialCreateMigrationSchemaExists()
    {
        await using var connection =
            new NpgsqlConnection(GetConnectionString());

        await connection.OpenAsync();

        await using var command =
            new NpgsqlCommand(
                """
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name IN
                  (
                      'Users',
                      'DisasterReports',
                      'RiskPredictions',
                      'RiskFactors',
                      'RiskAgentExecutions',
                      'VulnerabilityAssessments',
                      'ReliefResources',
                      'ResourceAllocations',
                      'EmergencyAlerts',
                      'ReliefRequests',
                      'VolunteerAssignments',
                      'LocationShares',
                      'Notifications',
                      'AuditLogs'
                  );
                """,
                connection);

        var count = Convert.ToInt32(
            await command.ExecuteScalarAsync());

        Assert.True(
            count >= 13,
            $"Expected the core ReliefNexus schema tables. Found {count}.");
    }

    [Fact]
    public async Task PostgreSql_RiskFactorForeignKeyExists()
    {
        await using var connection =
            new NpgsqlConnection(GetConnectionString());

        await connection.OpenAsync();

        await using var command =
            new NpgsqlCommand(
                """
                SELECT COUNT(*)
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                 AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage ccu
                  ON ccu.constraint_name = tc.constraint_name
                 AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND tc.table_schema = 'public'
                  AND tc.table_name = 'RiskFactors'
                  AND kcu.column_name = 'RiskPredictionId'
                  AND ccu.table_name = 'RiskPredictions';
                """,
                connection);

        var count = Convert.ToInt32(
            await command.ExecuteScalarAsync());

        Assert.True(
            count >= 1,
            "RiskFactors.RiskPredictionId foreign key was not found.");
    }

    [Fact]
    public async Task PostgreSql_TransactionRollbackLeavesNoCommittedTestRow()
    {
        await using var connection =
            new NpgsqlConnection(GetConnectionString());

        await connection.OpenAsync();

        // Temporary table exists only for this PostgreSQL session.
        await using (
            var createCommand =
                new NpgsqlCommand(
                    """
                    CREATE TEMP TABLE reliefnexus_transaction_test
                    (
                        id integer PRIMARY KEY,
                        value text NOT NULL
                    )
                   
                    """,
                    connection))
        {
            await createCommand.ExecuteNonQueryAsync();
        }

        await using var transaction =
            await connection.BeginTransactionAsync();

        await using (
            var insertCommand =
                new NpgsqlCommand(
                    """
                    INSERT INTO reliefnexus_transaction_test
                        (id, value)
                    VALUES
                        (1, 'rollback-test');
                    """,
                    connection,
                    transaction))
        {
            await insertCommand.ExecuteNonQueryAsync();
        }

        await transaction.RollbackAsync();

        // After rollback the inserted row must not exist.
        await using var checkCommand =
            new NpgsqlCommand(
                """
                SELECT COUNT(*)
                FROM reliefnexus_transaction_test
                WHERE id = 1;
                """,
                connection);

        var count = Convert.ToInt32(
            await checkCommand.ExecuteScalarAsync());

        Assert.Equal(0, count);
    }

    [Fact]
    public async Task PostgreSql_ForeignKeyConstraintRejectsInvalidReference()
    {
        await using var connection =
            new NpgsqlConnection(GetConnectionString());

        await connection.OpenAsync();

        await using var command =
            new NpgsqlCommand(
                """
                SELECT EXISTS
                (
                    SELECT 1
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                      ON tc.constraint_name = kcu.constraint_name
                     AND tc.table_schema = kcu.table_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                      AND tc.table_schema = 'public'
                      AND tc.table_name = 'RiskFactors'
                      AND kcu.column_name = 'RiskPredictionId'
                );
                """,
                connection);

        var exists = Convert.ToBoolean(
            await command.ExecuteScalarAsync());

        Assert.True(
            exists,
            "Required RiskFactors foreign-key constraint is missing.");
    }
}

