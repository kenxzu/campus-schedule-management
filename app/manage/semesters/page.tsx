import { db } from '@/lib/db'
import { semesters } from '@/db/schema'
import SemesterForm from '../../../components/SemesterForm'
import SemesterList from '../../../components/SemesterList'
import Collapsible from '../../../components/Collapsible'
import Reveal from '../../../components/Reveal'

export default async function ManageSemestersPage() {
  const allSemesters = await db.select().from(semesters).orderBy(semesters.academicYear, semesters.term)

  return (
    <div className="grid gap-6">
      <Reveal>
        <section className="card">
          <h2 className="section-title">Semesters</h2>
          <Collapsible title="Add Semester" defaultOpen className="mt-3">
            <SemesterForm />
          </Collapsible>
          <Collapsible title="All Semesters" defaultOpen className="mt-3">
            <SemesterList items={allSemesters} />
          </Collapsible>
        </section>
      </Reveal>
    </div>
  )
}

