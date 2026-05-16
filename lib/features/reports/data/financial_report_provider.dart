import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/connectivity_providers.dart';
import '../../settings/presentation/screens/settings_screen.dart';
import 'report_offline_cache.dart';
import 'report_repository.dart';

final financialReportProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final repo = ref.watch(reportRepositoryProvider);
  final connectivity = await Connectivity().checkConnectivity();
  final layerOnline = connectionLayerOnline(connectivity);

  if (!layerOnline) {
    final cached = await ReportOfflineCache.load();
    if (cached != null) return cached.report;
    throw StateError(
      'Pas de réseau détecté. Ouvre l’app au moins une fois en ligne sur cet '
      'appareil pour mettre en cache l’annuaire et les montants.',
    );
  }

  final year = await ref.watch(activeAcademicYearNameProvider.future);

  try {
    final data = await repo.getFinancialReport(year);
    await ReportOfflineCache.save(academicYear: year, report: data);
    return data;
  } catch (_) {
    final cached = await ReportOfflineCache.load();
    if (cached != null && cached.academicYear == year) {
      return cached.report;
    }
    rethrow;
  }
});
