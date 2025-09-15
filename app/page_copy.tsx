import { db } from '@/lib/db'
// forms moved to client components
import { lecturers, rooms, schedules, semesters, subjects } from '@/db/schema'
import { eq } from 'drizzle-orm'
import ScheduleForm from '../components/ScheduleForm'
import LecturerForm from '../components/LecturerForm'
import SubjectForm from '../components/SubjectForm'
import RoomForm from '../components/RoomForm'
import SemesterForm from '../components/SemesterForm'

type PageProps = {
  searchParams?: Promise<{ semesterId?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const [allSemesters, allLecturers, allSubjects, allRooms] = await Promise.all([
    db.select().from(semesters).orderBy(semesters.academicYear, semesters.term),
    db.select().from(lecturers).orderBy(lecturers.name),
    db.select().from(subjects).orderBy(subjects.code),
    db.select().from(rooms).orderBy(rooms.name)
  ])

  const sp = searchParams ? await searchParams : {}
  const selectedSemesterId = Number(sp.semesterId ?? allSemesters[0]?.id ?? 0)

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
          lecturer: lecturers.name,
          room: rooms.name,
          roomCapacity: rooms.capacity
        })
        .from(schedules)
        .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
        .innerJoin(lecturers, eq(schedules.lecturerId, lecturers.id))
        .innerJoin(rooms, eq(schedules.roomId, rooms.id))
        .where(eq(schedules.semesterId, selectedSemesterId))
        .orderBy(schedules.day, schedules.startTime)
    : []

  return (
    <div className="grid gap-6">
      <section className="card">
        <h2>Semesters</h2>
        <SemesterForm />
        <div style={{ marginTop: 8 }}>
          <form>
            <label>
              View schedules for semester:
              <select
                name="semesterId"
                defaultValue={selectedSemesterId ? String(selectedSemesterId) : ''}
                style={{ marginLeft: 8 }}
              >
                {allSemesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.academicYear} - {s.term}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" style={{ marginLeft: 8 }}>Go</button>
          </form>
        </div>
      </section>

      <section className="card">
        <h2>Lecturers</h2>
        <LecturerForm />
        <ul style={{ marginTop: 8 }}>
          {allLecturers.map((l) => (
            <li key={l.id}>{l.name}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Subjects</h2>
        <SubjectForm />
        <ul style={{ marginTop: 8 }}>
          {allSubjects.map((s) => (
            <li key={s.id}>
              {s.code} — {s.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Rooms</h2>
        <RoomForm />
        <ul style={{ marginTop: 8 }}>
          {allRooms.map((r) => (
            <li key={r.id}>
              {r.name} — capacity {r.capacity}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Schedules</h2>
        <ScheduleForm
          semesters={allSemesters}
          subjects={allSubjects}
          lecturers={allLecturers}
          rooms={allRooms}
          defaultSemesterId={selectedSemesterId}
        />

        <div style={{ marginTop: 16 }}>
          <h3>Schedules for selected semester</h3>
          {scheduleRows.length === 0 ? (
            <p>No schedules yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Day</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Time</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Subject</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Lecturer</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Room</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Capacity</th>
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((r) => {
                  const cap = r.capacityOverride ?? r.roomCapacity
                  const timeFmt = (t: any) => String(t).slice(0, 5)
                  return (
                    <tr key={r.id}>
                      <td style={{ padding: '6px 4px' }}>{r.day}</td>
                      <td style={{ padding: '6px 4px' }}>{timeFmt(r.start)} - {timeFmt(r.end)}</td>
                      <td style={{ padding: '6px 4px' }}>{r.subjectCode} — {r.subject}</td>
                      <td style={{ padding: '6px 4px' }}>{r.lecturer}</td>
                      <td style={{ padding: '6px 4px' }}>{r.room}</td>
                      <td style={{ padding: '6px 4px' }}>{cap}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

