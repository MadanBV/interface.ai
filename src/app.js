import http from 'node:http';

const members = { '12345': { name: 'Jamie Rivera', savings: '$4,812.37', status: 'Active' } };
const page = (body, script = '') => `<!doctype html><html><head><title>Meridian Core 7</title><style>body{font:14px Arial;background:#d6d9dc;margin:0}table.shell{width:760px;margin:28px auto;background:#fff;border:4px ridge #aaa}td{padding:8px}.head{background:#17365d;color:#fff;font-size:20px}.nav{background:#ddd}.err{color:#a00;font-weight:bold}.ok{color:#063}fieldset{margin:12px}label{display:inline-block;width:120px}button,input{font:inherit}</style></head><body><table class="shell"><tr><td class="head">MERIDIAN CORE BANKING :: MEMBER SERVICING</td></tr><tr><td class="nav">Session: TRAINING | Branch: 014</td></tr><tr><td>${body}</td></tr></table><script>${script}</script></body></html>`;
const home = page(`<form action="/member" method="get"><fieldset><legend>Member Inquiry</legend><label for="memberNo">Member number</label><input id="memberNo" name="id" autocomplete="off"><button type="submit">Find Member</button></fieldset></form>`);

export function startApp(port = 4173) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    res.setHeader('content-type', 'text/html; charset=utf-8');
    if (url.pathname === '/') return res.end(home);
    if (url.pathname === '/member') {
      const id = url.searchParams.get('id') || '';
      const member = members[id];
      if (!member) return res.end(page(`<div role="alert" class="err">MEMBER_NOT_FOUND: No member matches that number.</div><p><a href="/">Return to inquiry</a></p>`));
      return res.end(page(`<h2>Member Profile</h2><table border="1"><tr><th>Member</th><td>${member.name}</td></tr><tr><th>Status</th><td>${member.status}</td></tr><tr><th>Savings balance</th><td data-field="savings-balance">${member.savings}</td></tr></table><p class="ok">Member record loaded</p><button id="transfer">Transfer funds</button><dialog id="confirm"><p>Transfers are irreversible in this training flow.</p><button id="cancel">Cancel</button></dialog>`, `transfer.onclick=()=>confirm.showModal();cancel.onclick=()=>confirm.close()`));
    }
    res.statusCode = 404; res.end(page('<div role="alert" class="err">PAGE_NOT_FOUND</div>'));
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}
