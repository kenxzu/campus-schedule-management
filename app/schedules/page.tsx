import { db } from '@/lib/db'
import { schedules, semesters, subjects, lecturers, rooms } from '@/db/schema'
import { eq } from 'drizzle-orm'
import ScheduleForm from '../../components/ScheduleForm'
import ScheduleTable from '../../components/ScheduleTable'
import Collapsible from '../../components/Collapsible'
import Reveal from '../../components/Reveal'

type PageProps = { searchParams?: Promise<{ semesterId?: string }> }

export default async function SchedulesPage({ searchParams }: PageProps) {
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
          roomCapacity: rooms.capacity,
          subjectId: schedules.subjectId,
          lecturerId: schedules.lecturerId,
          roomId: schedules.roomId,
          semesterId: schedules.semesterId
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
      <Reveal>
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">Schedules</h2>
          <form className="flex flex-wrap items-center gap-2">
            <label className="label">Semester</label>
            <select className="select w-full sm:w-auto" name="semesterId" defaultValue={selectedSemesterId ? String(selectedSemesterId) : ''}>
              {allSemesters.map((s) => (
                <option key={s.id} value={s.id}>{s.academicYear} - {s.term}</option>
              ))}
            </select>
            <button className="btn" type="submit">Go</button>
          </form>
        </div>
        <Collapsible title="Add Schedule" defaultOpen className="mt-3">
          <div className="mt-2">
            <ScheduleForm
              semesters={allSemesters}
              subjects={allSubjects}
              lecturers={allLecturers}
              rooms={allRooms}
              defaultSemesterId={selectedSemesterId}
            />
          </div>
        </Collapsible>
        <Collapsible title="Manage Schedules" defaultOpen className="mt-3">
          <div className="mt-2">
            {scheduleRows.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No schedules yet for selected semester.</p>
            ) : (
              <ScheduleTable rows={scheduleRows as any} semesters={allSemesters} subjects={allSubjects} lecturers={allLecturers} rooms={allRooms} />
            )}
          </div>
        </Collapsible>
      </section>
      </Reveal>
    </div>
  )
}
