import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { employee, signOut } = useAuth()

  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Profile</h2>
      <div className="card">
        <div className="profile-row">
          <span className="profile-label">Name</span>
          <span className="profile-value">{employee.full_name}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">Email</span>
          <span className="profile-value">{employee.email}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">Pay Type</span>
          <span className="profile-value">{employee.pay_type}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">Hourly Rate</span>
          <span className="profile-value">${Number(employee.rate).toFixed(2)}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">Payment Method</span>
          <span className="profile-value">{employee.method || 'Direct Deposit'}</span>
        </div>
      </div>
      <div className="mt-16">
        <button className="btn btn-secondary btn-full" onClick={signOut}>
          Sign Out
        </button>
      </div>
    </>
  )
}
