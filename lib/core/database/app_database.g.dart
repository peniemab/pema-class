// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $SyncStatesTable extends SyncStates
    with TableInfo<$SyncStatesTable, SyncState> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncStatesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _keyMeta = const VerificationMeta('key');
  @override
  late final GeneratedColumn<String> key = GeneratedColumn<String>(
    'key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _schoolIdMeta = const VerificationMeta(
    'schoolId',
  );
  @override
  late final GeneratedColumn<String> schoolId = GeneratedColumn<String>(
    'school_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _academicYearIdMeta = const VerificationMeta(
    'academicYearId',
  );
  @override
  late final GeneratedColumn<String> academicYearId = GeneratedColumn<String>(
    'academic_year_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _academicYearNameMeta = const VerificationMeta(
    'academicYearName',
  );
  @override
  late final GeneratedColumn<String> academicYearName = GeneratedColumn<String>(
    'academic_year_name',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lastSyncedAtMeta = const VerificationMeta(
    'lastSyncedAt',
  );
  @override
  late final GeneratedColumn<DateTime> lastSyncedAt = GeneratedColumn<DateTime>(
    'last_synced_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    key,
    schoolId,
    academicYearId,
    academicYearName,
    lastSyncedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_states';
  @override
  VerificationContext validateIntegrity(
    Insertable<SyncState> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('key')) {
      context.handle(
        _keyMeta,
        key.isAcceptableOrUnknown(data['key']!, _keyMeta),
      );
    } else if (isInserting) {
      context.missing(_keyMeta);
    }
    if (data.containsKey('school_id')) {
      context.handle(
        _schoolIdMeta,
        schoolId.isAcceptableOrUnknown(data['school_id']!, _schoolIdMeta),
      );
    } else if (isInserting) {
      context.missing(_schoolIdMeta);
    }
    if (data.containsKey('academic_year_id')) {
      context.handle(
        _academicYearIdMeta,
        academicYearId.isAcceptableOrUnknown(
          data['academic_year_id']!,
          _academicYearIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_academicYearIdMeta);
    }
    if (data.containsKey('academic_year_name')) {
      context.handle(
        _academicYearNameMeta,
        academicYearName.isAcceptableOrUnknown(
          data['academic_year_name']!,
          _academicYearNameMeta,
        ),
      );
    }
    if (data.containsKey('last_synced_at')) {
      context.handle(
        _lastSyncedAtMeta,
        lastSyncedAt.isAcceptableOrUnknown(
          data['last_synced_at']!,
          _lastSyncedAtMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {key};
  @override
  SyncState map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncState(
      key: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}key'],
      )!,
      schoolId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}school_id'],
      )!,
      academicYearId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}academic_year_id'],
      )!,
      academicYearName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}academic_year_name'],
      ),
      lastSyncedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_synced_at'],
      ),
    );
  }

  @override
  $SyncStatesTable createAlias(String alias) {
    return $SyncStatesTable(attachedDatabase, alias);
  }
}

class SyncState extends DataClass implements Insertable<SyncState> {
  final String key;
  final String schoolId;
  final String academicYearId;
  final String? academicYearName;
  final DateTime? lastSyncedAt;
  const SyncState({
    required this.key,
    required this.schoolId,
    required this.academicYearId,
    this.academicYearName,
    this.lastSyncedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['key'] = Variable<String>(key);
    map['school_id'] = Variable<String>(schoolId);
    map['academic_year_id'] = Variable<String>(academicYearId);
    if (!nullToAbsent || academicYearName != null) {
      map['academic_year_name'] = Variable<String>(academicYearName);
    }
    if (!nullToAbsent || lastSyncedAt != null) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt);
    }
    return map;
  }

  SyncStatesCompanion toCompanion(bool nullToAbsent) {
    return SyncStatesCompanion(
      key: Value(key),
      schoolId: Value(schoolId),
      academicYearId: Value(academicYearId),
      academicYearName: academicYearName == null && nullToAbsent
          ? const Value.absent()
          : Value(academicYearName),
      lastSyncedAt: lastSyncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastSyncedAt),
    );
  }

  factory SyncState.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncState(
      key: serializer.fromJson<String>(json['key']),
      schoolId: serializer.fromJson<String>(json['schoolId']),
      academicYearId: serializer.fromJson<String>(json['academicYearId']),
      academicYearName: serializer.fromJson<String?>(json['academicYearName']),
      lastSyncedAt: serializer.fromJson<DateTime?>(json['lastSyncedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'key': serializer.toJson<String>(key),
      'schoolId': serializer.toJson<String>(schoolId),
      'academicYearId': serializer.toJson<String>(academicYearId),
      'academicYearName': serializer.toJson<String?>(academicYearName),
      'lastSyncedAt': serializer.toJson<DateTime?>(lastSyncedAt),
    };
  }

  SyncState copyWith({
    String? key,
    String? schoolId,
    String? academicYearId,
    Value<String?> academicYearName = const Value.absent(),
    Value<DateTime?> lastSyncedAt = const Value.absent(),
  }) => SyncState(
    key: key ?? this.key,
    schoolId: schoolId ?? this.schoolId,
    academicYearId: academicYearId ?? this.academicYearId,
    academicYearName: academicYearName.present
        ? academicYearName.value
        : this.academicYearName,
    lastSyncedAt: lastSyncedAt.present ? lastSyncedAt.value : this.lastSyncedAt,
  );
  SyncState copyWithCompanion(SyncStatesCompanion data) {
    return SyncState(
      key: data.key.present ? data.key.value : this.key,
      schoolId: data.schoolId.present ? data.schoolId.value : this.schoolId,
      academicYearId: data.academicYearId.present
          ? data.academicYearId.value
          : this.academicYearId,
      academicYearName: data.academicYearName.present
          ? data.academicYearName.value
          : this.academicYearName,
      lastSyncedAt: data.lastSyncedAt.present
          ? data.lastSyncedAt.value
          : this.lastSyncedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncState(')
          ..write('key: $key, ')
          ..write('schoolId: $schoolId, ')
          ..write('academicYearId: $academicYearId, ')
          ..write('academicYearName: $academicYearName, ')
          ..write('lastSyncedAt: $lastSyncedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    key,
    schoolId,
    academicYearId,
    academicYearName,
    lastSyncedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncState &&
          other.key == this.key &&
          other.schoolId == this.schoolId &&
          other.academicYearId == this.academicYearId &&
          other.academicYearName == this.academicYearName &&
          other.lastSyncedAt == this.lastSyncedAt);
}

class SyncStatesCompanion extends UpdateCompanion<SyncState> {
  final Value<String> key;
  final Value<String> schoolId;
  final Value<String> academicYearId;
  final Value<String?> academicYearName;
  final Value<DateTime?> lastSyncedAt;
  final Value<int> rowid;
  const SyncStatesCompanion({
    this.key = const Value.absent(),
    this.schoolId = const Value.absent(),
    this.academicYearId = const Value.absent(),
    this.academicYearName = const Value.absent(),
    this.lastSyncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SyncStatesCompanion.insert({
    required String key,
    required String schoolId,
    required String academicYearId,
    this.academicYearName = const Value.absent(),
    this.lastSyncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : key = Value(key),
       schoolId = Value(schoolId),
       academicYearId = Value(academicYearId);
  static Insertable<SyncState> custom({
    Expression<String>? key,
    Expression<String>? schoolId,
    Expression<String>? academicYearId,
    Expression<String>? academicYearName,
    Expression<DateTime>? lastSyncedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (key != null) 'key': key,
      if (schoolId != null) 'school_id': schoolId,
      if (academicYearId != null) 'academic_year_id': academicYearId,
      if (academicYearName != null) 'academic_year_name': academicYearName,
      if (lastSyncedAt != null) 'last_synced_at': lastSyncedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SyncStatesCompanion copyWith({
    Value<String>? key,
    Value<String>? schoolId,
    Value<String>? academicYearId,
    Value<String?>? academicYearName,
    Value<DateTime?>? lastSyncedAt,
    Value<int>? rowid,
  }) {
    return SyncStatesCompanion(
      key: key ?? this.key,
      schoolId: schoolId ?? this.schoolId,
      academicYearId: academicYearId ?? this.academicYearId,
      academicYearName: academicYearName ?? this.academicYearName,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (key.present) {
      map['key'] = Variable<String>(key.value);
    }
    if (schoolId.present) {
      map['school_id'] = Variable<String>(schoolId.value);
    }
    if (academicYearId.present) {
      map['academic_year_id'] = Variable<String>(academicYearId.value);
    }
    if (academicYearName.present) {
      map['academic_year_name'] = Variable<String>(academicYearName.value);
    }
    if (lastSyncedAt.present) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncStatesCompanion(')
          ..write('key: $key, ')
          ..write('schoolId: $schoolId, ')
          ..write('academicYearId: $academicYearId, ')
          ..write('academicYearName: $academicYearName, ')
          ..write('lastSyncedAt: $lastSyncedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalClassesTable extends LocalClasses
    with TableInfo<$LocalClassesTable, LocalClassesData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalClassesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _schoolIdMeta = const VerificationMeta(
    'schoolId',
  );
  @override
  late final GeneratedColumn<String> schoolId = GeneratedColumn<String>(
    'school_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _academicYearIdMeta = const VerificationMeta(
    'academicYearId',
  );
  @override
  late final GeneratedColumn<String> academicYearId = GeneratedColumn<String>(
    'academic_year_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _levelMeta = const VerificationMeta('level');
  @override
  late final GeneratedColumn<String> level = GeneratedColumn<String>(
    'level',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    schoolId,
    academicYearId,
    name,
    level,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_classes';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalClassesData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('school_id')) {
      context.handle(
        _schoolIdMeta,
        schoolId.isAcceptableOrUnknown(data['school_id']!, _schoolIdMeta),
      );
    } else if (isInserting) {
      context.missing(_schoolIdMeta);
    }
    if (data.containsKey('academic_year_id')) {
      context.handle(
        _academicYearIdMeta,
        academicYearId.isAcceptableOrUnknown(
          data['academic_year_id']!,
          _academicYearIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_academicYearIdMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('level')) {
      context.handle(
        _levelMeta,
        level.isAcceptableOrUnknown(data['level']!, _levelMeta),
      );
    } else if (isInserting) {
      context.missing(_levelMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalClassesData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalClassesData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      schoolId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}school_id'],
      )!,
      academicYearId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}academic_year_id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      level: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}level'],
      )!,
    );
  }

  @override
  $LocalClassesTable createAlias(String alias) {
    return $LocalClassesTable(attachedDatabase, alias);
  }
}

class LocalClassesData extends DataClass
    implements Insertable<LocalClassesData> {
  final String id;
  final String schoolId;
  final String academicYearId;
  final String name;
  final String level;
  const LocalClassesData({
    required this.id,
    required this.schoolId,
    required this.academicYearId,
    required this.name,
    required this.level,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['school_id'] = Variable<String>(schoolId);
    map['academic_year_id'] = Variable<String>(academicYearId);
    map['name'] = Variable<String>(name);
    map['level'] = Variable<String>(level);
    return map;
  }

  LocalClassesCompanion toCompanion(bool nullToAbsent) {
    return LocalClassesCompanion(
      id: Value(id),
      schoolId: Value(schoolId),
      academicYearId: Value(academicYearId),
      name: Value(name),
      level: Value(level),
    );
  }

  factory LocalClassesData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalClassesData(
      id: serializer.fromJson<String>(json['id']),
      schoolId: serializer.fromJson<String>(json['schoolId']),
      academicYearId: serializer.fromJson<String>(json['academicYearId']),
      name: serializer.fromJson<String>(json['name']),
      level: serializer.fromJson<String>(json['level']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'schoolId': serializer.toJson<String>(schoolId),
      'academicYearId': serializer.toJson<String>(academicYearId),
      'name': serializer.toJson<String>(name),
      'level': serializer.toJson<String>(level),
    };
  }

  LocalClassesData copyWith({
    String? id,
    String? schoolId,
    String? academicYearId,
    String? name,
    String? level,
  }) => LocalClassesData(
    id: id ?? this.id,
    schoolId: schoolId ?? this.schoolId,
    academicYearId: academicYearId ?? this.academicYearId,
    name: name ?? this.name,
    level: level ?? this.level,
  );
  LocalClassesData copyWithCompanion(LocalClassesCompanion data) {
    return LocalClassesData(
      id: data.id.present ? data.id.value : this.id,
      schoolId: data.schoolId.present ? data.schoolId.value : this.schoolId,
      academicYearId: data.academicYearId.present
          ? data.academicYearId.value
          : this.academicYearId,
      name: data.name.present ? data.name.value : this.name,
      level: data.level.present ? data.level.value : this.level,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalClassesData(')
          ..write('id: $id, ')
          ..write('schoolId: $schoolId, ')
          ..write('academicYearId: $academicYearId, ')
          ..write('name: $name, ')
          ..write('level: $level')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, schoolId, academicYearId, name, level);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalClassesData &&
          other.id == this.id &&
          other.schoolId == this.schoolId &&
          other.academicYearId == this.academicYearId &&
          other.name == this.name &&
          other.level == this.level);
}

class LocalClassesCompanion extends UpdateCompanion<LocalClassesData> {
  final Value<String> id;
  final Value<String> schoolId;
  final Value<String> academicYearId;
  final Value<String> name;
  final Value<String> level;
  final Value<int> rowid;
  const LocalClassesCompanion({
    this.id = const Value.absent(),
    this.schoolId = const Value.absent(),
    this.academicYearId = const Value.absent(),
    this.name = const Value.absent(),
    this.level = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalClassesCompanion.insert({
    required String id,
    required String schoolId,
    required String academicYearId,
    required String name,
    required String level,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       schoolId = Value(schoolId),
       academicYearId = Value(academicYearId),
       name = Value(name),
       level = Value(level);
  static Insertable<LocalClassesData> custom({
    Expression<String>? id,
    Expression<String>? schoolId,
    Expression<String>? academicYearId,
    Expression<String>? name,
    Expression<String>? level,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (schoolId != null) 'school_id': schoolId,
      if (academicYearId != null) 'academic_year_id': academicYearId,
      if (name != null) 'name': name,
      if (level != null) 'level': level,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalClassesCompanion copyWith({
    Value<String>? id,
    Value<String>? schoolId,
    Value<String>? academicYearId,
    Value<String>? name,
    Value<String>? level,
    Value<int>? rowid,
  }) {
    return LocalClassesCompanion(
      id: id ?? this.id,
      schoolId: schoolId ?? this.schoolId,
      academicYearId: academicYearId ?? this.academicYearId,
      name: name ?? this.name,
      level: level ?? this.level,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (schoolId.present) {
      map['school_id'] = Variable<String>(schoolId.value);
    }
    if (academicYearId.present) {
      map['academic_year_id'] = Variable<String>(academicYearId.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (level.present) {
      map['level'] = Variable<String>(level.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalClassesCompanion(')
          ..write('id: $id, ')
          ..write('schoolId: $schoolId, ')
          ..write('academicYearId: $academicYearId, ')
          ..write('name: $name, ')
          ..write('level: $level, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalStudentsTable extends LocalStudents
    with TableInfo<$LocalStudentsTable, LocalStudent> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalStudentsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _schoolIdMeta = const VerificationMeta(
    'schoolId',
  );
  @override
  late final GeneratedColumn<String> schoolId = GeneratedColumn<String>(
    'school_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _academicYearIdMeta = const VerificationMeta(
    'academicYearId',
  );
  @override
  late final GeneratedColumn<String> academicYearId = GeneratedColumn<String>(
    'academic_year_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _matriculeMeta = const VerificationMeta(
    'matricule',
  );
  @override
  late final GeneratedColumn<String> matricule = GeneratedColumn<String>(
    'matricule',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _firstNameMeta = const VerificationMeta(
    'firstName',
  );
  @override
  late final GeneratedColumn<String> firstName = GeneratedColumn<String>(
    'first_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _lastNameMeta = const VerificationMeta(
    'lastName',
  );
  @override
  late final GeneratedColumn<String> lastName = GeneratedColumn<String>(
    'last_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _genderLabelMeta = const VerificationMeta(
    'genderLabel',
  );
  @override
  late final GeneratedColumn<String> genderLabel = GeneratedColumn<String>(
    'gender_label',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _birthDateMeta = const VerificationMeta(
    'birthDate',
  );
  @override
  late final GeneratedColumn<String> birthDate = GeneratedColumn<String>(
    'birth_date',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lieuNaissanceMeta = const VerificationMeta(
    'lieuNaissance',
  );
  @override
  late final GeneratedColumn<String> lieuNaissance = GeneratedColumn<String>(
    'lieu_naissance',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _ecoleProvenanceMeta = const VerificationMeta(
    'ecoleProvenance',
  );
  @override
  late final GeneratedColumn<String> ecoleProvenance = GeneratedColumn<String>(
    'ecole_provenance',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _classIdMeta = const VerificationMeta(
    'classId',
  );
  @override
  late final GeneratedColumn<String> classId = GeneratedColumn<String>(
    'class_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _classNameMeta = const VerificationMeta(
    'className',
  );
  @override
  late final GeneratedColumn<String> className = GeneratedColumn<String>(
    'class_name',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _remoteUpdatedAtMeta = const VerificationMeta(
    'remoteUpdatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> remoteUpdatedAt =
      GeneratedColumn<DateTime>(
        'remote_updated_at',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    schoolId,
    academicYearId,
    matricule,
    firstName,
    lastName,
    genderLabel,
    birthDate,
    lieuNaissance,
    ecoleProvenance,
    classId,
    className,
    remoteUpdatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_students';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalStudent> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('school_id')) {
      context.handle(
        _schoolIdMeta,
        schoolId.isAcceptableOrUnknown(data['school_id']!, _schoolIdMeta),
      );
    } else if (isInserting) {
      context.missing(_schoolIdMeta);
    }
    if (data.containsKey('academic_year_id')) {
      context.handle(
        _academicYearIdMeta,
        academicYearId.isAcceptableOrUnknown(
          data['academic_year_id']!,
          _academicYearIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_academicYearIdMeta);
    }
    if (data.containsKey('matricule')) {
      context.handle(
        _matriculeMeta,
        matricule.isAcceptableOrUnknown(data['matricule']!, _matriculeMeta),
      );
    }
    if (data.containsKey('first_name')) {
      context.handle(
        _firstNameMeta,
        firstName.isAcceptableOrUnknown(data['first_name']!, _firstNameMeta),
      );
    } else if (isInserting) {
      context.missing(_firstNameMeta);
    }
    if (data.containsKey('last_name')) {
      context.handle(
        _lastNameMeta,
        lastName.isAcceptableOrUnknown(data['last_name']!, _lastNameMeta),
      );
    } else if (isInserting) {
      context.missing(_lastNameMeta);
    }
    if (data.containsKey('gender_label')) {
      context.handle(
        _genderLabelMeta,
        genderLabel.isAcceptableOrUnknown(
          data['gender_label']!,
          _genderLabelMeta,
        ),
      );
    }
    if (data.containsKey('birth_date')) {
      context.handle(
        _birthDateMeta,
        birthDate.isAcceptableOrUnknown(data['birth_date']!, _birthDateMeta),
      );
    }
    if (data.containsKey('lieu_naissance')) {
      context.handle(
        _lieuNaissanceMeta,
        lieuNaissance.isAcceptableOrUnknown(
          data['lieu_naissance']!,
          _lieuNaissanceMeta,
        ),
      );
    }
    if (data.containsKey('ecole_provenance')) {
      context.handle(
        _ecoleProvenanceMeta,
        ecoleProvenance.isAcceptableOrUnknown(
          data['ecole_provenance']!,
          _ecoleProvenanceMeta,
        ),
      );
    }
    if (data.containsKey('class_id')) {
      context.handle(
        _classIdMeta,
        classId.isAcceptableOrUnknown(data['class_id']!, _classIdMeta),
      );
    }
    if (data.containsKey('class_name')) {
      context.handle(
        _classNameMeta,
        className.isAcceptableOrUnknown(data['class_name']!, _classNameMeta),
      );
    }
    if (data.containsKey('remote_updated_at')) {
      context.handle(
        _remoteUpdatedAtMeta,
        remoteUpdatedAt.isAcceptableOrUnknown(
          data['remote_updated_at']!,
          _remoteUpdatedAtMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalStudent map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalStudent(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      schoolId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}school_id'],
      )!,
      academicYearId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}academic_year_id'],
      )!,
      matricule: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}matricule'],
      ),
      firstName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}first_name'],
      )!,
      lastName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}last_name'],
      )!,
      genderLabel: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}gender_label'],
      ),
      birthDate: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}birth_date'],
      ),
      lieuNaissance: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}lieu_naissance'],
      ),
      ecoleProvenance: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}ecole_provenance'],
      ),
      classId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}class_id'],
      ),
      className: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}class_name'],
      ),
      remoteUpdatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}remote_updated_at'],
      ),
    );
  }

  @override
  $LocalStudentsTable createAlias(String alias) {
    return $LocalStudentsTable(attachedDatabase, alias);
  }
}

class LocalStudent extends DataClass implements Insertable<LocalStudent> {
  final String id;
  final String schoolId;
  final String academicYearId;
  final String? matricule;
  final String firstName;
  final String lastName;
  final String? genderLabel;
  final String? birthDate;
  final String? lieuNaissance;
  final String? ecoleProvenance;
  final String? classId;
  final String? className;
  final DateTime? remoteUpdatedAt;
  const LocalStudent({
    required this.id,
    required this.schoolId,
    required this.academicYearId,
    this.matricule,
    required this.firstName,
    required this.lastName,
    this.genderLabel,
    this.birthDate,
    this.lieuNaissance,
    this.ecoleProvenance,
    this.classId,
    this.className,
    this.remoteUpdatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['school_id'] = Variable<String>(schoolId);
    map['academic_year_id'] = Variable<String>(academicYearId);
    if (!nullToAbsent || matricule != null) {
      map['matricule'] = Variable<String>(matricule);
    }
    map['first_name'] = Variable<String>(firstName);
    map['last_name'] = Variable<String>(lastName);
    if (!nullToAbsent || genderLabel != null) {
      map['gender_label'] = Variable<String>(genderLabel);
    }
    if (!nullToAbsent || birthDate != null) {
      map['birth_date'] = Variable<String>(birthDate);
    }
    if (!nullToAbsent || lieuNaissance != null) {
      map['lieu_naissance'] = Variable<String>(lieuNaissance);
    }
    if (!nullToAbsent || ecoleProvenance != null) {
      map['ecole_provenance'] = Variable<String>(ecoleProvenance);
    }
    if (!nullToAbsent || classId != null) {
      map['class_id'] = Variable<String>(classId);
    }
    if (!nullToAbsent || className != null) {
      map['class_name'] = Variable<String>(className);
    }
    if (!nullToAbsent || remoteUpdatedAt != null) {
      map['remote_updated_at'] = Variable<DateTime>(remoteUpdatedAt);
    }
    return map;
  }

  LocalStudentsCompanion toCompanion(bool nullToAbsent) {
    return LocalStudentsCompanion(
      id: Value(id),
      schoolId: Value(schoolId),
      academicYearId: Value(academicYearId),
      matricule: matricule == null && nullToAbsent
          ? const Value.absent()
          : Value(matricule),
      firstName: Value(firstName),
      lastName: Value(lastName),
      genderLabel: genderLabel == null && nullToAbsent
          ? const Value.absent()
          : Value(genderLabel),
      birthDate: birthDate == null && nullToAbsent
          ? const Value.absent()
          : Value(birthDate),
      lieuNaissance: lieuNaissance == null && nullToAbsent
          ? const Value.absent()
          : Value(lieuNaissance),
      ecoleProvenance: ecoleProvenance == null && nullToAbsent
          ? const Value.absent()
          : Value(ecoleProvenance),
      classId: classId == null && nullToAbsent
          ? const Value.absent()
          : Value(classId),
      className: className == null && nullToAbsent
          ? const Value.absent()
          : Value(className),
      remoteUpdatedAt: remoteUpdatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(remoteUpdatedAt),
    );
  }

  factory LocalStudent.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalStudent(
      id: serializer.fromJson<String>(json['id']),
      schoolId: serializer.fromJson<String>(json['schoolId']),
      academicYearId: serializer.fromJson<String>(json['academicYearId']),
      matricule: serializer.fromJson<String?>(json['matricule']),
      firstName: serializer.fromJson<String>(json['firstName']),
      lastName: serializer.fromJson<String>(json['lastName']),
      genderLabel: serializer.fromJson<String?>(json['genderLabel']),
      birthDate: serializer.fromJson<String?>(json['birthDate']),
      lieuNaissance: serializer.fromJson<String?>(json['lieuNaissance']),
      ecoleProvenance: serializer.fromJson<String?>(json['ecoleProvenance']),
      classId: serializer.fromJson<String?>(json['classId']),
      className: serializer.fromJson<String?>(json['className']),
      remoteUpdatedAt: serializer.fromJson<DateTime?>(json['remoteUpdatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'schoolId': serializer.toJson<String>(schoolId),
      'academicYearId': serializer.toJson<String>(academicYearId),
      'matricule': serializer.toJson<String?>(matricule),
      'firstName': serializer.toJson<String>(firstName),
      'lastName': serializer.toJson<String>(lastName),
      'genderLabel': serializer.toJson<String?>(genderLabel),
      'birthDate': serializer.toJson<String?>(birthDate),
      'lieuNaissance': serializer.toJson<String?>(lieuNaissance),
      'ecoleProvenance': serializer.toJson<String?>(ecoleProvenance),
      'classId': serializer.toJson<String?>(classId),
      'className': serializer.toJson<String?>(className),
      'remoteUpdatedAt': serializer.toJson<DateTime?>(remoteUpdatedAt),
    };
  }

  LocalStudent copyWith({
    String? id,
    String? schoolId,
    String? academicYearId,
    Value<String?> matricule = const Value.absent(),
    String? firstName,
    String? lastName,
    Value<String?> genderLabel = const Value.absent(),
    Value<String?> birthDate = const Value.absent(),
    Value<String?> lieuNaissance = const Value.absent(),
    Value<String?> ecoleProvenance = const Value.absent(),
    Value<String?> classId = const Value.absent(),
    Value<String?> className = const Value.absent(),
    Value<DateTime?> remoteUpdatedAt = const Value.absent(),
  }) => LocalStudent(
    id: id ?? this.id,
    schoolId: schoolId ?? this.schoolId,
    academicYearId: academicYearId ?? this.academicYearId,
    matricule: matricule.present ? matricule.value : this.matricule,
    firstName: firstName ?? this.firstName,
    lastName: lastName ?? this.lastName,
    genderLabel: genderLabel.present ? genderLabel.value : this.genderLabel,
    birthDate: birthDate.present ? birthDate.value : this.birthDate,
    lieuNaissance: lieuNaissance.present
        ? lieuNaissance.value
        : this.lieuNaissance,
    ecoleProvenance: ecoleProvenance.present
        ? ecoleProvenance.value
        : this.ecoleProvenance,
    classId: classId.present ? classId.value : this.classId,
    className: className.present ? className.value : this.className,
    remoteUpdatedAt: remoteUpdatedAt.present
        ? remoteUpdatedAt.value
        : this.remoteUpdatedAt,
  );
  LocalStudent copyWithCompanion(LocalStudentsCompanion data) {
    return LocalStudent(
      id: data.id.present ? data.id.value : this.id,
      schoolId: data.schoolId.present ? data.schoolId.value : this.schoolId,
      academicYearId: data.academicYearId.present
          ? data.academicYearId.value
          : this.academicYearId,
      matricule: data.matricule.present ? data.matricule.value : this.matricule,
      firstName: data.firstName.present ? data.firstName.value : this.firstName,
      lastName: data.lastName.present ? data.lastName.value : this.lastName,
      genderLabel: data.genderLabel.present
          ? data.genderLabel.value
          : this.genderLabel,
      birthDate: data.birthDate.present ? data.birthDate.value : this.birthDate,
      lieuNaissance: data.lieuNaissance.present
          ? data.lieuNaissance.value
          : this.lieuNaissance,
      ecoleProvenance: data.ecoleProvenance.present
          ? data.ecoleProvenance.value
          : this.ecoleProvenance,
      classId: data.classId.present ? data.classId.value : this.classId,
      className: data.className.present ? data.className.value : this.className,
      remoteUpdatedAt: data.remoteUpdatedAt.present
          ? data.remoteUpdatedAt.value
          : this.remoteUpdatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalStudent(')
          ..write('id: $id, ')
          ..write('schoolId: $schoolId, ')
          ..write('academicYearId: $academicYearId, ')
          ..write('matricule: $matricule, ')
          ..write('firstName: $firstName, ')
          ..write('lastName: $lastName, ')
          ..write('genderLabel: $genderLabel, ')
          ..write('birthDate: $birthDate, ')
          ..write('lieuNaissance: $lieuNaissance, ')
          ..write('ecoleProvenance: $ecoleProvenance, ')
          ..write('classId: $classId, ')
          ..write('className: $className, ')
          ..write('remoteUpdatedAt: $remoteUpdatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    schoolId,
    academicYearId,
    matricule,
    firstName,
    lastName,
    genderLabel,
    birthDate,
    lieuNaissance,
    ecoleProvenance,
    classId,
    className,
    remoteUpdatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalStudent &&
          other.id == this.id &&
          other.schoolId == this.schoolId &&
          other.academicYearId == this.academicYearId &&
          other.matricule == this.matricule &&
          other.firstName == this.firstName &&
          other.lastName == this.lastName &&
          other.genderLabel == this.genderLabel &&
          other.birthDate == this.birthDate &&
          other.lieuNaissance == this.lieuNaissance &&
          other.ecoleProvenance == this.ecoleProvenance &&
          other.classId == this.classId &&
          other.className == this.className &&
          other.remoteUpdatedAt == this.remoteUpdatedAt);
}

class LocalStudentsCompanion extends UpdateCompanion<LocalStudent> {
  final Value<String> id;
  final Value<String> schoolId;
  final Value<String> academicYearId;
  final Value<String?> matricule;
  final Value<String> firstName;
  final Value<String> lastName;
  final Value<String?> genderLabel;
  final Value<String?> birthDate;
  final Value<String?> lieuNaissance;
  final Value<String?> ecoleProvenance;
  final Value<String?> classId;
  final Value<String?> className;
  final Value<DateTime?> remoteUpdatedAt;
  final Value<int> rowid;
  const LocalStudentsCompanion({
    this.id = const Value.absent(),
    this.schoolId = const Value.absent(),
    this.academicYearId = const Value.absent(),
    this.matricule = const Value.absent(),
    this.firstName = const Value.absent(),
    this.lastName = const Value.absent(),
    this.genderLabel = const Value.absent(),
    this.birthDate = const Value.absent(),
    this.lieuNaissance = const Value.absent(),
    this.ecoleProvenance = const Value.absent(),
    this.classId = const Value.absent(),
    this.className = const Value.absent(),
    this.remoteUpdatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalStudentsCompanion.insert({
    required String id,
    required String schoolId,
    required String academicYearId,
    this.matricule = const Value.absent(),
    required String firstName,
    required String lastName,
    this.genderLabel = const Value.absent(),
    this.birthDate = const Value.absent(),
    this.lieuNaissance = const Value.absent(),
    this.ecoleProvenance = const Value.absent(),
    this.classId = const Value.absent(),
    this.className = const Value.absent(),
    this.remoteUpdatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       schoolId = Value(schoolId),
       academicYearId = Value(academicYearId),
       firstName = Value(firstName),
       lastName = Value(lastName);
  static Insertable<LocalStudent> custom({
    Expression<String>? id,
    Expression<String>? schoolId,
    Expression<String>? academicYearId,
    Expression<String>? matricule,
    Expression<String>? firstName,
    Expression<String>? lastName,
    Expression<String>? genderLabel,
    Expression<String>? birthDate,
    Expression<String>? lieuNaissance,
    Expression<String>? ecoleProvenance,
    Expression<String>? classId,
    Expression<String>? className,
    Expression<DateTime>? remoteUpdatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (schoolId != null) 'school_id': schoolId,
      if (academicYearId != null) 'academic_year_id': academicYearId,
      if (matricule != null) 'matricule': matricule,
      if (firstName != null) 'first_name': firstName,
      if (lastName != null) 'last_name': lastName,
      if (genderLabel != null) 'gender_label': genderLabel,
      if (birthDate != null) 'birth_date': birthDate,
      if (lieuNaissance != null) 'lieu_naissance': lieuNaissance,
      if (ecoleProvenance != null) 'ecole_provenance': ecoleProvenance,
      if (classId != null) 'class_id': classId,
      if (className != null) 'class_name': className,
      if (remoteUpdatedAt != null) 'remote_updated_at': remoteUpdatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalStudentsCompanion copyWith({
    Value<String>? id,
    Value<String>? schoolId,
    Value<String>? academicYearId,
    Value<String?>? matricule,
    Value<String>? firstName,
    Value<String>? lastName,
    Value<String?>? genderLabel,
    Value<String?>? birthDate,
    Value<String?>? lieuNaissance,
    Value<String?>? ecoleProvenance,
    Value<String?>? classId,
    Value<String?>? className,
    Value<DateTime?>? remoteUpdatedAt,
    Value<int>? rowid,
  }) {
    return LocalStudentsCompanion(
      id: id ?? this.id,
      schoolId: schoolId ?? this.schoolId,
      academicYearId: academicYearId ?? this.academicYearId,
      matricule: matricule ?? this.matricule,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      genderLabel: genderLabel ?? this.genderLabel,
      birthDate: birthDate ?? this.birthDate,
      lieuNaissance: lieuNaissance ?? this.lieuNaissance,
      ecoleProvenance: ecoleProvenance ?? this.ecoleProvenance,
      classId: classId ?? this.classId,
      className: className ?? this.className,
      remoteUpdatedAt: remoteUpdatedAt ?? this.remoteUpdatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (schoolId.present) {
      map['school_id'] = Variable<String>(schoolId.value);
    }
    if (academicYearId.present) {
      map['academic_year_id'] = Variable<String>(academicYearId.value);
    }
    if (matricule.present) {
      map['matricule'] = Variable<String>(matricule.value);
    }
    if (firstName.present) {
      map['first_name'] = Variable<String>(firstName.value);
    }
    if (lastName.present) {
      map['last_name'] = Variable<String>(lastName.value);
    }
    if (genderLabel.present) {
      map['gender_label'] = Variable<String>(genderLabel.value);
    }
    if (birthDate.present) {
      map['birth_date'] = Variable<String>(birthDate.value);
    }
    if (lieuNaissance.present) {
      map['lieu_naissance'] = Variable<String>(lieuNaissance.value);
    }
    if (ecoleProvenance.present) {
      map['ecole_provenance'] = Variable<String>(ecoleProvenance.value);
    }
    if (classId.present) {
      map['class_id'] = Variable<String>(classId.value);
    }
    if (className.present) {
      map['class_name'] = Variable<String>(className.value);
    }
    if (remoteUpdatedAt.present) {
      map['remote_updated_at'] = Variable<DateTime>(remoteUpdatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalStudentsCompanion(')
          ..write('id: $id, ')
          ..write('schoolId: $schoolId, ')
          ..write('academicYearId: $academicYearId, ')
          ..write('matricule: $matricule, ')
          ..write('firstName: $firstName, ')
          ..write('lastName: $lastName, ')
          ..write('genderLabel: $genderLabel, ')
          ..write('birthDate: $birthDate, ')
          ..write('lieuNaissance: $lieuNaissance, ')
          ..write('ecoleProvenance: $ecoleProvenance, ')
          ..write('classId: $classId, ')
          ..write('className: $className, ')
          ..write('remoteUpdatedAt: $remoteUpdatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $SyncStatesTable syncStates = $SyncStatesTable(this);
  late final $LocalClassesTable localClasses = $LocalClassesTable(this);
  late final $LocalStudentsTable localStudents = $LocalStudentsTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    syncStates,
    localClasses,
    localStudents,
  ];
}

typedef $$SyncStatesTableCreateCompanionBuilder =
    SyncStatesCompanion Function({
      required String key,
      required String schoolId,
      required String academicYearId,
      Value<String?> academicYearName,
      Value<DateTime?> lastSyncedAt,
      Value<int> rowid,
    });
typedef $$SyncStatesTableUpdateCompanionBuilder =
    SyncStatesCompanion Function({
      Value<String> key,
      Value<String> schoolId,
      Value<String> academicYearId,
      Value<String?> academicYearName,
      Value<DateTime?> lastSyncedAt,
      Value<int> rowid,
    });

class $$SyncStatesTableFilterComposer
    extends Composer<_$AppDatabase, $SyncStatesTable> {
  $$SyncStatesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get schoolId => $composableBuilder(
    column: $table.schoolId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get academicYearId => $composableBuilder(
    column: $table.academicYearId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get academicYearName => $composableBuilder(
    column: $table.academicYearName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SyncStatesTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncStatesTable> {
  $$SyncStatesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get schoolId => $composableBuilder(
    column: $table.schoolId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get academicYearId => $composableBuilder(
    column: $table.academicYearId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get academicYearName => $composableBuilder(
    column: $table.academicYearName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SyncStatesTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncStatesTable> {
  $$SyncStatesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get key =>
      $composableBuilder(column: $table.key, builder: (column) => column);

  GeneratedColumn<String> get schoolId =>
      $composableBuilder(column: $table.schoolId, builder: (column) => column);

  GeneratedColumn<String> get academicYearId => $composableBuilder(
    column: $table.academicYearId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get academicYearName => $composableBuilder(
    column: $table.academicYearName,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => column,
  );
}

class $$SyncStatesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SyncStatesTable,
          SyncState,
          $$SyncStatesTableFilterComposer,
          $$SyncStatesTableOrderingComposer,
          $$SyncStatesTableAnnotationComposer,
          $$SyncStatesTableCreateCompanionBuilder,
          $$SyncStatesTableUpdateCompanionBuilder,
          (
            SyncState,
            BaseReferences<_$AppDatabase, $SyncStatesTable, SyncState>,
          ),
          SyncState,
          PrefetchHooks Function()
        > {
  $$SyncStatesTableTableManager(_$AppDatabase db, $SyncStatesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncStatesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncStatesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncStatesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> key = const Value.absent(),
                Value<String> schoolId = const Value.absent(),
                Value<String> academicYearId = const Value.absent(),
                Value<String?> academicYearName = const Value.absent(),
                Value<DateTime?> lastSyncedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SyncStatesCompanion(
                key: key,
                schoolId: schoolId,
                academicYearId: academicYearId,
                academicYearName: academicYearName,
                lastSyncedAt: lastSyncedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String key,
                required String schoolId,
                required String academicYearId,
                Value<String?> academicYearName = const Value.absent(),
                Value<DateTime?> lastSyncedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SyncStatesCompanion.insert(
                key: key,
                schoolId: schoolId,
                academicYearId: academicYearId,
                academicYearName: academicYearName,
                lastSyncedAt: lastSyncedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SyncStatesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SyncStatesTable,
      SyncState,
      $$SyncStatesTableFilterComposer,
      $$SyncStatesTableOrderingComposer,
      $$SyncStatesTableAnnotationComposer,
      $$SyncStatesTableCreateCompanionBuilder,
      $$SyncStatesTableUpdateCompanionBuilder,
      (SyncState, BaseReferences<_$AppDatabase, $SyncStatesTable, SyncState>),
      SyncState,
      PrefetchHooks Function()
    >;
typedef $$LocalClassesTableCreateCompanionBuilder =
    LocalClassesCompanion Function({
      required String id,
      required String schoolId,
      required String academicYearId,
      required String name,
      required String level,
      Value<int> rowid,
    });
typedef $$LocalClassesTableUpdateCompanionBuilder =
    LocalClassesCompanion Function({
      Value<String> id,
      Value<String> schoolId,
      Value<String> academicYearId,
      Value<String> name,
      Value<String> level,
      Value<int> rowid,
    });

class $$LocalClassesTableFilterComposer
    extends Composer<_$AppDatabase, $LocalClassesTable> {
  $$LocalClassesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get schoolId => $composableBuilder(
    column: $table.schoolId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get academicYearId => $composableBuilder(
    column: $table.academicYearId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get level => $composableBuilder(
    column: $table.level,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalClassesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalClassesTable> {
  $$LocalClassesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get schoolId => $composableBuilder(
    column: $table.schoolId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get academicYearId => $composableBuilder(
    column: $table.academicYearId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get level => $composableBuilder(
    column: $table.level,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalClassesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalClassesTable> {
  $$LocalClassesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get schoolId =>
      $composableBuilder(column: $table.schoolId, builder: (column) => column);

  GeneratedColumn<String> get academicYearId => $composableBuilder(
    column: $table.academicYearId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get level =>
      $composableBuilder(column: $table.level, builder: (column) => column);
}

class $$LocalClassesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalClassesTable,
          LocalClassesData,
          $$LocalClassesTableFilterComposer,
          $$LocalClassesTableOrderingComposer,
          $$LocalClassesTableAnnotationComposer,
          $$LocalClassesTableCreateCompanionBuilder,
          $$LocalClassesTableUpdateCompanionBuilder,
          (
            LocalClassesData,
            BaseReferences<_$AppDatabase, $LocalClassesTable, LocalClassesData>,
          ),
          LocalClassesData,
          PrefetchHooks Function()
        > {
  $$LocalClassesTableTableManager(_$AppDatabase db, $LocalClassesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalClassesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalClassesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalClassesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> schoolId = const Value.absent(),
                Value<String> academicYearId = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<String> level = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalClassesCompanion(
                id: id,
                schoolId: schoolId,
                academicYearId: academicYearId,
                name: name,
                level: level,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String schoolId,
                required String academicYearId,
                required String name,
                required String level,
                Value<int> rowid = const Value.absent(),
              }) => LocalClassesCompanion.insert(
                id: id,
                schoolId: schoolId,
                academicYearId: academicYearId,
                name: name,
                level: level,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalClassesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalClassesTable,
      LocalClassesData,
      $$LocalClassesTableFilterComposer,
      $$LocalClassesTableOrderingComposer,
      $$LocalClassesTableAnnotationComposer,
      $$LocalClassesTableCreateCompanionBuilder,
      $$LocalClassesTableUpdateCompanionBuilder,
      (
        LocalClassesData,
        BaseReferences<_$AppDatabase, $LocalClassesTable, LocalClassesData>,
      ),
      LocalClassesData,
      PrefetchHooks Function()
    >;
typedef $$LocalStudentsTableCreateCompanionBuilder =
    LocalStudentsCompanion Function({
      required String id,
      required String schoolId,
      required String academicYearId,
      Value<String?> matricule,
      required String firstName,
      required String lastName,
      Value<String?> genderLabel,
      Value<String?> birthDate,
      Value<String?> lieuNaissance,
      Value<String?> ecoleProvenance,
      Value<String?> classId,
      Value<String?> className,
      Value<DateTime?> remoteUpdatedAt,
      Value<int> rowid,
    });
typedef $$LocalStudentsTableUpdateCompanionBuilder =
    LocalStudentsCompanion Function({
      Value<String> id,
      Value<String> schoolId,
      Value<String> academicYearId,
      Value<String?> matricule,
      Value<String> firstName,
      Value<String> lastName,
      Value<String?> genderLabel,
      Value<String?> birthDate,
      Value<String?> lieuNaissance,
      Value<String?> ecoleProvenance,
      Value<String?> classId,
      Value<String?> className,
      Value<DateTime?> remoteUpdatedAt,
      Value<int> rowid,
    });

class $$LocalStudentsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalStudentsTable> {
  $$LocalStudentsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get schoolId => $composableBuilder(
    column: $table.schoolId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get academicYearId => $composableBuilder(
    column: $table.academicYearId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get matricule => $composableBuilder(
    column: $table.matricule,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get firstName => $composableBuilder(
    column: $table.firstName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lastName => $composableBuilder(
    column: $table.lastName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get genderLabel => $composableBuilder(
    column: $table.genderLabel,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get birthDate => $composableBuilder(
    column: $table.birthDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lieuNaissance => $composableBuilder(
    column: $table.lieuNaissance,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get ecoleProvenance => $composableBuilder(
    column: $table.ecoleProvenance,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get classId => $composableBuilder(
    column: $table.classId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get className => $composableBuilder(
    column: $table.className,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get remoteUpdatedAt => $composableBuilder(
    column: $table.remoteUpdatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalStudentsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalStudentsTable> {
  $$LocalStudentsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get schoolId => $composableBuilder(
    column: $table.schoolId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get academicYearId => $composableBuilder(
    column: $table.academicYearId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get matricule => $composableBuilder(
    column: $table.matricule,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get firstName => $composableBuilder(
    column: $table.firstName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lastName => $composableBuilder(
    column: $table.lastName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get genderLabel => $composableBuilder(
    column: $table.genderLabel,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get birthDate => $composableBuilder(
    column: $table.birthDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lieuNaissance => $composableBuilder(
    column: $table.lieuNaissance,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get ecoleProvenance => $composableBuilder(
    column: $table.ecoleProvenance,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get classId => $composableBuilder(
    column: $table.classId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get className => $composableBuilder(
    column: $table.className,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get remoteUpdatedAt => $composableBuilder(
    column: $table.remoteUpdatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalStudentsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalStudentsTable> {
  $$LocalStudentsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get schoolId =>
      $composableBuilder(column: $table.schoolId, builder: (column) => column);

  GeneratedColumn<String> get academicYearId => $composableBuilder(
    column: $table.academicYearId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get matricule =>
      $composableBuilder(column: $table.matricule, builder: (column) => column);

  GeneratedColumn<String> get firstName =>
      $composableBuilder(column: $table.firstName, builder: (column) => column);

  GeneratedColumn<String> get lastName =>
      $composableBuilder(column: $table.lastName, builder: (column) => column);

  GeneratedColumn<String> get genderLabel => $composableBuilder(
    column: $table.genderLabel,
    builder: (column) => column,
  );

  GeneratedColumn<String> get birthDate =>
      $composableBuilder(column: $table.birthDate, builder: (column) => column);

  GeneratedColumn<String> get lieuNaissance => $composableBuilder(
    column: $table.lieuNaissance,
    builder: (column) => column,
  );

  GeneratedColumn<String> get ecoleProvenance => $composableBuilder(
    column: $table.ecoleProvenance,
    builder: (column) => column,
  );

  GeneratedColumn<String> get classId =>
      $composableBuilder(column: $table.classId, builder: (column) => column);

  GeneratedColumn<String> get className =>
      $composableBuilder(column: $table.className, builder: (column) => column);

  GeneratedColumn<DateTime> get remoteUpdatedAt => $composableBuilder(
    column: $table.remoteUpdatedAt,
    builder: (column) => column,
  );
}

class $$LocalStudentsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalStudentsTable,
          LocalStudent,
          $$LocalStudentsTableFilterComposer,
          $$LocalStudentsTableOrderingComposer,
          $$LocalStudentsTableAnnotationComposer,
          $$LocalStudentsTableCreateCompanionBuilder,
          $$LocalStudentsTableUpdateCompanionBuilder,
          (
            LocalStudent,
            BaseReferences<_$AppDatabase, $LocalStudentsTable, LocalStudent>,
          ),
          LocalStudent,
          PrefetchHooks Function()
        > {
  $$LocalStudentsTableTableManager(_$AppDatabase db, $LocalStudentsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalStudentsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalStudentsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalStudentsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> schoolId = const Value.absent(),
                Value<String> academicYearId = const Value.absent(),
                Value<String?> matricule = const Value.absent(),
                Value<String> firstName = const Value.absent(),
                Value<String> lastName = const Value.absent(),
                Value<String?> genderLabel = const Value.absent(),
                Value<String?> birthDate = const Value.absent(),
                Value<String?> lieuNaissance = const Value.absent(),
                Value<String?> ecoleProvenance = const Value.absent(),
                Value<String?> classId = const Value.absent(),
                Value<String?> className = const Value.absent(),
                Value<DateTime?> remoteUpdatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalStudentsCompanion(
                id: id,
                schoolId: schoolId,
                academicYearId: academicYearId,
                matricule: matricule,
                firstName: firstName,
                lastName: lastName,
                genderLabel: genderLabel,
                birthDate: birthDate,
                lieuNaissance: lieuNaissance,
                ecoleProvenance: ecoleProvenance,
                classId: classId,
                className: className,
                remoteUpdatedAt: remoteUpdatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String schoolId,
                required String academicYearId,
                Value<String?> matricule = const Value.absent(),
                required String firstName,
                required String lastName,
                Value<String?> genderLabel = const Value.absent(),
                Value<String?> birthDate = const Value.absent(),
                Value<String?> lieuNaissance = const Value.absent(),
                Value<String?> ecoleProvenance = const Value.absent(),
                Value<String?> classId = const Value.absent(),
                Value<String?> className = const Value.absent(),
                Value<DateTime?> remoteUpdatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalStudentsCompanion.insert(
                id: id,
                schoolId: schoolId,
                academicYearId: academicYearId,
                matricule: matricule,
                firstName: firstName,
                lastName: lastName,
                genderLabel: genderLabel,
                birthDate: birthDate,
                lieuNaissance: lieuNaissance,
                ecoleProvenance: ecoleProvenance,
                classId: classId,
                className: className,
                remoteUpdatedAt: remoteUpdatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalStudentsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalStudentsTable,
      LocalStudent,
      $$LocalStudentsTableFilterComposer,
      $$LocalStudentsTableOrderingComposer,
      $$LocalStudentsTableAnnotationComposer,
      $$LocalStudentsTableCreateCompanionBuilder,
      $$LocalStudentsTableUpdateCompanionBuilder,
      (
        LocalStudent,
        BaseReferences<_$AppDatabase, $LocalStudentsTable, LocalStudent>,
      ),
      LocalStudent,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$SyncStatesTableTableManager get syncStates =>
      $$SyncStatesTableTableManager(_db, _db.syncStates);
  $$LocalClassesTableTableManager get localClasses =>
      $$LocalClassesTableTableManager(_db, _db.localClasses);
  $$LocalStudentsTableTableManager get localStudents =>
      $$LocalStudentsTableTableManager(_db, _db.localStudents);
}
