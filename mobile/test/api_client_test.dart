import 'package:flutter_test/flutter_test.dart';
import 'package:reliefnexus_mobile/core/network/api_client.dart';

void main() {
  group('API Client Integration Tests', () {
    test('creates API client with configured Dio instance', () {
      final client = ApiClient();

      expect(client.dio, isNotNull);
      expect(client.dio.options.baseUrl, contains('/api'));
      expect(client.dio.options.connectTimeout, isNotNull);
      expect(client.dio.options.receiveTimeout, isNotNull);
    });

    test('API client uses JSON request headers', () {
      final client = ApiClient();

      expect(
        client.dio.options.headers['Content-Type'],
        equals('application/json'),
      );

      expect(
        client.dio.options.headers['Accept'],
        equals('application/json'),
      );
    });
  });
}
