import React, { useState } from "react";
import { UploadIcon, UsersIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";

import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../contexts/AuthContext";

interface ImportResult {
  total: number;
  importedCount: number;
  skippedCount: number;
  imported: { studentId: string; email: string; name: string; className: string }[];
  skipped: { studentId: string; reason: string }[];
  errors: { rawData: string; errorMessage: string }[];
}

export function StudentBulkImportPage() {
	const { currentUser } = useAuth();

	const [classId, setClassId] = useState("");
	const [deptId, setDeptId] = useState("");
	const [inputData, setInputData] = useState("");
	const [isImporting, setIsImporting] = useState(false);
	const [result, setResult] = useState<ImportResult | null>(null);
	const [error, setError] = useState<string>("");
	const [format, setFormat] = useState<"simple" | "raw">("simple");

	const handleLoadSample = async () => {
		if (!classId || !deptId) {
			setError("Vui lòng nhập Class ID và Department ID");
			return;
		}

		setError("");
		try {
			const res = await fetch(
				`/api/ai/chatbot/import/sample?count=20&classId=${classId}&deptId=${deptId}`,
				{
					headers: {
						"X-Admin-User-Id": currentUser?.id || "",
					},
				}
			);

			const data = await res.json();
			if (data.success && data.data) {
				setInputData(data.data.join("\n"));
			}
		} catch (err) {
			setError("Không thể tải mẫu dữ liệu");
		}
	};

	const handleImport = async () => {
		if (!inputData.trim()) {
			setError("Vui lòng nhập dữ liệu sinh viên");
			return;
		}

		if (!currentUser?.id) {
			setError("Không xác định người dùng");
			return;
		}

		setIsImporting(true);
		setError("");
		setResult(null);

		try {
			const lines = inputData
				.split("\n")
				.map((l) => l.trim())
				.filter((l) => l.length > 0);

			const res = await fetch("/api/ai/chatbot/import/students", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Admin-User-Id": currentUser.id,
				},
				body: JSON.stringify({
					data: lines,
					simpleFormat: format === "simple",
				}),
			});

			const data = await res.json();

			if (data.success) {
				setResult(data.data);
			} else {
				setError(data.message || "Import thất bại");
			}
		} catch (err) {
			setError("Lỗi kết nối: " + (err as Error).message);
		} finally {
			setIsImporting(false);
		}
	};

	return (
		<Layout title="Import Sinh Viên Hàng Loạt">
			<div className="space-y-6">
				<Card
					title="Nhập liệu sinh viên"
					subtitle="Dán danh sách sinh viên theo định dạng: studentId email fullName phone classId"
					icon={<UsersIcon className="w-4 h-4" />}
				>
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">
									Class ID
								</label>
								<input
									type="text"
									value={classId}
									onChange={(e) => setClassId(e.target.value)}
									placeholder="Ví dụ: CLNNA01"
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">
									Department ID
								</label>
								<input
									type="text"
									value={deptId}
									onChange={(e) => setDeptId(e.target.value)}
									placeholder="Ví dụ: DP004"
									className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">
								Định dạng
							</label>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => setFormat("simple")}
									className={`px-3 py-1.5 text-sm rounded-lg border ${
										format === "simple"
											? "bg-blue-50 border-blue-300 text-blue-700"
											: "bg-white border-slate-300 text-slate-700"
									}`}
								>
									Đơn giản (khuyến nghị)
								</button>
								<button
									type="button"
									onClick={() => setFormat("raw")}
									className={`px-3 py-1.5 text-sm rounded-lg border ${
										format === "raw"
											? "bg-blue-50 border-blue-300 text-blue-700"
											: "bg-white border-slate-300 text-slate-700"
									}`}
								>
									Raw (đầy đủ)
								</button>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">
								Dữ liệu sinh viên (mỗi dòng 1 sinh viên)
							</label>
							<textarea
								value={inputData}
								onChange={(e) => setInputData(e.target.value)}
								placeholder={`SV2001\tsv2001@uni.local\tNguyen Van A\t0901234567\tCLNNA01\nSV2002\tsv2002@uni.local\tTran Thi B\t0901234568\tCLNNA01`}
								rows={12}
								className="w-full font-mono rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div className="flex gap-2">
							<Button onClick={handleLoadSample} icon={<UploadIcon className="w-4 h-4" />}>
								Tải mẫu 20 sinh viên
							</Button>

							<Button
								onClick={handleImport}
								loading={isImporting}
								variant="primary"
							>
								Import sinh viên
							</Button>
						</div>

						{error && (
							<div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
								{error}
							</div>
						)}
					</div>
				</Card>

				{result && (
					<>
						<Card
							title="Kết quả import"
							subtitle={`Tổng: ${result.total} | Import thành công: ${result.importedCount} | Bỏ qua: ${result.skippedCount}`}
							icon={<CheckCircleIcon className="w-4 h-4" />}
						>
							<div className="space-y-3">
								<div>
									<h4 className="text-sm font-medium text-green-700 mb-2">
										✅ Import thành công ({result.imported.length})
									</h4>
									<div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
										<table className="w-full text-xs">
											<thead>
												<tr className="border-b border-slate-200">
													<th className="text-left p-2">Student ID</th>
													<th className="text-left p-2">Email</th>
													<th className="text-left p-2">Tên</th>
													<th className="text-left p-2">Lớp</th>
												</tr>
											</thead>
											<tbody>
												{result.imported.map((student) => (
													<tr
														key={student.studentId}
														className="border-b border-slate-100"
													>
														<td className="p-2 font-mono">{student.studentId}</td>
														<td className="p-2">{student.email}</td>
														<td className="p-2">{student.name}</td>
														<td className="p-2">{student.className}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>

								{result.skipped.length > 0 && (
									<div>
										<h4 className="text-sm font-medium text-amber-700 mb-2">
											⚠️ Bỏ qua ({result.skipped.length})
										</h4>
										<div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
											<table className="w-full text-xs">
												<thead>
													<tr className="border-b border-slate-200">
														<th className="text-left p-2">Student ID</th>
														<th className="text-left p-2">Lý do</th>
													</tr>
												</thead>
												<tbody>
													{result.skipped.map((student, idx) => (
														<tr
															key={idx}
															className="border-b border-slate-100"
														>
															<td className="p-2 font-mono">{student.studentId}</td>
															<td className="p-2">{student.reason}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								)}

								{result.errors.length > 0 && (
									<div>
										<h4 className="text-sm font-medium text-red-700 mb-2">
											❌ Lỗi ({result.errors.length})
										</h4>
										<div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-red-50 p-2">
											<table className="w-full text-xs">
												<thead>
													<tr className="border-b border-red-200">
														<th className="text-left p-2">Dữ liệu</th>
														<th className="text-left p-2">Lỗi</th>
													</tr>
												</thead>
												<tbody>
													{result.errors.map((err, idx) => (
														<tr
															key={idx}
															className="border-b border-red-100"
														>
															<td className="p-2 font-mono truncate max-w-xs">
																{err.rawData}
															</td>
															<td className="p-2 text-red-600">
																{err.errorMessage}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								)}
							</div>
						</Card>
					</>
				)}
			</div>
		</Layout>
	);
}
