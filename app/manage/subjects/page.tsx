import { db } from '@/lib/db'
import { subjects } from '@/db/schema'
import SubjectForm from '../../../components/SubjectForm'
import SubjectList from '../../../components/SubjectList'
import Collapsible from '../../../components/Collapsible'
import Reveal from '../../../components/Reveal'

export default async function ManageSubjectsPage() {
  const allSubjects = await db.select().from(subjects).orderBy(subjects.code)

  return (
    <div className="grid gap-6">
      <Reveal>
        <section className="card">
          <h2 className="section-title">Subjects</h2>
          <Collapsible title="Add Subject" defaultOpen className="mt-3">
            <SubjectForm />
          </Collapsible>
          <Collapsible title="All Subjects" defaultOpen className="mt-3">
            <SubjectList items={allSubjects} />
          </Collapsible>
        </section>
      </Reveal>
    </div>
  )
}

