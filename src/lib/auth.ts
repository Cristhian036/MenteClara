const getApiBase = (): string => {
  const url = import.meta.env.VITE_API_URL;
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && url.includes('localhost')) {
      return '';
    }
    return url.replace(/\/+$/, '');
  }
  return '';
};
const API_BASE = getApiBase();

interface CustomUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  getIdToken: () => Promise<string>;
}

class CustomAuth {
  currentUser: CustomUser | null = null;
  private listeners: ((user: CustomUser | null) => void)[] = [];

  constructor() {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('menteclara_auth_session') : null;
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        this.currentUser = {
          ...userData,
          getIdToken: async () => userData.uid
        };
      } catch (e) {
        console.error(e);
      }
    }
  }

  onAuthStateChanged(callback: (user: CustomUser | null) => void) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach(l => l(this.currentUser));
  }

  async loginWithEmail(email: string, pass: string) {
    const response = await fetch(`${API_BASE}/api/auth/login-local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password: pass })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Correo o contraseña incorrectos.');
    }

    const dbUser = await response.json();

    const userSession = {
      uid: dbUser.uid,
      email: dbUser.email,
      displayName: dbUser.displayName || 'Usuario MenteClara',
      photoURL: null
    };

    this.currentUser = {
      ...userSession,
      getIdToken: async () => userSession.uid
    };

    localStorage.setItem('menteclara_auth_session', JSON.stringify(userSession));
    this.notify();
    return this.currentUser;
  }

  async registerWithEmail(email: string, pass: string, name: string) {
    const response = await fetch(`${API_BASE}/api/auth/register-local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password: pass, name })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No se pudo crear el usuario.');
    }

    const dbUser = await response.json();

    const userSession = {
      uid: dbUser.uid,
      email: dbUser.email,
      displayName: dbUser.displayName || name,
      photoURL: null
    };

    this.currentUser = {
      ...userSession,
      getIdToken: async () => userSession.uid
    };

    localStorage.setItem('menteclara_auth_session', JSON.stringify(userSession));
    this.notify();
    return this.currentUser;
  }

  async loginWithGoogle() {
    return new Promise<any>((resolve, reject) => {
      if (!(window as any).google?.accounts?.oauth2) {
        // Cargar dinámicamente el SDK de Google si aún no está en window
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => {
            this.loginWithGoogle().then(resolve).catch(reject);
          };
          script.onerror = () => {
            reject(new Error('En la App Móvil APK por favor utiliza el registro o inicio de sesión con Correo y Contraseña.'));
          };
          document.head.appendChild(script);
          return;
        } else {
          reject(new Error('Cargando servicios de Google... Por favor presiona el botón nuevamente.'));
          return;
        }
      }

      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
          reject(new Error('VITE_GOOGLE_CLIENT_ID no está configurado en las variables de entorno (.env).'));
          return;
        }

        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              reject(new Error(`Error de autenticación Google: ${tokenResponse.error_description || tokenResponse.error}`));
              return;
            }
            try {
              // Fetch user profile info from Google API
              const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
              if (!userInfoRes.ok) {
                throw new Error('No se pudo recuperar la información de perfil desde Google.');
              }
              const profile = await userInfoRes.json();

              const userSession = {
                uid: profile.sub,
                email: profile.email,
                displayName: profile.name || 'Usuario Google',
                photoURL: profile.picture || null,
                token: profile.sub // pass 'sub' as Bearer token
              };

              this.currentUser = {
                ...userSession,
                getIdToken: async () => userSession.token
              };

              localStorage.setItem('menteclara_auth_session', JSON.stringify(userSession));
              this.notify();
              resolve(this.currentUser);
            } catch (e) {
              reject(e);
            }
          },
        });
        client.requestAccessToken();
      } catch (err) {
        reject(err);
      }
    });
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('menteclara_auth_session');
    this.notify();
  }

  async updateUserProfile(displayName: string, photoURL: string) {
    if (!this.currentUser) throw new Error('No hay sesión activa.');
    const updated = {
      ...this.currentUser,
      displayName,
      photoURL
    };

    // Call API to update the displayName in the PostgreSQL database
    const response = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.currentUser.uid}`
      },
      body: JSON.stringify({ displayName })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No se pudo actualizar el perfil en el servidor.');
    }

    this.currentUser = {
      uid: updated.uid,
      email: updated.email,
      displayName: updated.displayName,
      photoURL: updated.photoURL,
      getIdToken: async () => updated.uid
    };
    localStorage.setItem('menteclara_auth_session', JSON.stringify({
      uid: updated.uid,
      email: updated.email,
      displayName: updated.displayName,
      photoURL: updated.photoURL
    }));

    const usersStr = localStorage.getItem('menteclara_local_users') || '[]';
    const users = JSON.parse(usersStr);
    const index = users.findIndex((u: any) => u.uid === updated.uid);
    if (index !== -1) {
      users[index].displayName = displayName;
      users[index].photoURL = photoURL;
      localStorage.setItem('menteclara_local_users', JSON.stringify(users));
    }
    this.notify();
    return this.currentUser;
  }
}

export const auth = new CustomAuth();

export const loginWithGoogle = () => auth.loginWithGoogle();
export const registerWithEmail = (email: string, pass: string, name: string) => auth.registerWithEmail(email, pass, name);
export const loginWithEmail = (email: string, pass: string) => auth.loginWithEmail(email, pass);
export const updateUserProfile = (displayName: string, photoURL: string) => auth.updateUserProfile(displayName, photoURL);
export const signOut = () => auth.signOut();
export const onAuthStateChanged = (authObj: CustomAuth, callback: (user: CustomUser | null) => void) => authObj.onAuthStateChanged(callback);

export type User = CustomUser;
export type { CustomUser };
