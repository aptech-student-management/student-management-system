import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/department_api.dart';
import '../models/department.dart';
import '../providers/auth_provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Future<List<Department>> _departmentsFuture;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = context.read<AuthProvider>();
    _departmentsFuture = DepartmentApi.getDepartments(auth.accessToken!);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FB),
      appBar: AppBar(
        title: const Text('Student Management'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF111827),
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () {
              auth.logout();
            },
            icon: const Icon(Icons.logout),
            tooltip: 'Đăng xuất',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Danh sách khoa (Departments)',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: FutureBuilder<List<Department>>(
                future: _departmentsFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(
                      child: CircularProgressIndicator(),
                    );
                  }
                  if (snapshot.hasError) {
                    return Center(
                      child: Text(
                        snapshot.error.toString(),
                        style: const TextStyle(color: Colors.red),
                      ),
                    );
                  }
                  final departments = snapshot.data ?? [];
                  if (departments.isEmpty) {
                    return const Center(
                      child: Text('Chưa có khoa nào'),
                    );
                  }
                  return ListView.separated(
                    itemCount: departments.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final d = departments[index];
                      return Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.03),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              d.name,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Mã khoa: ${d.code}',
                              style: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                            if (d.description != null &&
                                d.description!.trim().isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  d.description!,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: Color(0xFF4B5563),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

