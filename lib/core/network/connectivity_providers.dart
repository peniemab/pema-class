import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Indique si la pile « lien » (Wi‑Fi / données / câble) est active.
/// Peut être vrai sans accès Internet réel ; les appels Supabase restent la source de vérité.
bool connectionLayerOnline(List<ConnectivityResult> results) {
  if (results.isEmpty) return false;
  return results.any(
    (r) =>
        r == ConnectivityResult.mobile ||
        r == ConnectivityResult.wifi ||
        r == ConnectivityResult.ethernet ||
        r == ConnectivityResult.vpn ||
        r == ConnectivityResult.other,
  );
}

final connectivityResultsProvider =
    StreamProvider<List<ConnectivityResult>>((ref) async* {
  final connect = Connectivity();
  yield await connect.checkConnectivity();
  yield* connect.onConnectivityChanged;
});
