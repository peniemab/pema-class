import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:http/http.dart' as http;

import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../../core/supabase/tenant_context.dart';

class AdmissionReceiptGenerator {
  static Future<void> generateReceipt({
    required Map<String, dynamic> student,
    required String academicYear,
    String? logoUrl,
  }) async {
    final pdf = pw.Document();

    pw.MemoryImage? logoImage;
    if (logoUrl != null && logoUrl.isNotEmpty) {
      try {
        final response = await http.get(Uri.parse(logoUrl));
        if (response.statusCode == 200) {
          logoImage = pw.MemoryImage(response.bodyBytes);
        }
      } catch (e) {
        // Ignorer si le logo ne charge pas
      }
    }

    String schoolName = "ÉTABLISSEMENT SCOLAIRE";
    try {
      final supabase = Supabase.instance.client;
      final name = await supabase.schoolNameForCurrentUser();
      if (name != null && name.isNotEmpty) {
        schoolName = name.toUpperCase();
      }
    } catch (_) {}

    final String matricule = student['matricule'];

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a5,
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.center,
            children: [
              if (logoImage != null)
                pw.Center(child: pw.Image(logoImage, width: 60, height: 60)),
              pw.SizedBox(height: 10),
              pw.Text(schoolName, style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColors.blueGrey900)),
              pw.SizedBox(height: 15),
              pw.Text("BILLET D'INSCRIPTION", style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold, decoration: pw.TextDecoration.underline)),
              pw.Text("Année Scolaire : $academicYear", style: const pw.TextStyle(fontSize: 12, color: PdfColors.grey700)),
              pw.SizedBox(height: 20),
              pw.Divider(),
              pw.SizedBox(height: 15),

              pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Expanded(
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text("Élève : ${student['prenom']} ${student['nom']}", style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                        pw.SizedBox(height: 5),
                        pw.Text("Sexe : ${student['sexe']}", style: const pw.TextStyle(fontSize: 12)),
                        pw.SizedBox(height: 5),
                        pw.Text("Né(e) le : ${student['date_naissance']} à ${student['lieu_naissance']}", style: const pw.TextStyle(fontSize: 12)),
                        pw.SizedBox(height: 15),
                        
                        pw.Row(
                          children: [
                            pw.Text("CLASSE : ", style: const pw.TextStyle(fontSize: 14)),
                            pw.Text("${student['classe_assignee']}", style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                          ]
                        ),
                        pw.SizedBox(height: 25),
                        pw.Text(
                          "Important : Ce billet ne valide définitivement l'inscription qu'après le paiement des frais afférents à la caisse.",
                          style: pw.TextStyle(fontSize: 10, color: PdfColors.red800, fontStyle: pw.FontStyle.italic),
                        ),
                      ],
                    ),
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.center,
                    children: [
                      pw.Container(
                        width: 70,
                        height: 70,
                        child: pw.BarcodeWidget(
                          barcode: pw.Barcode.qrCode(),
                          data: matricule,
                        ),
                      ),
                      pw.SizedBox(height: 5),
                      pw.Text("MAT: $matricule", style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
                    ]
                  )
                ]
              ),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'Inscription_$matricule.pdf',
    );
  }
}
