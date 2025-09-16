import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schedules, semesters, subjects, lecturers, rooms } from "@/db/schema";
import { eq } from "drizzle-orm";

function csvEscape(val: unknown): string {
  const s = val == null ? "" : String(val);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const semesterIdParam = url.searchParams.get("semesterId");
  const semesterId = semesterIdParam ? Number(semesterIdParam) : NaN;
  const format = (url.searchParams.get("format") || "csv").toLowerCase();
  if (!Number.isFinite(semesterId) || semesterId <= 0) {
    return NextResponse.json(
      { error: "semesterId is required" },
      { status: 400 }
    );
  }

  const sem = await db
    .select()
    .from(semesters)
    .where(eq(semesters.id, semesterId))
    .limit(1);
  if (sem.length === 0) {
    return NextResponse.json({ error: "Semester not found" }, { status: 404 });
  }

  const rows = await db
    .select({
      day: schedules.day,
      start: schedules.startTime,
      end: schedules.endTime,
      capacityOverride: schedules.capacityOverride,
      subjectCode: subjects.code,
      subject: subjects.name,
      paidCredit: subjects.paidCredit as any,
      academicCredit: subjects.academicCredit as any,
      lecturer: lecturers.name,
      room: rooms.name,
      roomCapacity: rooms.capacity,
    })
    .from(schedules)
    .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
    .innerJoin(lecturers, eq(schedules.lecturerId, lecturers.id))
    .innerJoin(rooms, eq(schedules.roomId, rooms.id))
    .where(eq(schedules.semesterId, semesterId));

  const header = [
    "Day",
    "Start",
    "End",
    "Subject Code",
    "Subject",
    "Paid Credit",
    "Academic Credit",
    "Lecturer",
    "Room",
    "Capacity",
  ];
  const lines: string[] = [];
  lines.push(header.map(csvEscape).join(","));
  const timeFmt = (t: unknown) => String(t).slice(0, 5);
  for (const r of rows) {
    const cap = r.capacityOverride ?? r.roomCapacity;
    const data = [
      r.day,
      timeFmt(r.start),
      timeFmt(r.end),
      r.subjectCode,
      r.subject,
      String(r.paidCredit ?? ""),
      String(r.academicCredit ?? ""),
      r.lecturer,
      r.room,
      String(cap),
    ];
    lines.push(data.map(csvEscape).join(","));
  }

  if (format === "csv") {
    // BOM + CRLF for better Excel support on Windows
    const csv = "\uFEFF" + lines.join("\r\n");
    const filename = `schedules_${sem[0].academicYear}_${sem[0].term}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // Styled Excel (HTML table) for format=xls
  const headerHtml = header
    .map((h) => `<th style="background:#1e3a8a;color:#fff;font-weight:700;">${h}</th>`)
    .join("");
  const bodyHtml = rows
    .map((r) => {
      const cap = r.capacityOverride ?? r.roomCapacity;
      const cols = [
        r.day,
        timeFmt(r.start),
        timeFmt(r.end),
        r.subjectCode,
        r.subject,
        String(r.paidCredit ?? ""),
        String(r.academicCredit ?? ""),
        r.lecturer,
        r.room,
        String(cap),
      ]
        .map((c) => `<td style="border:1px solid #cbd5e1;padding:4px 6px;">${String(c)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</td>`)
        .join("");
      return `<tr>${cols}</tr>`;
    })
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8" />
  <title>Schedules</title>
  </head>
  <body>
    <table style="border-collapse:collapse;font-family:Arial, sans-serif;font-size:12px;">
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${bodyHtml}</tbody>
    </table>
  </body></html>`;

  const xlsName = `schedules_${sem[0].academicYear}_${sem[0].term}.xls`;
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${xlsName}"`,
    },
  });
}
