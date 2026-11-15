import { useEffect, useState } from 'react'
import { AuthContext } from './authStore'
import { getCurrentUser, loginAccount, logoutAccount } from '../services/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getCurrentUser()
      .then((currentUser) => { if (active) setUser(currentUser) })
      .catch(() => { if (active) setUser(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function login(credentials) {
    const account = await loginAccount(credentials)
    setUser(account)
    return account
  }

  async function logout() {
    await logoutAccount()
    setUser(null)
  }

  function updateUser(updatedUser) {
    setUser(updatedUser)
  }

  const value = { user, loading, login, logout, updateUser }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
