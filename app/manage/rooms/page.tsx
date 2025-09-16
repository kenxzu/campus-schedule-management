import { db } from '@/lib/db'
import { rooms } from '@/db/schema'
import RoomForm from '../../../components/RoomForm'
import RoomList from '../../../components/RoomList'
import Collapsible from '../../../components/Collapsible'
import Reveal from '../../../components/Reveal'

export default async function ManageRoomsPage() {
  const allRooms = await db.select().from(rooms).orderBy(rooms.name)

  return (
    <div className="grid gap-6">
      <Reveal>
        <section className="card">
          <h2 className="section-title">Rooms</h2>
          <Collapsible title="Add Room" defaultOpen className="mt-3">
            <RoomForm />
          </Collapsible>
          <Collapsible title="All Rooms" defaultOpen className="mt-3">
            <RoomList items={allRooms} />
          </Collapsible>
        </section>
      </Reveal>
    </div>
  )
}

