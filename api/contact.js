export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Méthode non autorisée' });
    return;
  }

  const body = typeof req.body === 'string' ? safeParseJson(req.body) : req.body || {};
  const { nom, name, email, organisation, message, budget, consent } = body;

  if (!email || !(nom || name) || !message) {
    res.status(400).json({ success: false, error: 'Merci de compléter votre nom, votre email et votre message.' });
    return;
  }

  const payload = {
    nom: nom || name,
    email,
    organisation: organisation || body.organisation || '',
    budget: budget || body['budget'] || '',
    consent: Boolean(consent ?? body['consent']),
    message,
  };

  console.info('[contact] Message reçu', {
    nom: payload.nom,
    email: payload.email,
    organisation: payload.organisation,
    budget: payload.budget,
    consent: payload.consent,
  });

  res.status(200).json({
    success: true,
    message: 'Merci ! Votre histoire nous est bien parvenue. Nous revenons vers vous très vite.',
    data: payload,
  });
}

function safeParseJson(content) {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('[contact] JSON parse error', error);
    return {};
  }
}
