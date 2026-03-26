import React, { useState } from 'react';

interface StudentImportFormProps {
 classId?: string;
 departmentId?: string;
 onSubmit: (data: {
  classId: string;
  quantity?: number;
  studentData?: string;
 }) => void;
 onCancel?: () => void;
}

export const StudentImportForm: React.FC<StudentImportFormProps> = ({
 classId: initialClassId,
 departmentId: initialDepartmentId,
 onSubmit,
 onCancel,
}) => {
 const [mode, setMode] = useState<'generate' | 'paste'>('generate');
 const [classId, setClassId] = useState(initialClassId || '');
 const [departmentId, setDepartmentId] = useState(initialDepartmentId || '');
 const [quantity, setQuantity] = useState<number>(10);
 const [studentData, setStudentData] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string>('');

 const handleSubmit = async () => {
  if (mode === 'generate') {
   if (!classId && !departmentId) {
    setError('Vui lòng chọn Class ID hoặc Department ID');
    return;
   }
   if (quantity < 1 || quantity > 1000) {
    setError('Số lượng phải từ 1-1000 sinh viên');
    return;
   }
  } else {
   if (!studentData.trim()) {
    setError('Vui lòng nhập dữ liệu sinh viên');
    return;
   }
  }

  setIsLoading(true);
  setError('');

  try {
   onSubmit({
    classId,
    quantity: mode === 'generate' ? quantity : undefined,
    studentData: mode === 'paste' ? studentData : undefined,
   });
  } catch (err) {
   setError('Có lỗi xảy ra. Vui lòng thử lại.');
  } finally {
   setIsLoading(false);
  }
 };

 return (
  <div style={{
   backgroundColor: '#ffffff',
   border: '1px solid #e5e7eb',
   borderRadius: '8px',
   padding: '20px',
   marginTop: '12px',
  }}>
   <h4 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>
    📥 Import Sinh Viên Hàng Loạt
   </h4>

   {/* Mode Selection */}
   <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
     Chế độ import:
    </label>
    <div style={{ display: 'flex', gap: '12px' }}>
     <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
      <input
       type="radio"
       checked={mode === 'generate'}
       onChange={() => setMode('generate')}
       style={{ cursor: 'pointer' }}
      />
      Tạo mẫu tự động
     </label>
     <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
      <input
       type="radio"
       checked={mode === 'paste'}
       onChange={() => setMode('paste')}
       style={{ cursor: 'pointer' }}
      />
      Paste dữ liệu
     </label>
    </div>
   </div>

   {/* Class/Department Selection */}
   <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
     {departmentId ? 'Chọn lớp:' : 'Chọn khoa hoặc lớp:'}
    </label>
    <select
     value={classId}
     onChange={(e) => setClassId(e.target.value)}
     style={{
      width: '100%',
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      fontSize: '14px',
     }}
    >
     <option value="">-- Chọn lớp --</option>
     <option value="class1">Lớp DTU001</option>
     <option value="class2">Lớp DTU002</option>
     <option value="class3">Lớp DTU003</option>
    </select>
   </div>

   {mode === 'generate' && (
    <>
     <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
       Số lượng sinh viên:
      </label>
      <input
       type="number"
       min="1"
       max="1000"
       value={quantity}
       onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
       style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
       }}
      />
      <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
       Tối đa 1000 sinh viên mỗi lần import
      </small>
     </div>

     <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
      <strong style={{ color: '#374151' }}>Format sinh viên:</strong>
      <pre style={{
       margin: '8px 0 0 0',
       fontSize: '12px',
       background: '#1f2937',
       color: '#10b981',
       padding: '8px',
       borderRadius: '4px',
       overflow: 'auto',
      }}>
{`studentId email fullName phone classId
DTU001 dtu001@dtu.edu.vn Nguyen Van A 0901234567 DTU001
DTU002 dtu002@dtu.edu.vn Nguyen Van B 0901234568 DTU001`}
      </pre>
     </div>
    </>
   )}

   {mode === 'paste' && (
    <div style={{ marginBottom: '16px' }}>
     <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
      Dữ liệu sinh viên (mỗi dòng 1 sinh viên):
     </label>
     <textarea
      value={studentData}
      onChange={(e) => setStudentData(e.target.value)}
      placeholder={`studentId email fullName phone classId
DTU001 dtu001@dtu.edu.vn Nguyen Van A 0901234567 DTU001
DTU002 dtu002@dtu.edu.vn Nguyen Van B 0901234568 DTU001`}
      style={{
       width: '100%',
       minHeight: '200px',
       padding: '12px',
       borderRadius: '6px',
       border: '1px solid #d1d5db',
       fontSize: '13px',
       fontFamily: 'monospace',
       resize: 'vertical',
      }}
     />
    </div>
   )}

   {error && (
    <div style={{
     backgroundColor: '#fee2e2',
     color: '#dc2626',
     padding: '10px 12px',
     borderRadius: '6px',
     marginBottom: '16px',
     fontSize: '14px',
    }}>
     ⚠️ {error}
    </div>
   )}

   <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
    {onCancel && (
     <button
      type="button"
      onClick={onCancel}
      disabled={isLoading}
      style={{
       padding: '10px 20px',
       borderRadius: '6px',
       border: '1px solid #d1d5db',
       backgroundColor: '#ffffff',
       color: '#374151',
       fontSize: '14px',
       cursor: isLoading ? 'not-allowed' : 'pointer',
       opacity: isLoading ? 0.6 : 1,
      }}
     >
      Hủy
     </button>
    )}
    <button
     type="button"
     onClick={handleSubmit}
     disabled={isLoading}
     style={{
      padding: '10px 24px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '500',
      cursor: isLoading ? 'not-allowed' : 'pointer',
      opacity: isLoading ? 0.6 : 1,
     }}
    >
     {isLoading ? 'Đang xử lý...' : 'Import'}
    </button>
   </div>
  </div>
 );
};

export default StudentImportForm;
