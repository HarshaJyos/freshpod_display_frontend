import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user profile data
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userRole', data.role);
      } else if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          fetchUserProfile();
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await fetch('http://localhost:3000/user/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return false;
  };

  const getRoleDisplayName = () => {
    const role = userData?.role || localStorage.getItem('userRole');
    switch(role) {
      case 'admin':
        return 'System Administrator';
      case 'dealership':
        return 'Dealership Partner';
      case 'customer':
        return 'Customer';
      default:
        return 'User';
    }
  };

  const getDisplayName = () => {
    if (!userData?.name) return 'User';
    return userData.name.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-72 z-[990] h-20 bg-[#F8F9FE]/95 backdrop-blur-md border-b border-gray-100">
      <div className="h-full flex items-center justify-end px-4 md:px-8 max-w-7xl mx-auto lg:mx-0 lg:pr-8">
        
        {/* User Profile - Simple Display */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="text-right">
            {loading ? (
              <>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
              </>
            ) : (
              <>
                <p className="text-[14px] font-bold text-[#1A1C1E] leading-tight">
                  {getDisplayName()}
                </p>
                <p className="text-[10px] text-[#8E97A4] font-bold uppercase tracking-wider mt-0.5">
                  {getRoleDisplayName()}
                </p>
              </>
            )}
          </div>
          
          {/* User Avatar/Initials */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4D7CFF] to-[#0052FF] flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
            {!loading && userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;