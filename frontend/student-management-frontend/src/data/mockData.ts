import type {
  User,
  Department,
  Class,
  Subject,
  Semester,
  CourseSection,
  Enrollment,
  Attendance,
  Grade,
  AuditLog } from
'../types';

export const departments: Department[] = [
{
  id: 'd1',
  name: 'Khoa Công nghệ Thông tin',
  code: 'CNTT',
  headLecturerId: 'l1',
  studentCount: 320,
  subjectCount: 45,
  description: 'Đào tạo kỹ sư CNTT chất lượng cao'
},
{
  id: 'd2',
  name: 'Khoa Kinh tế',
  code: 'KT',
  headLecturerId: 'l2',
  studentCount: 280,
  subjectCount: 38,
  description: 'Đào tạo cử nhân kinh tế và quản trị kinh doanh'
},
{
  id: 'd3',
  name: 'Khoa Ngoại ngữ',
  code: 'NN',
  headLecturerId: 'l3',
  studentCount: 190,
  subjectCount: 30,
  description: 'Đào tạo ngôn ngữ Anh, Nhật, Trung'
},
{
  id: 'd4',
  name: 'Khoa Kỹ thuật',
  code: 'KTH',
  headLecturerId: 'l4',
  studentCount: 240,
  subjectCount: 42,
  description: 'Đào tạo kỹ sư cơ khí và điện tử'
},
{
  id: 'd5',
  name: 'Khoa Khoa học Cơ bản',
  code: 'KHCB',
  headLecturerId: 'l5',
  studentCount: 150,
  subjectCount: 25,
  description: 'Đào tạo toán, lý, hóa cơ bản'
}];


export const classes: Class[] = [
{
  id: 'c1',
  name: 'CNTT K1 2022',
  code: 'CNTT-K1-22',
  departmentId: 'd1',
  year: 2022,
  studentCount: 45
},
{
  id: 'c2',
  name: 'CNTT K2 2022',
  code: 'CNTT-K2-22',
  departmentId: 'd1',
  year: 2022,
  studentCount: 42
},
{
  id: 'c3',
  name: 'CNTT K1 2023',
  code: 'CNTT-K1-23',
  departmentId: 'd1',
  year: 2023,
  studentCount: 48
},
{
  id: 'c4',
  name: 'Kinh tế K1 2022',
  code: 'KT-K1-22',
  departmentId: 'd2',
  year: 2022,
  studentCount: 50
},
{
  id: 'c5',
  name: 'Kinh tế K2 2022',
  code: 'KT-K2-22',
  departmentId: 'd2',
  year: 2022,
  studentCount: 47
},
{
  id: 'c6',
  name: 'Ngoại ngữ K1 2022',
  code: 'NN-K1-22',
  departmentId: 'd3',
  year: 2022,
  studentCount: 38
},
{
  id: 'c7',
  name: 'Kỹ thuật K1 2022',
  code: 'KTH-K1-22',
  departmentId: 'd4',
  year: 2022,
  studentCount: 44
},
{
  id: 'c8',
  name: 'Kỹ thuật K2 2022',
  code: 'KTH-K2-22',
  departmentId: 'd4',
  year: 2022,
  studentCount: 41
},
{
  id: 'c9',
  name: 'KHCB K1 2022',
  code: 'KHCB-K1-22',
  departmentId: 'd5',
  year: 2022,
  studentCount: 35
},
{
  id: 'c10',
  name: 'CNTT K1 2021',
  code: 'CNTT-K1-21',
  departmentId: 'd1',
  year: 2021,
  studentCount: 43
}];


export const subjects: Subject[] = [
{
  id: 's1',
  name: 'Lập trình Hướng đối tượng',
  code: 'OOP101',
  credits: 3,
  departmentId: 'd1',
  description: 'Các khái niệm OOP với Java/C++'
},
{
  id: 's2',
  name: 'Cơ sở Dữ liệu',
  code: 'DB201',
  credits: 3,
  departmentId: 'd1',
  description: 'Thiết kế và quản lý CSDL quan hệ'
},
{
  id: 's3',
  name: 'Mạng Máy tính',
  code: 'NET301',
  credits: 3,
  departmentId: 'd1',
  description: 'Giao thức mạng và bảo mật'
},
{
  id: 's4',
  name: 'Trí tuệ Nhân tạo',
  code: 'AI401',
  credits: 4,
  departmentId: 'd1',
  description: 'Machine Learning và Deep Learning cơ bản'
},
{
  id: 's5',
  name: 'Phát triển Web',
  code: 'WEB201',
  credits: 3,
  departmentId: 'd1',
  description: 'HTML, CSS, JavaScript, React'
},
{
  id: 's6',
  name: 'Kinh tế Vi mô',
  code: 'MICRO101',
  credits: 3,
  departmentId: 'd2',
  description: 'Lý thuyết kinh tế vi mô'
},
{
  id: 's7',
  name: 'Quản trị Kinh doanh',
  code: 'BUS201',
  credits: 3,
  departmentId: 'd2',
  description: 'Quản lý doanh nghiệp hiện đại'
},
{
  id: 's8',
  name: 'Kế toán Tài chính',
  code: 'ACC301',
  credits: 4,
  departmentId: 'd2',
  description: 'Nguyên lý kế toán và báo cáo tài chính'
},
{
  id: 's9',
  name: 'Tiếng Anh Chuyên ngành',
  code: 'ENG201',
  credits: 2,
  departmentId: 'd3',
  description: 'Tiếng Anh kỹ thuật và kinh doanh'
},
{
  id: 's10',
  name: 'Tiếng Nhật Cơ bản',
  code: 'JPN101',
  credits: 3,
  departmentId: 'd3',
  description: 'Nhật ngữ N5-N4'
},
{
  id: 's11',
  name: 'Cơ học Kỹ thuật',
  code: 'MECH201',
  credits: 3,
  departmentId: 'd4',
  description: 'Cơ học vật rắn và lưu chất'
},
{
  id: 's12',
  name: 'Điện tử Cơ bản',
  code: 'ELEC101',
  credits: 3,
  departmentId: 'd4',
  description: 'Mạch điện và linh kiện điện tử'
},
{
  id: 's13',
  name: 'Giải tích',
  code: 'CALC101',
  credits: 4,
  departmentId: 'd5',
  description: 'Giải tích 1 và 2'
},
{
  id: 's14',
  name: 'Đại số Tuyến tính',
  code: 'LALG101',
  credits: 3,
  departmentId: 'd5',
  description: 'Ma trận, vector, không gian tuyến tính'
},
{
  id: 's15',
  name: 'Xác suất Thống kê',
  code: 'STAT201',
  credits: 3,
  departmentId: 'd5',
  description: 'Lý thuyết xác suất và thống kê ứng dụng'
}];


export const semesters: Semester[] = [
{
  id: 'sem1',
  name: 'Học kỳ 1 2024-2025',
  year: '2024-2025',
  startDate: '2024-09-01',
  endDate: '2025-01-15',
  status: 'ACTIVE'
},
{
  id: 'sem2',
  name: 'Học kỳ 2 2024-2025',
  year: '2024-2025',
  startDate: '2025-02-01',
  endDate: '2025-06-30',
  status: 'UPCOMING'
},
{
  id: 'sem3',
  name: 'Học kỳ 1 2023-2024',
  year: '2023-2024',
  startDate: '2023-09-01',
  endDate: '2024-01-15',
  status: 'CLOSED'
}];


export const courseSections: CourseSection[] = [
{
  id: 'cs1',
  subjectId: 's1',
  semesterId: 'sem1',
  lecturerId: 'l1',
  classId: 'c1',
  schedule: 'Thứ 2 (Tiết 1-3)',
  room: 'A101',
  maxStudents: 45,
  enrolledCount: 38,
  status: 'OPEN'
},
{
  id: 'cs2',
  subjectId: 's2',
  semesterId: 'sem1',
  lecturerId: 'l1',
  classId: 'c1',
  schedule: 'Thứ 4 (Tiết 4-6)',
  room: 'A102',
  maxStudents: 45,
  enrolledCount: 40,
  status: 'OPEN'
},
{
  id: 'cs3',
  subjectId: 's3',
  semesterId: 'sem1',
  lecturerId: 'l2',
  classId: 'c2',
  schedule: 'Thứ 3 (Tiết 1-3)',
  room: 'B201',
  maxStudents: 42,
  enrolledCount: 42,
  status: 'FULL'
},
{
  id: 'cs4',
  subjectId: 's4',
  semesterId: 'sem1',
  lecturerId: 'l2',
  classId: 'c3',
  schedule: 'Thứ 5 (Tiết 7-9)',
  room: 'B202',
  maxStudents: 40,
  enrolledCount: 35,
  status: 'OPEN'
},
{
  id: 'cs5',
  subjectId: 's5',
  semesterId: 'sem1',
  lecturerId: 'l3',
  classId: 'c1',
  schedule: 'Thứ 6 (Tiết 1-3)',
  room: 'C301',
  maxStudents: 45,
  enrolledCount: 30,
  status: 'OPEN'
},
{
  id: 'cs6',
  subjectId: 's6',
  semesterId: 'sem1',
  lecturerId: 'l3',
  classId: 'c4',
  schedule: 'Thứ 2 (Tiết 4-6)',
  room: 'C302',
  maxStudents: 50,
  enrolledCount: 48,
  status: 'OPEN'
},
{
  id: 'cs7',
  subjectId: 's7',
  semesterId: 'sem1',
  lecturerId: 'l4',
  classId: 'c4',
  schedule: 'Thứ 3 (Tiết 7-9)',
  room: 'D401',
  maxStudents: 50,
  enrolledCount: 45,
  status: 'OPEN'
},
{
  id: 'cs8',
  subjectId: 's8',
  semesterId: 'sem1',
  lecturerId: 'l4',
  classId: 'c5',
  schedule: 'Thứ 4 (Tiết 1-3)',
  room: 'D402',
  maxStudents: 47,
  enrolledCount: 47,
  status: 'FULL'
},
{
  id: 'cs9',
  subjectId: 's9',
  semesterId: 'sem1',
  lecturerId: 'l5',
  classId: 'c6',
  schedule: 'Thứ 5 (Tiết 1-3)',
  room: 'E501',
  maxStudents: 38,
  enrolledCount: 25,
  status: 'OPEN'
},
{
  id: 'cs10',
  subjectId: 's13',
  semesterId: 'sem1',
  lecturerId: 'l5',
  classId: 'c9',
  schedule: 'Thứ 6 (Tiết 4-6)',
  room: 'E502',
  maxStudents: 35,
  enrolledCount: 32,
  status: 'OPEN'
},
{
  id: 'cs11',
  subjectId: 's1',
  semesterId: 'sem3',
  lecturerId: 'l1',
  classId: 'c10',
  schedule: 'Thứ 2 (Tiết 1-3)',
  room: 'A101',
  maxStudents: 43,
  enrolledCount: 43,
  status: 'CLOSED'
},
{
  id: 'cs12',
  subjectId: 's2',
  semesterId: 'sem3',
  lecturerId: 'l1',
  classId: 'c10',
  schedule: 'Thứ 4 (Tiết 4-6)',
  room: 'A102',
  maxStudents: 43,
  enrolledCount: 43,
  status: 'CLOSED'
},
{
  id: 'cs13',
  subjectId: 's14',
  semesterId: 'sem1',
  lecturerId: 'l5',
  classId: 'c1',
  schedule: 'Thứ 2 (Tiết 7-9)',
  room: 'E503',
  maxStudents: 45,
  enrolledCount: 28,
  status: 'OPEN'
},
{
  id: 'cs14',
  subjectId: 's15',
  semesterId: 'sem1',
  lecturerId: 'l5',
  classId: 'c2',
  schedule: 'Thứ 3 (Tiết 4-6)',
  room: 'E504',
  maxStudents: 42,
  enrolledCount: 36,
  status: 'OPEN'
},
{
  id: 'cs15',
  subjectId: 's11',
  semesterId: 'sem1',
  lecturerId: 'l4',
  classId: 'c7',
  schedule: 'Thứ 5 (Tiết 4-6)',
  room: 'D403',
  maxStudents: 44,
  enrolledCount: 40,
  status: 'OPEN'
},
{
  id: 'cs16',
  subjectId: 's12',
  semesterId: 'sem1',
  lecturerId: 'l4',
  classId: 'c8',
  schedule: 'Thứ 6 (Tiết 7-9)',
  room: 'D404',
  maxStudents: 41,
  enrolledCount: 38,
  status: 'OPEN'
},
{
  id: 'cs17',
  subjectId: 's10',
  semesterId: 'sem1',
  lecturerId: 'l3',
  classId: 'c6',
  schedule: 'Thứ 2 (Tiết 1-3)',
  room: 'C303',
  maxStudents: 38,
  enrolledCount: 20,
  status: 'OPEN'
},
{
  id: 'cs18',
  subjectId: 's5',
  semesterId: 'sem3',
  lecturerId: 'l3',
  classId: 'c10',
  schedule: 'Thứ 6 (Tiết 1-3)',
  room: 'C301',
  maxStudents: 43,
  enrolledCount: 43,
  status: 'CLOSED'
},
{
  id: 'cs19',
  subjectId: 's6',
  semesterId: 'sem3',
  lecturerId: 'l2',
  classId: 'c4',
  schedule: 'Thứ 2 (Tiết 4-6)',
  room: 'C302',
  maxStudents: 50,
  enrolledCount: 50,
  status: 'CLOSED'
},
{
  id: 'cs20',
  subjectId: 's13',
  semesterId: 'sem3',
  lecturerId: 'l5',
  classId: 'c9',
  schedule: 'Thứ 6 (Tiết 4-6)',
  room: 'E502',
  maxStudents: 35,
  enrolledCount: 35,
  status: 'CLOSED'
}];


export const users: User[] = [
// Admin
{
  id: 'admin1',
  name: 'Nguyễn Văn Quản Trị',
  email: 'admin@uni.edu.vn',
  password: 'admin123',
  role: 'ADMIN',
  phone: '0901234567',
  createdAt: '2023-01-01',
  status: 'ACTIVE'
},
// Lecturers
{
  id: 'l1',
  name: 'TS. Trần Minh Khoa',
  email: 'lecturer1@uni.edu.vn',
  password: 'lecturer123',
  role: 'LECTURER',
  lecturerId: 'GV001',
  departmentId: 'd1',
  department: 'Khoa CNTT',
  phone: '0912345678',
  createdAt: '2020-08-01',
  status: 'ACTIVE'
},
{
  id: 'l2',
  name: 'ThS. Lê Thị Hương',
  email: 'lecturer2@uni.edu.vn',
  password: 'lecturer123',
  role: 'LECTURER',
  lecturerId: 'GV002',
  departmentId: 'd1',
  department: 'Khoa CNTT',
  phone: '0923456789',
  createdAt: '2019-08-01',
  status: 'ACTIVE'
},
{
  id: 'l3',
  name: 'PGS. Phạm Văn Đức',
  email: 'lecturer3@uni.edu.vn',
  password: 'lecturer123',
  role: 'LECTURER',
  lecturerId: 'GV003',
  departmentId: 'd2',
  department: 'Khoa Kinh tế',
  phone: '0934567890',
  createdAt: '2018-08-01',
  status: 'ACTIVE'
},
{
  id: 'l4',
  name: 'TS. Hoàng Thị Mai',
  email: 'lecturer4@uni.edu.vn',
  password: 'lecturer123',
  role: 'LECTURER',
  lecturerId: 'GV004',
  departmentId: 'd3',
  department: 'Khoa Ngoại ngữ',
  phone: '0945678901',
  createdAt: '2021-08-01',
  status: 'ACTIVE'
},
{
  id: 'l5',
  name: 'ThS. Vũ Quang Huy',
  email: 'lecturer5@uni.edu.vn',
  password: 'lecturer123',
  role: 'LECTURER',
  lecturerId: 'GV005',
  departmentId: 'd5',
  department: 'Khoa KHCB',
  phone: '0956789012',
  createdAt: '2022-08-01',
  status: 'ACTIVE'
},
// Students
{
  id: 'st1',
  name: 'Nguyễn Thị Lan Anh',
  email: 'student1@uni.edu.vn',
  password: 'student123',
  role: 'STUDENT',
  studentId: 'SV2022001',
  departmentId: 'd1',
  department: 'Khoa CNTT',
  classId: 'c1',
  phone: '0967890123',
  createdAt: '2022-09-01',
  status: 'ACTIVE'
},
{
  id: 'st2',
  name: 'Trần Văn Bình',
  email: 'student2@uni.edu.vn',
  password: 'student123',
  role: 'STUDENT',
  studentId: 'SV2022002',
  departmentId: 'd1',
  department: 'Khoa CNTT',
  classId: 'c1',
  phone: '0978901234',
  createdAt: '2022-09-01',
  status: 'ACTIVE'
},
{
  id: 'st3',
  name: 'Lê Thị Cẩm Tú',
  email: 'student3@uni.edu.vn',
  password: 'student123',
  role: 'STUDENT',
  studentId: 'SV2022003',
  departmentId: 'd1',
  department: 'Khoa CNTT',
  classId: 'c1',
  phone: '0989012345',
  createdAt: '2022-09-01',
  status: 'ACTIVE'
},
{
  id: 'st4',
  name: 'Phạm Minh Dũng',
  email: 'student4@uni.edu.vn',
  password: 'student123',
  role: 'STUDENT',
  studentId: 'SV2022004',
  departmentId: 'd1',
  department: 'Khoa CNTT',
  classId: 'c2',
  phone: '0990123456',
  createdAt: '2022-09-01',
  status: 'ACTIVE'
},
{
  id: 'st5',
  name: 'Hoàng Thị Emm',
  email: 'student5@uni.edu.vn',
  password: 'student123',
  role: 'STUDENT',
  studentId: 'SV2022005',
  departmentId: 'd1',
  department: 'Khoa CNTT',
  classId: 'c2',
  phone: '0901234568',
  createdAt: '2022-09-01',
  status: 'ACTIVE'
},
{
  id: 'st6',
  name: 'Vũ Văn Phong',
  email: 'student6@uni.edu.vn',
  password: 'student123',
  role: 'STUDENT',
  studentId: 'SV2022006',
  departmentId: 'd2',
  department: 'Khoa Kinh tế',
  classId: 'c4',
  phone: '0912345679',
  createdAt: '2022-09-01',
  status: 'ACTIVE'
},
{
  id: 'st7',
  name: 'Đặng Thị Giang',
  email: 'student7@uni.edu.vn',
  password: 'student123',
  role: 'STUDENT',
  studentId: 'SV2022007',
  departmentId: 'd2',
  department: 'Khoa Kinh tế',
  classId: 'c4',
  phone: '0923456780',
  createdAt: '2022-09-01',
  status: 'ACTIVE'
},
{
  id: 'st8',
  name: 'Bùi Quang Hải',
  email: 'student8@uni.edu.vn',
  password: 'student123',
  role: 'STUDENT',
  studentId: 'SV2022008',
  departmentId: 'd1',
  department: 'Khoa CNTT',
  classId: 'c1',
  phone: '0934567891',
  createdAt: '2022-09-01',
  status: 'ACTIVE'
},
{
  id: 'st9',
  name: 'Ngô Thị Hoa',
  email: 'student9@uni.edu.vn',
  password: 'student123',
  role: 'STUDENT',
  studentId: 'SV2022009',
  departmentId: 'd3',
  department: 'Khoa Ngoại ngữ',
  classId: 'c6',
  phone: '0945678902',
  createdAt: '2022-09-01',
  status: 'ACTIVE'
},
{
  id: 'st10',
  name: 'Đinh Văn Ích',
  email: 'student10@uni.edu.vn',
  password: 'student123',
  role: 'STUDENT',
  studentId: 'SV2022010',
  departmentId: 'd4',
  department: 'Khoa Kỹ thuật',
  classId: 'c7',
  phone: '0956789013',
  createdAt: '2022-09-01',
  status: 'ACTIVE'
},
{
  id: 'st11',
  name: 'Lý Thị Kim',
  email: 'student11@uni.edu.vn',
  password: 'student123',
  role: 'STUDENT',
  studentId: 'SV2022011',
  departmentId: 'd1',
  department: 'Khoa CNTT',
  classId: 'c1',
  phone: '0967890124',
  createdAt: '2022-09-01',
  status: 'ACTIVE'
},
{
  id: 'st12',
  name: 'Trương Văn Long',
  email: 'student12@uni.edu.vn',
  password: 'student123',
  role: 'STUDENT',
  studentId: 'SV2022012',
  departmentId: 'd1',
  department: 'Khoa CNTT',
  classId: 'c2',
  phone: '0978901235',
  createdAt: '2022-09-01',
  status: 'ACTIVE'
},
{
  id: 'st13',
  name: 'Phan Thị Minh',
  email: 'student13@uni.edu.vn',
  password: 'student123',
  role: 'STUDENT',
  studentId: 'SV2022013',
  departmentId: 'd2',
  department: 'Khoa Kinh tế',
  classId: 'c5',
  phone: '0989012346',
  createdAt: '2022-09-01',
  status: 'ACTIVE'
},
{
  id: 'st14',
  name: 'Cao Văn Nam',
  email: 'student14@uni.edu.vn',
  password: 'student123',
  role: 'STUDENT',
  studentId: 'SV2022014',
  departmentId: 'd5',
  department: 'Khoa KHCB',
  classId: 'c9',
  phone: '0990123457',
  createdAt: '2022-09-01',
  status: 'ACTIVE'
},
{
  id: 'st15',
  name: 'Tô Thị Oanh',
  email: 'student15@uni.edu.vn',
  password: 'student123',
  role: 'STUDENT',
  studentId: 'SV2022015',
  departmentId: 'd1',
  department: 'Khoa CNTT',
  classId: 'c3',
  phone: '0901234569',
  createdAt: '2022-09-01',
  status: 'ACTIVE'
}];


export const enrollments: Enrollment[] = [
// student1 (st1) enrolled in cs1, cs2, cs5, cs13
{
  id: 'e1',
  studentId: 'st1',
  courseSectionId: 'cs1',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
{
  id: 'e2',
  studentId: 'st1',
  courseSectionId: 'cs2',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
{
  id: 'e3',
  studentId: 'st1',
  courseSectionId: 'cs5',
  enrolledAt: '2024-09-06',
  status: 'ENROLLED'
},
{
  id: 'e4',
  studentId: 'st1',
  courseSectionId: 'cs13',
  enrolledAt: '2024-09-06',
  status: 'ENROLLED'
},
// student1 past semester
{
  id: 'e5',
  studentId: 'st1',
  courseSectionId: 'cs11',
  enrolledAt: '2023-09-05',
  status: 'ENROLLED'
},
{
  id: 'e6',
  studentId: 'st1',
  courseSectionId: 'cs12',
  enrolledAt: '2023-09-05',
  status: 'ENROLLED'
},
{
  id: 'e7',
  studentId: 'st1',
  courseSectionId: 'cs18',
  enrolledAt: '2023-09-06',
  status: 'ENROLLED'
},
// student2
{
  id: 'e8',
  studentId: 'st2',
  courseSectionId: 'cs1',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
{
  id: 'e9',
  studentId: 'st2',
  courseSectionId: 'cs2',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
{
  id: 'e10',
  studentId: 'st2',
  courseSectionId: 'cs13',
  enrolledAt: '2024-09-06',
  status: 'ENROLLED'
},
// student3
{
  id: 'e11',
  studentId: 'st3',
  courseSectionId: 'cs1',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
{
  id: 'e12',
  studentId: 'st3',
  courseSectionId: 'cs2',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
{
  id: 'e13',
  studentId: 'st3',
  courseSectionId: 'cs5',
  enrolledAt: '2024-09-06',
  status: 'ENROLLED'
},
// student8
{
  id: 'e14',
  studentId: 'st8',
  courseSectionId: 'cs1',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
{
  id: 'e15',
  studentId: 'st8',
  courseSectionId: 'cs2',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
// student11
{
  id: 'e16',
  studentId: 'st11',
  courseSectionId: 'cs1',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
{
  id: 'e17',
  studentId: 'st11',
  courseSectionId: 'cs5',
  enrolledAt: '2024-09-06',
  status: 'ENROLLED'
},
// student4
{
  id: 'e18',
  studentId: 'st4',
  courseSectionId: 'cs3',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
{
  id: 'e19',
  studentId: 'st4',
  courseSectionId: 'cs4',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
// student5
{
  id: 'e20',
  studentId: 'st5',
  courseSectionId: 'cs3',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
{
  id: 'e21',
  studentId: 'st5',
  courseSectionId: 'cs14',
  enrolledAt: '2024-09-06',
  status: 'ENROLLED'
},
// student6
{
  id: 'e22',
  studentId: 'st6',
  courseSectionId: 'cs6',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
{
  id: 'e23',
  studentId: 'st6',
  courseSectionId: 'cs7',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
// student7
{
  id: 'e24',
  studentId: 'st7',
  courseSectionId: 'cs6',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
{
  id: 'e25',
  studentId: 'st7',
  courseSectionId: 'cs7',
  enrolledAt: '2024-09-05',
  status: 'ENROLLED'
},
// past semester enrollments for student1
{
  id: 'e26',
  studentId: 'st1',
  courseSectionId: 'cs20',
  enrolledAt: '2023-09-05',
  status: 'ENROLLED'
}];


export const attendanceRecords: Attendance[] = [
// cs1 attendance for multiple students
{
  id: 'att1',
  studentId: 'st1',
  courseSectionId: 'cs1',
  date: '2024-09-09',
  status: 'PRESENT'
},
{
  id: 'att2',
  studentId: 'st1',
  courseSectionId: 'cs1',
  date: '2024-09-16',
  status: 'PRESENT'
},
{
  id: 'att3',
  studentId: 'st1',
  courseSectionId: 'cs1',
  date: '2024-09-23',
  status: 'LATE'
},
{
  id: 'att4',
  studentId: 'st1',
  courseSectionId: 'cs1',
  date: '2024-09-30',
  status: 'PRESENT'
},
{
  id: 'att5',
  studentId: 'st1',
  courseSectionId: 'cs1',
  date: '2024-10-07',
  status: 'PRESENT'
},
{
  id: 'att6',
  studentId: 'st1',
  courseSectionId: 'cs1',
  date: '2024-10-14',
  status: 'ABSENT'
},
{
  id: 'att7',
  studentId: 'st2',
  courseSectionId: 'cs1',
  date: '2024-09-09',
  status: 'PRESENT'
},
{
  id: 'att8',
  studentId: 'st2',
  courseSectionId: 'cs1',
  date: '2024-09-16',
  status: 'ABSENT'
},
{
  id: 'att9',
  studentId: 'st2',
  courseSectionId: 'cs1',
  date: '2024-09-23',
  status: 'PRESENT'
},
{
  id: 'att10',
  studentId: 'st2',
  courseSectionId: 'cs1',
  date: '2024-09-30',
  status: 'PRESENT'
},
{
  id: 'att11',
  studentId: 'st3',
  courseSectionId: 'cs1',
  date: '2024-09-09',
  status: 'PRESENT'
},
{
  id: 'att12',
  studentId: 'st3',
  courseSectionId: 'cs1',
  date: '2024-09-16',
  status: 'PRESENT'
},
{
  id: 'att13',
  studentId: 'st3',
  courseSectionId: 'cs1',
  date: '2024-09-23',
  status: 'PRESENT'
},
{
  id: 'att14',
  studentId: 'st8',
  courseSectionId: 'cs1',
  date: '2024-09-09',
  status: 'LATE'
},
{
  id: 'att15',
  studentId: 'st8',
  courseSectionId: 'cs1',
  date: '2024-09-16',
  status: 'PRESENT'
},
{
  id: 'att16',
  studentId: 'st11',
  courseSectionId: 'cs1',
  date: '2024-09-09',
  status: 'PRESENT'
},
{
  id: 'att17',
  studentId: 'st11',
  courseSectionId: 'cs1',
  date: '2024-09-16',
  status: 'PRESENT'
}];


export const grades: Grade[] = [
// Current semester grades (partial)
{
  id: 'g1',
  studentId: 'st1',
  courseSectionId: 'cs1',
  midterm: 7.5,
  final: 8.0,
  attendanceScore: 8.5,
  totalScore: 7.9,
  letterGrade: 'B',
  gpaPoint: 3.0,
  updatedBy: 'l1',
  updatedAt: '2024-11-20'
},
{
  id: 'g2',
  studentId: 'st2',
  courseSectionId: 'cs1',
  midterm: 6.5,
  final: 7.0,
  attendanceScore: 7.0,
  totalScore: 6.85,
  letterGrade: 'C+',
  gpaPoint: 2.5,
  updatedBy: 'l1',
  updatedAt: '2024-11-20'
},
{
  id: 'g3',
  studentId: 'st3',
  courseSectionId: 'cs1',
  midterm: 8.5,
  final: 9.0,
  attendanceScore: 9.5,
  totalScore: 8.9,
  letterGrade: 'A',
  gpaPoint: 4.0,
  updatedBy: 'l1',
  updatedAt: '2024-11-20'
},
{
  id: 'g4',
  studentId: 'st8',
  courseSectionId: 'cs1',
  midterm: 5.0,
  final: 5.5,
  attendanceScore: 6.0,
  totalScore: 5.45,
  letterGrade: 'D+',
  gpaPoint: 1.5,
  updatedBy: 'l1',
  updatedAt: '2024-11-20'
},
{
  id: 'g5',
  studentId: 'st11',
  courseSectionId: 'cs1',
  midterm: 7.0,
  final: 7.5,
  attendanceScore: 8.0,
  totalScore: 7.4,
  letterGrade: 'B',
  gpaPoint: 3.0,
  updatedBy: 'l1',
  updatedAt: '2024-11-20'
},
// cs2 grades
{
  id: 'g6',
  studentId: 'st1',
  courseSectionId: 'cs2',
  midterm: 8.0,
  final: 8.5,
  attendanceScore: 9.0,
  totalScore: 8.35,
  letterGrade: 'B+',
  gpaPoint: 3.5,
  updatedBy: 'l1',
  updatedAt: '2024-11-21'
},
{
  id: 'g7',
  studentId: 'st2',
  courseSectionId: 'cs2',
  midterm: 7.0,
  final: 7.5,
  attendanceScore: 8.0,
  totalScore: 7.4,
  letterGrade: 'B',
  gpaPoint: 3.0,
  updatedBy: 'l1',
  updatedAt: '2024-11-21'
},
// Past semester grades for student1
{
  id: 'g8',
  studentId: 'st1',
  courseSectionId: 'cs11',
  midterm: 7.0,
  final: 8.0,
  attendanceScore: 8.5,
  totalScore: 7.75,
  letterGrade: 'B',
  gpaPoint: 3.0,
  updatedBy: 'l1',
  updatedAt: '2024-01-10'
},
{
  id: 'g9',
  studentId: 'st1',
  courseSectionId: 'cs12',
  midterm: 8.5,
  final: 9.0,
  attendanceScore: 9.5,
  totalScore: 8.9,
  letterGrade: 'A',
  gpaPoint: 4.0,
  updatedBy: 'l1',
  updatedAt: '2024-01-10'
},
{
  id: 'g10',
  studentId: 'st1',
  courseSectionId: 'cs18',
  midterm: 7.5,
  final: 8.0,
  attendanceScore: 8.0,
  totalScore: 7.9,
  letterGrade: 'B',
  gpaPoint: 3.0,
  updatedBy: 'l3',
  updatedAt: '2024-01-11'
},
{
  id: 'g11',
  studentId: 'st1',
  courseSectionId: 'cs20',
  midterm: 9.0,
  final: 9.5,
  attendanceScore: 10.0,
  totalScore: 9.35,
  letterGrade: 'A',
  gpaPoint: 4.0,
  updatedBy: 'l5',
  updatedAt: '2024-01-12'
},
// More grades for other students
{
  id: 'g12',
  studentId: 'st3',
  courseSectionId: 'cs2',
  midterm: 9.0,
  final: 9.5,
  attendanceScore: 10.0,
  totalScore: 9.35,
  letterGrade: 'A',
  gpaPoint: 4.0,
  updatedBy: 'l1',
  updatedAt: '2024-11-21'
},
{
  id: 'g13',
  studentId: 'st6',
  courseSectionId: 'cs6',
  midterm: 6.0,
  final: 6.5,
  attendanceScore: 7.0,
  totalScore: 6.4,
  letterGrade: 'C',
  gpaPoint: 2.0,
  updatedBy: 'l3',
  updatedAt: '2024-11-22'
},
{
  id: 'g14',
  studentId: 'st7',
  courseSectionId: 'cs6',
  midterm: 7.5,
  final: 8.0,
  attendanceScore: 8.5,
  totalScore: 7.9,
  letterGrade: 'B',
  gpaPoint: 3.0,
  updatedBy: 'l3',
  updatedAt: '2024-11-22'
}];


export const auditLogs: AuditLog[] = [
{
  id: 'al1',
  userId: 'l1',
  userName: 'TS. Trần Minh Khoa',
  action: 'UPDATE',
  target: 'Điểm số',
  detail: 'Cập nhật điểm môn OOP101 cho lớp CNTT-K1-22',
  timestamp: '2024-11-21 14:30:00'
},
{
  id: 'al2',
  userId: 'l1',
  userName: 'TS. Trần Minh Khoa',
  action: 'UPDATE',
  target: 'Điểm số',
  detail: 'Cập nhật điểm môn DB201 cho lớp CNTT-K1-22',
  timestamp: '2024-11-21 15:00:00'
},
{
  id: 'al3',
  userId: 'admin1',
  userName: 'Nguyễn Văn Quản Trị',
  action: 'CREATE',
  target: 'Lớp học phần',
  detail: 'Mở lớp học phần AI401 - Học kỳ 1 2024-2025',
  timestamp: '2024-09-01 08:00:00'
},
{
  id: 'al4',
  userId: 'admin1',
  userName: 'Nguyễn Văn Quản Trị',
  action: 'CREATE',
  target: 'Tài khoản',
  detail: 'Tạo tài khoản sinh viên SV2022015 - Tô Thị Oanh',
  timestamp: '2024-09-02 09:15:00'
},
{
  id: 'al5',
  userId: 'st1',
  userName: 'Nguyễn Thị Lan Anh',
  action: 'CREATE',
  target: 'Đăng ký môn',
  detail: 'Đăng ký môn OOP101 - Lớp học phần cs1',
  timestamp: '2024-09-05 10:00:00'
},
{
  id: 'al6',
  userId: 'l3',
  userName: 'PGS. Phạm Văn Đức',
  action: 'UPDATE',
  target: 'Điểm danh',
  detail: 'Cập nhật điểm danh lớp KT-K1-22 ngày 2024-11-18',
  timestamp: '2024-11-18 11:30:00'
},
{
  id: 'al7',
  userId: 'admin1',
  userName: 'Nguyễn Văn Quản Trị',
  action: 'DELETE',
  target: 'Đăng ký môn',
  detail: 'Xóa đăng ký môn của sinh viên SV2022003 - môn NET301',
  timestamp: '2024-09-10 14:00:00'
},
{
  id: 'al8',
  userId: 'admin1',
  userName: 'Nguyễn Văn Quản Trị',
  action: 'LOGIN',
  target: 'Hệ thống',
  detail: 'Đăng nhập thành công từ IP 192.168.1.1',
  timestamp: '2024-11-22 08:00:00'
},
{
  id: 'al9',
  userId: 'l2',
  userName: 'ThS. Lê Thị Hương',
  action: 'UPDATE',
  target: 'Điểm số',
  detail: 'Cập nhật điểm môn NET301 cho lớp CNTT-K2-22',
  timestamp: '2024-11-20 16:00:00'
},
{
  id: 'al10',
  userId: 'st2',
  userName: 'Trần Văn Bình',
  action: 'CREATE',
  target: 'Đăng ký môn',
  detail: 'Đăng ký môn DB201 - Lớp học phần cs2',
  timestamp: '2024-09-05 10:30:00'
},
{
  id: 'al11',
  userId: 'admin1',
  userName: 'Nguyễn Văn Quản Trị',
  action: 'UPDATE',
  target: 'Học kỳ',
  detail: 'Cập nhật trạng thái HK2 2024-2025 thành UPCOMING',
  timestamp: '2024-11-01 09:00:00'
},
{
  id: 'al12',
  userId: 'l4',
  userName: 'TS. Hoàng Thị Mai',
  action: 'UPDATE',
  target: 'Điểm danh',
  detail: 'Cập nhật điểm danh lớp KTH-K1-22 ngày 2024-11-19',
  timestamp: '2024-11-19 12:00:00'
},
{
  id: 'al13',
  userId: 'admin1',
  userName: 'Nguyễn Văn Quản Trị',
  action: 'CREATE',
  target: 'Môn học',
  detail: 'Thêm môn học mới: Trí tuệ Nhân tạo (AI401)',
  timestamp: '2024-08-15 10:00:00'
},
{
  id: 'al14',
  userId: 'l5',
  userName: 'ThS. Vũ Quang Huy',
  action: 'EXPORT',
  target: 'Bảng điểm',
  detail: 'Xuất bảng điểm môn CALC101 ra PDF',
  timestamp: '2024-11-22 11:00:00'
},
{
  id: 'al15',
  userId: 'st3',
  userName: 'Lê Thị Cẩm Tú',
  action: 'CREATE',
  target: 'Đăng ký môn',
  detail: 'Đăng ký môn WEB201 - Lớp học phần cs5',
  timestamp: '2024-09-06 09:00:00'
},
{
  id: 'al16',
  userId: 'admin1',
  userName: 'Nguyễn Văn Quản Trị',
  action: 'UPDATE',
  target: 'Tài khoản',
  detail: 'Cập nhật thông tin giảng viên GV003 - PGS. Phạm Văn Đức',
  timestamp: '2024-10-01 14:00:00'
},
{
  id: 'al17',
  userId: 'l1',
  userName: 'TS. Trần Minh Khoa',
  action: 'LOGIN',
  target: 'Hệ thống',
  detail: 'Đăng nhập thành công từ IP 192.168.1.50',
  timestamp: '2024-11-22 07:45:00'
},
{
  id: 'al18',
  userId: 'admin1',
  userName: 'Nguyễn Văn Quản Trị',
  action: 'CREATE',
  target: 'Khoa',
  detail: 'Thêm khoa mới: Khoa Khoa học Cơ bản (KHCB)',
  timestamp: '2023-01-15 10:00:00'
},
{
  id: 'al19',
  userId: 'l2',
  userName: 'ThS. Lê Thị Hương',
  action: 'UPDATE',
  target: 'Điểm số',
  detail: 'Khóa bảng điểm môn NET301 - HK1 2024-2025',
  timestamp: '2024-11-21 17:00:00'
},
{
  id: 'al20',
  userId: 'st1',
  userName: 'Nguyễn Thị Lan Anh',
  action: 'LOGIN',
  target: 'Hệ thống',
  detail: 'Đăng nhập thành công từ IP 192.168.2.10',
  timestamp: '2024-11-22 08:30:00'
}];


// Helper functions
export function getSubjectById(id: string): Subject | undefined {
  return subjects.find((s) => s.id === id);
}

export function getLecturerById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function getClassById(id: string): Class | undefined {
  return classes.find((c) => c.id === id);
}

export function getDepartmentById(id: string): Department | undefined {
  return departments.find((d) => d.id === id);
}

export function getSemesterById(id: string): Semester | undefined {
  return semesters.find((s) => s.id === id);
}

export function getEnrollmentsByStudent(studentId: string): Enrollment[] {
  return enrollments.filter(
    (e) => e.studentId === studentId && e.status === 'ENROLLED'
  );
}

export function getEnrollmentsByCourseSection(
courseSectionId: string)
: Enrollment[] {
  return enrollments.filter(
    (e) => e.courseSectionId === courseSectionId && e.status === 'ENROLLED'
  );
}

export function getGradesByStudent(studentId: string): Grade[] {
  return grades.filter((g) => g.studentId === studentId);
}

export function getGradesByCourseSection(courseSectionId: string): Grade[] {
  return grades.filter((g) => g.courseSectionId === courseSectionId);
}

export function getAttendanceByCourseSection(
courseSectionId: string)
: Attendance[] {
  return attendanceRecords.filter((a) => a.courseSectionId === courseSectionId);
}

export function calculateGrade(
midterm: number,
final: number,
attendanceScore: number)
: {totalScore: number;letterGrade: string;gpaPoint: number;} {
  const totalScore =
  Math.round((0.1 * attendanceScore + 0.3 * midterm + 0.6 * final) * 100) /
  100;
  let letterGrade = 'F';
  let gpaPoint = 0;
  if (totalScore >= 8.5) {
    letterGrade = 'A';
    gpaPoint = 4.0;
  } else if (totalScore >= 8.0) {
    letterGrade = 'B+';
    gpaPoint = 3.5;
  } else if (totalScore >= 7.0) {
    letterGrade = 'B';
    gpaPoint = 3.0;
  } else if (totalScore >= 6.5) {
    letterGrade = 'C+';
    gpaPoint = 2.5;
  } else if (totalScore >= 5.5) {
    letterGrade = 'C';
    gpaPoint = 2.0;
  } else if (totalScore >= 5.0) {
    letterGrade = 'D+';
    gpaPoint = 1.5;
  } else if (totalScore >= 4.0) {
    letterGrade = 'D';
    gpaPoint = 1.0;
  }
  return { totalScore, letterGrade, gpaPoint };
}