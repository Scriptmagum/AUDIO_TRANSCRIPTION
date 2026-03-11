import axios from 'axios';

const API_BASE_URL ='http://localhost:3001';
//const API_BASE_URL ='/api' ;

class ApiService {
  constructor() {
    this.token = localStorage.getItem('api_token');
    this.uuid = localStorage.getItem('user_uuid');
  }

  setToken(token, uuid) {
    this.token = token;
    this.uuid = uuid;
    localStorage.setItem('api_token', token);
    localStorage.setItem('user_uuid', uuid);
  }

  clearToken() {
    this.token = null;
    this.uuid = null;
    localStorage.removeItem('api_token');
    localStorage.removeItem('user_uuid');
  }

  async generateToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/token`);
      if (!response.ok) {
        throw new Error('Failed to generate token');
      }
      const data = await response.json();
      this.setToken(data.token, data.uuid);
      return data;
    } catch (error) {
      console.error('Error generating token:', error);
      throw error;
    }
  }

  async uploadAudio(file, onProgress, lang) {
    if (!this.token) throw new Error('No token');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/meeting/process/${lang}`, formData, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          try {
            const { loaded, total } = progressEvent;
            if (total) {
              const percent = Math.round((loaded * 100) / total);
              if (typeof onProgress === 'function') onProgress(percent);
            }
          } catch (err) {
            // ignore progress callback errors
          }
        }
      });

      return response.data;
    } catch (err) {
      if (err.response) {
        throw new Error('Upload failed');
      }
      throw err;
    }
  }

  async getResult() {
    if (!this.token) {
      throw new Error('No API token available');
    }

    const response = await fetch(`${API_BASE_URL}/meeting/result`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No results yet
      }
      throw new Error('Failed to get result');
    }

    return response.json();
  }

  async downloadPdf() {
    if (!this.token) {
      throw new Error('No API token available');
    }

    const response = await fetch(`${API_BASE_URL}/meeting/result/pdf`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-summary-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  isAuthenticated() {
    return !!this.token;
  }
}

const apiService = new ApiService();
export default apiService;