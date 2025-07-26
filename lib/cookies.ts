// Cookie utilities for session persistence

export const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof window === 'undefined') return
  
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`
}

export const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null
  
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length))
  }
  
  return null
}

export const deleteCookie = (name: string) => {
  if (typeof window === 'undefined') return
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure`
}

export const setAuthCookie = (sessionData: any) => {
  if (!sessionData?.access_token) return

  try {
    // Store tokens
    setCookie('sb-access-token', sessionData.access_token)
    setCookie('sb-refresh-token', sessionData.refresh_token)

    // Store minimal user data
    if (sessionData.user) {
      const userData = {
        id: sessionData.user.id,
        email: sessionData.user.email,
        aud: sessionData.user.aud
      }
      setCookie('sb-user', encodeURIComponent(JSON.stringify(userData)))
    }
  } catch (error) {
    console.error('Error setting auth cookies:', error)
  }
}

export const getAuthCookie = () => {
  try {
    const accessToken = getCookie('sb-access-token')
    const refreshToken = getCookie('sb-refresh-token')
    const userDataStr = getCookie('sb-user')
    
    if (!accessToken || !refreshToken || !userDataStr) {
      return null
    }

    const userData = JSON.parse(decodeURIComponent(userDataStr))
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: userData
    }
  } catch (error) {
    console.error('Error getting auth cookies:', error)
    return null
  }
}

export const clearAuthCookie = () => {
  try {
    deleteCookie('sb-access-token')
    deleteCookie('sb-refresh-token')
    deleteCookie('sb-user')
  } catch (error) {
    console.error('Error clearing auth cookies:', error)
  }
} 