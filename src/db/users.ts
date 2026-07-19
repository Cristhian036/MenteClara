import { db } from './index.ts';
import { users } from './schema.ts';
import { eq, and } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    // 1. Verificar si el usuario ya existe por uid
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      const user = existing[0];
      
      // Determinar si el correo entrante es un marcador de posición (ej. usr_xxx@example.com o sub_id@example.com)
      const isIncomingPlaceholder = email.endsWith('@example.com') && 
        (email.startsWith('usr_') || !isNaN(Number(email.split('@')[0])));
      
      const emailToUpdate = (!isIncomingPlaceholder && email && user.email !== email) ? email : user.email;
      const displayNameToUpdate = displayName || user.displayName;

      if (emailToUpdate !== user.email || displayNameToUpdate !== user.displayName) {
        const updated = await db.update(users)
          .set({
            email: emailToUpdate,
            displayName: displayNameToUpdate
          })
          .where(eq(users.uid, uid))
          .returning();
        return updated[0];
      }
      
      return user;
    }

    // 2. Si el usuario no existe, insertar un nuevo registro de usuario
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('No se pudo registrar o recuperar el usuario en la base de datos.', { cause: error });
  }
}

export async function registerLocalUser(email: string, pass: string, name: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    // Verificar si el usuario ya existe
    const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existing.length > 0) {
      throw new Error('Este correo ya está registrado.');
    }
    
    const uid = 'usr_' + Math.random().toString(36).substring(2, 11);
    const result = await db.insert(users)
      .values({
        uid,
        email: cleanEmail,
        password: pass,
        displayName: name.trim()
      })
      .returning();
      
    return result[0];
  } catch (error: any) {
    console.error('Error registering local user in DB:', error);
    throw new Error(error.message || 'No se pudo crear el usuario en la base de datos.', { cause: error });
  }
}

export async function loginLocalUser(email: string, pass: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const result = await db.select()
      .from(users)
      .where(and(eq(users.email, cleanEmail), eq(users.password, pass)))
      .limit(1);
      
    if (result.length === 0) {
      throw new Error('Correo o contraseña incorrectos.');
    }
    
    return result[0];
  } catch (error: any) {
    console.error('Error logging in local user in DB:', error);
    throw new Error(error.message || 'Error al iniciar sesión en la base de datos.', { cause: error });
  }
}

export async function updateUserProfileInDB(uid: string, displayName: string) {
  try {
    const result = await db.update(users)
      .set({ displayName })
      .where(eq(users.uid, uid))
      .returning();
    return result[0];
  } catch (error: any) {
    console.error('Error updating user profile in DB:', error);
    throw new Error(error.message || 'No se pudo actualizar el perfil en la base de datos.', { cause: error });
  }
}
