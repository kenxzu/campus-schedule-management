import { db } from "@/lib/db";
import { schedules, semesters, subjects, lecturers, rooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import Reveal from "../components/Reveal";

type PageProps = { searchParams?: Promise<{ semesterId?: string }> };

export default async function Page({ searchParams }: PageProps) {
  const allSemesters = await db
    .select()
    .from(semesters)
    .orderBy(semesters.academicYear, semesters.term);

  const sp = searchParams ? await searchParams : {};
  const selectedSemesterId = Number(sp.semesterId ?? allSemesters[0]?.id ?? 0);

  const scheduleRows = selectedSemesterId
    ? await db
        .select({
          id: schedules.id,
          day: schedules.day,
          start: schedules.startTime,
          end: schedules.endTime,
          capacityOverride: schedules.capacityOverride,
          subject: subjects.name,
          subjectCode: subjects.code,
          subjectPaidCredit: subjects.paidCredit as any,
          subjectAcademicCredit: subjects.academicCredit as any,
          lecturer: lecturers.name,
          room: rooms.name,
          roomCapacity: rooms.capacity,
        })
        .from(schedules)
        .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
        .innerJoin(lecturers, eq(schedules.lecturerId, lecturers.id))
        .innerJoin(rooms, eq(schedules.roomId, rooms.id))
        .where(eq(schedules.semesterId, selectedSemesterId))
        .orderBy(schedules.day, schedules.startTime)
    : [];

  return (
    <div className="grid gap-6">
      <Reveal>
        <section className="card">
          <h2 className="section-title">Select Semester</h2>
          <form className="flex items-center gap-2">
            <label className="label">View schedules for semester:</label>
            <select
              className="select"
              name="semesterId"
              defaultValue={
                selectedSemesterId ? String(selectedSemesterId) : ""
              }
            >
              {allSemesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.academicYear} - {s.term}
                </option>
              ))}
            </select>
            <button className="btn" type="submit">
              Go
            </button>
          </form>
        </section>
      </Reveal>

      <Reveal delay={80}>
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="section-title">Schedules (Read-only)</h2>
            <div className="flex flex-wrap items-center gap-2">
              {selectedSemesterId > 0 && (
                <>
                  <a
                    className="btn btn-ghost"
                    href={`/api/schedules/export?semesterId=${selectedSemesterId}`}
                  >
                    Export CSV
                  </a>
                  <a
                    className="btn btn-dark"
                    href={`/api/schedules/export?semesterId=${selectedSemesterId}&format=xls`}
                  >
                    Export Excel
                  </a>
                </>
              )}
            </div>
          </div>
          {scheduleRows.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No schedules yet.</p>
          ) : (
            <div className="mt-2 overflow-x-auto rounded-md border">
              <table className="table-base w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Lecturer</th>
                    <th>Room</th>
                    <th>Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleRows.map((r) => {
                    const cap = r.capacityOverride ?? r.roomCapacity;
                    const timeFmt = (t: any) => String(t).slice(0, 5);
                    return (
                      <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                        <td>{r.day}</td>
                        <td>
                          {timeFmt(r.start)} - {timeFmt(r.end)}
                        </td>

                        <td>
                          <span className="font-medium text-gray-900">{r.subjectCode}</span>
                          <span className="text-gray-500"> — {r.subject}</span>
                          <span className="ml-2 text-gray-500 text-xs">({(r as any).subjectPaidCredit}/{(r as any).subjectAcademicCredit} cr)</span>
                        </td>

                        <td>{r.lecturer}</td>
                        <td>{r.room}</td>
                        <td>{cap}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Reveal>
    </div>
  );
}
