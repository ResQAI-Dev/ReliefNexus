class NumberUtils {
  const NumberUtils._();

  static String formatNumber(num value) {
    final raw = value.toString();
    final parts = raw.split('.');
    final integerPart = parts.first;
    final formattedInteger = integerPart.replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (match) => ',',
    );

    if (parts.length == 1) {
      return formattedInteger;
    }

    return '$formattedInteger.${parts[1]}';
  }
}
