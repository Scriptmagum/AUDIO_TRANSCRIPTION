const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {

  // ======================
  // CORE REQUEST WRAPPER
  // ======================
  async request(endpoint, options = {}) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      credentials: 'include', // JWT cookie
    });

    // gestion auth globale (sans redirect forcé)
    if (res.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    const contentType = res.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    const data = isJson ? await res.json() : null;

    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'API_ERROR');
    }

    return data;
  }

  // ======================
  // AUTH
  // ======================

  async signup(email, password) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signin(email, password) {
  const response = await this.request('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  console.log("Réponse du backend:", response);
  
  // Vérifiez l'échec UNIQUEMENT si success est explicitement false
  if (response && response.success === false) {
    throw new Error(response.message || "Email ou mot de passe incorrect");
  }
  
  // Si success === true ou absent, considérez que c'est une réussite
  return response;
}

  async signout() {
    return this.request('/auth/signout', {
      method: 'POST',
    });
  }


  me() {
    return this.request('/auth/me');
  }
  // ======================
  // AUTH STATE (IMPORTANT)
  // ======================

  async isAuthenticated() {
    try {
      await this.me();
      return true;
      
    } catch {
      return false;
    }
  }

  // ======================
  // API KEY (dashboard feature)
  // ======================

  async generateApiKey() {
    return this.request('/user/apikey', {
      method: 'POST',
    });
  }

  // ======================
  // AUDIO / MEETING
  // ======================

  uploadAudio(file, onProgress, language = 'fr') {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(res);
          } else {
            reject(new Error(res.error || 'UPLOAD_FAILED'));
          }
        } catch {
          reject(new Error('INVALID_RESPONSE'));
        }
      };

      xhr.onerror = () => reject(new Error('NETWORK_ERROR'));

      xhr.open('POST', `${API_BASE_URL}/meeting/process/${language}`);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }

  getResult() {
    return this.request('/meeting/result');
  }

  downloadPdf() {
    return fetch(`${API_BASE_URL}/meeting/result/pdf`, {
      credentials: 'include',
    }).then(async (res) => {
      if (!res.ok) throw new Error('PDF_DOWNLOAD_FAILED');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'meeting-summary.pdf';
      a.click();

      window.URL.revokeObjectURL(url);
    });
  }
}

export default new ApiService();