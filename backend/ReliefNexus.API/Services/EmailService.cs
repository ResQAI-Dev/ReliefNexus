using System.Net;
using System.Net.Mail;
using ReliefNexus.API.Interfaces;

namespace ReliefNexus.API.Services;

public class EmailService : IEmailService
{
    public async Task<bool> SendAsync(
        string to,
        string subject,
        string body)
    {
        var host = Environment.GetEnvironmentVariable("RELIEFNEXUS_SMTP_HOST");
        var portText = Environment.GetEnvironmentVariable("RELIEFNEXUS_SMTP_PORT");
        var username = Environment.GetEnvironmentVariable("RELIEFNEXUS_SMTP_USER");
        var password = Environment.GetEnvironmentVariable("RELIEFNEXUS_SMTP_PASSWORD");
        var from = Environment.GetEnvironmentVariable("RELIEFNEXUS_SMTP_FROM");

        if (string.IsNullOrWhiteSpace(host) ||
            string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(password) ||
            string.IsNullOrWhiteSpace(from))
        {
            Console.WriteLine(
                "[EMAIL] SMTP configuration is missing. Email was not sent.");

            return false;
        }

        var port = 587;

        if (!string.IsNullOrWhiteSpace(portText) &&
            int.TryParse(portText, out var parsedPort))
        {
            port = parsedPort;
        }

        try
        {
            using var client = new SmtpClient(host, port)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(
                    username,
                    password)
            };

            using var mail = new MailMessage
            {
                From = new MailAddress(from),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };

            mail.To.Add(to);

            await client.SendMailAsync(mail);

            Console.WriteLine(
                $"[EMAIL] Emergency report email sent to {to}");

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"[EMAIL] Failed to send email: {ex.Message}");

            return false;
        }
    }
}
