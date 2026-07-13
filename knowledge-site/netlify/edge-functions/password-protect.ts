const unauthorized = () =>
  new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Knowledge Site"',
      'Cache-Control': 'no-store'
    }
  });

const decodeCredentials = (authorization: string | null) => {
  if (!authorization?.startsWith('Basic ')) return null;

  try {
    const value = atob(authorization.slice('Basic '.length));
    const separator = value.indexOf(':');
    if (separator === -1) return null;

    return {
      user: value.slice(0, separator),
      password: value.slice(separator + 1)
    };
  } catch {
    return null;
  }
};

export default async (request: Request, context: any) => {
  const expectedUser = Netlify.env.get('SITE_AUTH_USER');
  const expectedPassword = Netlify.env.get('SITE_AUTH_PASSWORD');

  if (!expectedUser || !expectedPassword) {
    return context.next();
  }

  const credentials = decodeCredentials(request.headers.get('authorization'));
  if (
    credentials?.user === expectedUser &&
    credentials.password === expectedPassword
  ) {
    return context.next();
  }

  return unauthorized();
};
