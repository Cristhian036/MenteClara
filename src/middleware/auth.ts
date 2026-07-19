import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    [key: string]: any;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No se proporcionó token de sesión.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    // Si el token es un JWT, procesar su payload (por ejemplo, si se pasa un JWT)
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      if (payload && (payload.uid || payload.user_id || payload.sub)) {
        req.user = {
          uid: payload.uid || payload.user_id || payload.sub,
          email: payload.email || `${payload.uid || payload.user_id || payload.sub}@example.com`,
          ...payload
        };
        return next();
      }
    }

    // Alternativa: Tratar el token en sí mismo como el identificador único del usuario (UID)
    if (token && token.length > 3) {
      req.user = {
        uid: token,
        email: token.includes('@') ? token : `${token}@example.com`
      };
      return next();
    }

    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  } catch (error) {
    console.error('Error al decodificar el token de sesión:', error);
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
};
