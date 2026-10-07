class AppException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic details;

  const AppException(
    this.message, {
    this.statusCode,
    this.details,
  });

  @override
  String toString() {
    if (statusCode == null) return message;
    return '$message (HTTP $statusCode)';
  }
}

class NetworkException extends AppException {
  const NetworkException(
    super.message, {
    super.statusCode,
    super.details,
  });
}

class UnauthorizedException extends AppException {
  const UnauthorizedException(
    super.message, {
    super.statusCode,
    super.details,
  });
}

class ForbiddenException extends AppException {
  const ForbiddenException(
    super.message, {
    super.statusCode,
    super.details,
  });
}

class ServerException extends AppException {
  const ServerException(
    super.message, {
    super.statusCode,
    super.details,
  });
}
