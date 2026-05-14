import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';

import 'core/routing/app_router.dart';
import 'core/theme/app_colors.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: '.env');
  final supabaseUrl = dotenv.env['SUPABASE_URL']?.trim();
  final supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY']?.trim();
  if (supabaseUrl == null ||
      supabaseAnonKey == null ||
      supabaseUrl.isEmpty ||
      supabaseAnonKey.isEmpty) {
    throw StateError(
      'Fichier .env manquant ou incomplet. Copie .env.example vers .env '
      'et renseigne SUPABASE_URL et SUPABASE_ANON_KEY (dashboard Supabase → API).',
    );
  }

  await Supabase.initialize(
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  );
  
  runApp(
    // ProviderScope allows Riverpod to track states across our entire app
    const ProviderScope(
      child: SchoolSaaSApp(),
    ),
  );
}

class SchoolSaaSApp extends ConsumerWidget {
  const SchoolSaaSApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'School SaaS Platform',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
        ),
        scaffoldBackgroundColor: AppColors.background,
        textTheme: GoogleFonts.interTextTheme(),
        useMaterial3: true,
      ),
      // Here we tell Flutter to use our GoRouter configuration
      routerConfig: appRouter,
    );
  }
}
