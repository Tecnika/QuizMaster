const API_KEY = 'AIzaSyAYrAXTVjnpm5_hRFzJWdtCEYTuI3i0EuU';
const PROJECT = 'quizmaster-c5cc0';
const DB = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const ID = 'https://identitytoolkit.googleapis.com/v1';

const ts = Date.now();
const email = `rules${ts}@quizmaster.app`;
const password = 'RulesTest123!';
const now = new Date().toISOString();
const code = `R${String(ts).slice(-5)}`;
const token = 'rulestoken1234567890abcdef';

function toFs(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFs).filter(Boolean) } };
  if (typeof value === 'object') return { mapValue: { fields: toFields(value) } };
  return null;
}
function toFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    const f = toFs(value);
    if (f) fields[key] = f;
  }
  return fields;
}
function body(obj) {
  return JSON.stringify({ fields: toFields(obj) });
}
async function req(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}
async function fs(method, path, obj, authToken, keyOnly = false, mask = null) {
  const qs = [];
  if (keyOnly) qs.push(`key=${API_KEY}`);
  if (mask) qs.push(`updateMask.fieldPaths=${mask}`);
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  return req(`${DB}/${path}${qs.length ? '?' + qs.join('&') : ''}`, {
    method,
    headers,
    body: obj ? body(obj) : undefined,
  });
}
function idOf(name) {
  return name.split('/').pop();
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

(async () => {
  let idToken, uid, gameId, qid, sid, pid, mediaId;

  try {
    const sign = await req(`${ID}/accounts:signUp?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    check('signUp author', sign.status === 200, `status ${sign.status}`);
    if (sign.status !== 200) throw new Error(JSON.stringify(sign.data));
    idToken = sign.data.idToken;
    uid = sign.data.localId;

    const u = await fs('PATCH', `users/${uid}`, { login: 'rules', email, role: 'author', createdAt: now }, idToken);
    check('create users/{uid}', u.status === 200, `status ${u.status}`);

    const g = await fs('POST', 'games', {
      title: 'Rules Test', description: '', type: 'millionaire', authorId: uid,
      status: 'draft', createdAt: now, updatedAt: now,
      settings: { ladder: [100, 200, 300], safeHavens: [5], timeLimitSeconds: 60 },
    }, idToken);
    check('create game', g.status === 200, `status ${g.status}`);
    gameId = idOf(g.data.name);

    const q = await fs('POST', `games/${gameId}/questions`, {
      order: 0, level: 1, text: '2+2?', options: ['3', '4', '5', '6'], correctIndex: 1, answer: '4', comment: '',
    }, idToken);
    check('create question', q.status === 200, `status ${q.status}`);
    qid = idOf(q.data.name);

    const media = await fs('POST', 'media', {
      authorId: uid, kind: 'audio', name: 'test.mp3', mime: 'audio/mpeg', size: 8,
      dataUrl: 'data:audio/mpeg;base64,AAAA', createdAt: now,
    }, idToken);
    check('create media', media.status === 200, `status ${media.status}`);
    mediaId = idOf(media.data.name);

    const mediaPublic = await fs('GET', `media/${mediaId}`, null, null, true);
    check('public get media', mediaPublic.status === 200, `status ${mediaPublic.status}`);

    const mediaList = await fs('GET', 'media', null, null, true);
    check('public list media DENIED', mediaList.status === 403, `status ${mediaList.status}`);

    const mediaAnon = await fs('POST', 'media', {
      authorId: uid, kind: 'image', dataUrl: 'data:image/png;base64,AAAA',
    }, null, true);
    check('anonymous create media DENIED', mediaAnon.status === 403, `status ${mediaAnon.status}`);

    const s = await fs('POST', 'sessions', {
      gameId, gameType: 'millionaire', gameTitle: 'Rules Test', hostId: uid, code, status: 'lobby',
      createdAt: now, updatedAt: now, publicQuestion: null, revealedCorrectIndex: null,
      revealedAnswer: null, turn: null, board: null, activeCellId: null,
      buzzedParticipantId: null, finalStage: null,
    }, idToken);
    check('create session', s.status === 200, `status ${s.status}`);
    sid = idOf(s.data.name);

    const jc = await fs('PATCH', `joinCodes/${code}`, { sessionId: sid, hostId: uid }, idToken);
    check('create joinCode', jc.status === 200, `status ${jc.status}`);

    const p = await fs('POST', `sessions/${sid}/participants`, { name: 'Player 1', score: 0, color: '#c9a227' }, idToken);
    check('create participant', p.status === 200, `status ${p.status}`);
    pid = idOf(p.data.name);

    const jcRead = await fs('GET', `joinCodes/${code}`, null, null, true);
    check('public get joinCode', jcRead.status === 200, `status ${jcRead.status}`);

    const sRead = await fs('GET', `sessions/${sid}`, null, null, true);
    check('public get session', sRead.status === 200, `status ${sRead.status}`);

    const pRead = await fs('GET', `sessions/${sid}/participants`, null, null, true);
    check('public get participants', pRead.status === 200, `status ${pRead.status}`);

    const gamePublic = await fs('GET', `games/${gameId}`, null, null, true);
    check('public get game DENIED', gamePublic.status === 403, `status ${gamePublic.status}`);

    const gameHost = await fs('GET', `games/${gameId}`, null, idToken);
    check('author get game', gameHost.status === 200, `status ${gameHost.status}`);

    const questionsPublic = await fs('GET', `games/${gameId}/questions`, null, null, true);
    check('public get questions DENIED', questionsPublic.status === 403, `status ${questionsPublic.status}`);

    const sessionHack = await fs('PATCH', `sessions/${sid}`, { status: 'active' }, null, true, 'status');
    check('public update session DENIED', sessionHack.status === 403, `status ${sessionHack.status}`);

    const sessionHost = await fs('PATCH', `sessions/${sid}`, { status: 'active' }, idToken, false, 'status');
    check('host update session', sessionHost.status === 200, `status ${sessionHost.status}`);

    const scoreHack = await fs('PATCH', `sessions/${sid}/participants/${pid}`, { score: 9999 }, null, true, 'score');
    check('public update score DENIED', scoreHack.status === 403, `status ${scoreHack.status}`);

    const scoreHost = await fs('PATCH', `sessions/${sid}/participants/${pid}`, { score: 0 }, idToken, false, 'score');
    check('host update score', scoreHost.status === 200, `status ${scoreHost.status}`);

    const claim = await fs('PATCH', `sessions/${sid}/claims/${pid}`, { claimedAt: now }, null, true);
    check('public claim participant', claim.status === 200, `status ${claim.status}`);

    const tok = await fs('PATCH', `sessions/${sid}/tokens/${pid}`, { token }, null, true);
    check('public set player token', tok.status === 200, `status ${tok.status}`);

    const ans = await fs('POST', `sessions/${sid}/answers`, {
      participantId: pid, questionId: qid, token, type: 'choice', choice: 1, createdAt: now,
    }, null, true);
    check('answer with valid token', ans.status === 200, `status ${ans.status}`);

    const bad = await fs('POST', `sessions/${sid}/answers`, {
      participantId: pid, questionId: qid, token: 'wrongwrongwrongwrong', type: 'choice', choice: 1, createdAt: now,
    }, null, true);
    check('answer with bad token DENIED', bad.status === 403, `status ${bad.status}`);

    const hostAns = await fs('GET', `sessions/${sid}/answers`, null, idToken);
    check('host reads answers', hostAns.status === 200, `status ${hostAns.status}`);

    const pubAns = await fs('GET', `sessions/${sid}/answers`, null, null, true);
    check('public reads answers DENIED', pubAns.status === 403, `status ${pubAns.status}`);
  } catch (e) {
    check('rules run', false, String(e).slice(0, 300));
  } finally {
    try {
      if (sid && idToken) {
        for (const sub of ['answers', 'tokens', 'claims', 'participants']) {
          const list = await fs('GET', `sessions/${sid}/${sub}`, null, idToken);
          if (list.status === 200 && list.data?.documents) {
            for (const d of list.data.documents) {
              await fs('DELETE', d.name.replace(`projects/${PROJECT}/databases/(default)/documents/`, ''), null, idToken);
            }
          }
        }
      }
      if (code && idToken) await fs('DELETE', `joinCodes/${code}`, null, idToken);
      if (mediaId && idToken) await fs('DELETE', `media/${mediaId}`, null, idToken);
      if (sid && idToken) await fs('DELETE', `sessions/${sid}`, null, idToken);
      if (gameId && idToken) {
        const qs = await fs('GET', `games/${gameId}/questions`, null, idToken);
        if (qs.status === 200 && qs.data?.documents) {
          for (const d of qs.data.documents) {
            await fs('DELETE', d.name.replace(`projects/${PROJECT}/databases/(default)/documents/`, ''), null, idToken);
          }
        }
        await fs('DELETE', `games/${gameId}`, null, idToken);
      }
      if (uid && idToken) {
        await fs('DELETE', `users/${uid}`, null, idToken);
        await req(`${ID}/accounts:delete?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
      }
    } catch (e) {
      console.log('cleanup warning:', String(e).slice(0, 200));
    }

    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
    process.exit(failed.length ? 1 : 0);
  }
})();
