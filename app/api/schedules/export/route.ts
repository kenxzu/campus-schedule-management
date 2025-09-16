import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { schedules, semesters, subjects, lecturers, rooms } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

function toCSVGroupedByClassYear(rows: any[]) {
  const esc = (v: any) => {
    const s = v == null ? '' : String(v)
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
    return s
  }
  const header = [
    'Day',
    'Start',
    'End',
    'Subject Code',
    'Subject',
    'Lecturer Code',
    'Lecturer',
    'Room',
    'Room Capacity',
    'Capacity Override',
    'Effective Capacity',
    'Class Year'
  ]
  const byClass = new Map<string, any[]>()
  for (const r of rows) {
    const key = r.classYear ? String(r.classYear) : 'Unknown'
    const list = byClass.get(key)
    if (list) list.push(r)
    else byClass.set(key, [r])
  }
  const keys = Array.from(byClass.keys()).sort((a, b) => {
    if (a === 'Unknown') return 1
    if (b === 'Unknown') return -1
    return Number(a) - Number(b)
  })
  const lines: string[] = []
  for (const key of keys) {
    const group = byClass.get(key) || []
    // Section title row
    lines.push(esc(`Class Year: ${key}`))
    // Group header
    lines.push(header.join(','))
    for (const r of group) {
      const eff = r.capacityOverride ?? r.roomCapacity
      lines.push([
        r.day,
        String(r.start).slice(0, 5),
        String(r.end).slice(0, 5),
        r.subjectCode,
        r.subject,
        r.lecturerCode,
        r.lecturer,
        r.room,
        r.roomCapacity,
        r.capacityOverride ?? '',
        eff,
        r.classYear ?? ''
      ].map(esc).join(','))
    }
    // Blank line between groups
    lines.push('')
  }
  return lines.join('\n')
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const semesterId = Number(searchParams.get('semesterId') || 0)
  const format = (searchParams.get('format') || 'csv').toLowerCase()

  if (!Number.isFinite(semesterId) || semesterId <= 0) {
    return new Response(JSON.stringify({ error: 'semesterId required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    })
  }

  const [sem] = await db.select().from(semesters).where(eq(semesters.id, semesterId))
  const semName = sem ? `${sem.academicYear}-${sem.term}` : `semester-${semesterId}`
  const safeName = semName.replace(/[^A-Za-z0-9._-]+/g, '-')

  const rows = await db
    .select({
      id: schedules.id,
      day: schedules.day,
      start: schedules.startTime,
      end: schedules.endTime,
      capacityOverride: schedules.capacityOverride,
      subject: subjects.name,
      subjectCode: subjects.code,
      lecturer: lecturers.name,
      lecturerCode: schedules.lecturerCode,
      room: rooms.name,
      roomCapacity: rooms.capacity,
      classYear: schedules.classYear
    })
    .from(schedules)
    .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
    .innerJoin(lecturers, eq(schedules.lecturerCode, lecturers.code))
    .innerJoin(rooms, eq(schedules.roomId, rooms.id))
    .where(eq(schedules.semesterId, semesterId))

  if (format === 'xlsx' || format === 'excel' || format === 'xls') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ExcelJS = require('exceljs')

      const wb = new ExcelJS.Workbook()
      wb.creator = 'Campus Scheduler'
      wb.created = new Date()

      // Group rows by class year
      const groups = new Map<string, typeof rows>()
      for (const r of rows) {
        const key = r.classYear ? String(r.classYear) : 'Unknown'
        const list = groups.get(key)
        if (list) list.push(r)
        else groups.set(key, [r])
      }

      const header = [
        'Day', 'Start', 'End', 'Subject Code', 'Subject', 'Lecturer Code', 'Lecturer', 'Room', 'Room Capacity', 'Capacity Override', 'Effective Capacity', 'Class Year'
      ]

      const addSheet = (classLabel: string, data: typeof rows) => {
        const ws = wb.addWorksheet(`Class ${classLabel}`.slice(0, 31))
        ws.properties.defaultRowHeight = 18
        ws.columns = [
          { header: header[0], key: 'day', width: 10 },
          { header: header[1], key: 'start', width: 8 },
          { header: header[2], key: 'end', width: 8 },
          { header: header[3], key: 'subjectCode', width: 14 },
          { header: header[4], key: 'subject', width: 32 },
          { header: header[5], key: 'lecturerCode', width: 14 },
          { header: header[6], key: 'lecturer', width: 26 },
          { header: header[7], key: 'room', width: 14 },
          { header: header[8], key: 'roomCapacity', width: 14 },
          { header: header[9], key: 'capacityOverride', width: 18 },
          { header: header[10], key: 'effectiveCapacity', width: 18 },
          { header: header[11], key: 'classYear', width: 12 }
        ]

        // Style header
        const headerRow = ws.getRow(1)
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
        headerRow.height = 20
        headerRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
            left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
            bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } },
            right: { style: 'thin', color: { argb: 'FF9CA3AF' } }
          }
        })

        // Add data rows
        for (const r of data) {
          const eff = r.capacityOverride ?? r.roomCapacity
          ws.addRow({
            day: r.day,
            start: String(r.start).slice(0, 5),
            end: String(r.end).slice(0, 5),
            subjectCode: r.subjectCode,
            subject: r.subject,
            lecturerCode: r.lecturerCode,
            lecturer: r.lecturer,
            room: r.room,
            roomCapacity: r.roomCapacity,
            capacityOverride: r.capacityOverride ?? '',
            effectiveCapacity: eff,
            classYear: r.classYear ?? ''
          })
        }

        // Row borders and zebra striping
        ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber === 1) return
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
            }
          })
          if (rowNumber % 2 === 0) {
            row.eachCell((cell) => {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
            })
          }
        })

        ws.views = [{ state: 'frozen', ySplit: 1 }]
      }

      const keys = Array.from(groups.keys()).sort((a, b) => {
        if (a === 'Unknown') return 1
        if (b === 'Unknown') return -1
        return Number(a) - Number(b)
      })
      for (const key of keys) addSheet(key, groups.get(key) || [])
      if (keys.length === 0) addSheet('Empty', [])

      const buf: Buffer = await wb.xlsx.writeBuffer()
      return new Response(buf, {
        headers: {
          'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'content-disposition': `attachment; filename="schedules-${safeName}.xlsx"`
        }
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: 'XLSX styling requires the "exceljs" package to be installed.' }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      })
    }
  }

  const csv = toCSVGroupedByClassYear(rows)
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="schedules-${safeName}.csv"`
    }
  })
}

