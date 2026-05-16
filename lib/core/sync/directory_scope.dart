/// Périmètre école + année scolaire pour l’annuaire local.
class DirectoryScope {
  const DirectoryScope({
    required this.schoolId,
    required this.academicYearId,
    required this.academicYearName,
  });

  final String schoolId;
  final String academicYearId;
  final String academicYearName;
}
