import ManageSubnav from '../../components/ManageSubnav'

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-6">
      <ManageSubnav />
      {children}
    </div>
  )
}

