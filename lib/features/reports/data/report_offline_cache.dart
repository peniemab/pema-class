import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Enveloppe du dernier rapport financier / annuaire chargé en ligne.
class CachedFinancialEnvelope {
  CachedFinancialEnvelope({
    required this.academicYear,
    required this.savedAt,
    required this.report,
  });

  final String academicYear;
  final DateTime savedAt;
  final Map<String, dynamic> report;

  Map<String, dynamic> toJson() => {
        'academicYear': academicYear,
        'savedAt': savedAt.toIso8601String(),
        'report': report,
      };

  static CachedFinancialEnvelope? fromJsonString(String raw) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map) return null;
      final year = decoded['academicYear'];
      final saved = decoded['savedAt'];
      final rep = decoded['report'];
      if (year is! String || saved is! String || rep is! Map) return null;
      final repMap = rep;
      return CachedFinancialEnvelope(
        academicYear: year,
        savedAt: DateTime.tryParse(saved) ?? DateTime.fromMillisecondsSinceEpoch(0),
        report: Map<String, dynamic>.from(repMap),
      );
    } catch (_) {
      return null;
    }
  }
}

/// Cache local du rapport (élèves + agrégats) pour usage hors ligne.
class ReportOfflineCache {
  static const _envelopeKey = 'offline_financial_report_envelope_v1';
  static const _quickYearKey = 'offline_financial_report_last_year_v1';

  static Future<void> save({
    required String academicYear,
    required Map<String, dynamic> report,
  }) async {
    final p = await SharedPreferences.getInstance();
    final env = CachedFinancialEnvelope(
      academicYear: academicYear,
      savedAt: DateTime.now(),
      report: report,
    );
    await p.setString(_envelopeKey, jsonEncode(env.toJson()));
    await p.setString(_quickYearKey, academicYear);
  }

  static Future<CachedFinancialEnvelope?> load() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getString(_envelopeKey);
    if (raw == null || raw.isEmpty) return null;
    return CachedFinancialEnvelope.fromJsonString(raw);
  }

  /// Année scolaire du dernier cache (libellé affiché PDF / libellés).
  static Future<String?> lastAcademicYear() async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_quickYearKey);
  }
}
