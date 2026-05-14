import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../../core/supabase/tenant_context.dart';

class ReceiptGenerator {
  static Future<void> generateReceipt({
    required Map<String, dynamic> student,
    required Map<String, dynamic> feeStatus,
    required double amountPaid,
    required String receiptNumber,
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

    final double expected = feeStatus['expected_amount'];
    final double totalPaidNow = feeStatus['total_paid'];
    final bool isSolde = totalPaidNow >= expected;
    final String statusText = isSolde ? "SOLDE ($totalPaidNow / $expected FC)" : "Partiel ($totalPaidNow / $expected FC)";

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
              pw.Text("REÇU DE PAIEMENT", style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold, decoration: pw.TextDecoration.underline)),
              pw.Text("N° $receiptNumber", style: const pw.TextStyle(fontSize: 12, color: PdfColors.grey700)),
              pw.SizedBox(height: 20),
              pw.Divider(),
              pw.SizedBox(height: 10),

              pw.Container(
                alignment: pw.Alignment.centerLeft,
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      "Élève : ${student['prenom'] ?? student['first_name'] ?? ''} ${student['nom'] ?? student['last_name'] ?? ''}",
                      style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold),
                    ),
                    pw.Text("Matricule : ${student['matricule'] ?? ''}", style: const pw.TextStyle(fontSize: 12)),
                    pw.Text("Classe : ${student['classe_assignee'] ?? ''}", style: const pw.TextStyle(fontSize: 12)),
                  ],
                ),
              ),

              pw.SizedBox(height: 20),
              
              pw.Container(
                padding: const pw.EdgeInsets.all(10),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.grey),
                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                ),
                child: pw.Column(
                  children: [
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text("Rubrique :", style: const pw.TextStyle(fontSize: 12)),
                        pw.Text(feeStatus['fee_name'], style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                      ]
                    ),
                    pw.SizedBox(height: 5),
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text("Montant Payé Ce Jour :", style: const pw.TextStyle(fontSize: 14)),
                        pw.Text("$amountPaid FC", style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                      ]
                    ),
                    pw.Divider(),
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text("Statut de la rubrique :", style: const pw.TextStyle(fontSize: 12)),
                        pw.Text(statusText, style: pw.TextStyle(
                          fontSize: 12, 
                          fontWeight: pw.FontWeight.bold, 
                          color: isSolde ? PdfColors.green700 : PdfColors.orange700
                        )),
                      ]
                    ),
                  ]
                )
              ),

              pw.Spacer(),
              
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text("Le Caissier", style: const pw.TextStyle(fontSize: 10)),
                      pw.SizedBox(height: 20),
                      pw.Text("_________________", style: const pw.TextStyle(fontSize: 10)),
                    ]
                  ),
                  pw.Container(
                    width: 60,
                    height: 60,
                    child: pw.BarcodeWidget(
                      barcode: pw.Barcode.qrCode(),
                      data: receiptNumber,
                    ),
                  )
                ]
              )
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'Recu_$receiptNumber.pdf',
    );
  }
}
