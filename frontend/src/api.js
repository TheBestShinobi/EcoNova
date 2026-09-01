// API functions for connecting to the backend

const API_BASE_URL = import.meta.env.VITE_API_URL ||'http://localhost:8000'

// Parse bank statement data
export async function parseBank(text) {
  try {
    const response = await fetch(`${API_BASE_URL}/parse/bank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error parsing bank data:', error)
    throw error
  }
}

// Parse receipt from image
export async function parseReceiptImage(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_BASE_URL}/parse/receipt/image`, {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error parsing receipt image:', error)
    throw error
  }
}

// Parse receipt from text
export async function parseReceiptText(text) {
  try {
    const response = await fetch(`${API_BASE_URL}/parse/receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error parsing receipt text:', error)
    throw error
  }
}

// Check API health
export async function checkApiHealth() {
  try {
    const response = await fetch(API_BASE_URL)
    return await response.json()
  } catch (error) {
    console.error('API is not reachable:', error)
    return null
  }
}
