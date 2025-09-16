import { db } from '@/lib/db'
import { lecturers } from '@/db/schema'
import LecturerForm from '../../../components/LecturerForm'
import LecturerList from '../../../components/LecturerList'
import Collapsible from '../../../components/Collapsible'
import Reveal from '../../../components/Reveal'

export default async function ManageLecturersPage() {
  const allLecturers = await db.select().from(lecturers).orderBy(lecturers.name)

  return (
    <div className="grid gap-6">
      <Reveal>
        <section className="card">
          <h2 className="section-title">Lecturers</h2>
          <Collapsible title="Add Lecturer" defaultOpen className="mt-3">
            <LecturerForm />
          </Collapsible>
          <Collapsible title="All Lecturers" defaultOpen className="mt-3">
            <LecturerList items={allLecturers as any} />
          </Collapsible>
        </section>
      </Reveal>
    </div>
  )
}

