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
