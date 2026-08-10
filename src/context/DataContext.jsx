// context/DataContext.jsx - WITH useData HOOK
import { createContext, useState, useEffect, useContext } from 'react'
import { useAuth } from './AuthContext'
import axiosInstance from '../config_portal/axios'

export const DataContext = createContext()

// ADD THIS CUSTOM HOOK
export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}

export const DataProvider = ({ children }) => {
  const [machines, setMachines] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isAuthenticated, accessToken, userRole } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      fetchMachineData()
    } else {
      setMachines({})
      setLoading(false)
    }
  }, [isAuthenticated, accessToken, userRole])

  const fetchMachineData = async () => {
    setLoading(true)
    try {
      // Map role to endpoint
      const endpointMap = {
        'admin': '/admin/machine/data',
        'customer': '/customer/machines',
        'dealership': '/dealership/machine/data',
        'operator': '/operator/machines'
      }
      
      const endpoint = endpointMap[userRole] || '/admin/machine/data'
      console.log(`📡 Fetching data for ${userRole} from: ${endpoint}`)
      
      const response = await axiosInstance.get(endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      
      // Convert array to object keyed by machineId
      const machinesData = {}
      if (Array.isArray(response.data)) {
        response.data.forEach(item => {
          machinesData[item.machineId || item._id] = {
            ...item,
            logs: item.logs || {}
          }
        })
      }
      
      console.log(`✅ Loaded ${Object.keys(machinesData).length} machines for ${userRole}`)
      setMachines(machinesData)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch machine data:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DataContext.Provider value={{ machines, loading, error, refetch: fetchMachineData }}>
      {children}
    </DataContext.Provider>
  )
}