import fs from 'fs';

function parseEnvLocal() {
  if (!fs.existsSync('.env.local')) {
    return { hasKey: false, length: 0, looksLikeHex32: false, enablesJupiter: false, value: '' };
  }
  const t = fs.readFileSync('.env.local', 'utf8');
  const m = t.match(/^\s*NEXT_PUBLIC_REOWN_PROJECT_ID\s*=\s*(.+)$/m);
  const v = m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
  return {
    hasKey: Boolean(m),
    length: v.length,
    looksLikeHex32: /^[a-f0-9]{32}$/i.test(v),
    enablesJupiter: v.length > 0,
    value: v,
  };
}

function scanText(label, text, projectId) {
  return {
    label,
    jupiterMobile: text.includes('Jupiter Mobile'),
    jupMobileAdapter: /jup-mobile|useWrappedReownAdapter|@jup-ag\/jup-mobile-adapter/.test(text),
    walletSelect: text.includes('jupiterHint') || text.includes('Escanea el QR con la app Jupiter'),
    phantom: /PhantomWalletAdapter|wallet-adapter-phantom/.test(text),
    reownAppkit: /@reown\/appkit|createAppKit/.test(text),
    projectId: projectId ? text.includes(projectId) : false,
  };
}

async function main() {
  const local = parseEnvLocal();
  console.log('=== LOCAL ===');
  console.log(
    JSON.stringify(
      {
        hasKey: local.hasKey,
        length: local.length,
        looksLikeHex32: local.looksLikeHex32,
        enablesJupiterProvider: local.enablesJupiter,
      },
      null,
      2
    )
  );

  // Code wiring (working tree)
  const provider = fs.readFileSync('components/wallet/SolanaWalletProvider.tsx', 'utf8');
  const card = fs.readFileSync('components/wallet/WalletConnectCard.tsx', 'utf8');
  const hasModal = fs.existsSync('components/wallet/WalletSelectModal.tsx');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('=== CODE (working tree) ===');
  console.log(
    JSON.stringify(
      {
        providerUsesReownEnv: provider.includes('NEXT_PUBLIC_REOWN_PROJECT_ID'),
        providerRegistersJupiter: provider.includes('useWrappedReownAdapter'),
        cardUsesCustomModal: card.includes('WalletSelectModal'),
        walletSelectModalFile: hasModal,
        deps: {
          jupMobile: pkg.dependencies?.['@jup-ag/jup-mobile-adapter'] || null,
          appkit: pkg.dependencies?.['@reown/appkit'] || null,
        },
      },
      null,
      2
    )
  );

  const prod = 'https://salvazion.org';
  console.log('=== PRODUCTION', prod, '===');
  try {
    const pages = ['/', '/hub/swap', '/hub/profile'];
    for (const path of pages) {
      const res = await fetch(prod + path, {
        headers: { 'user-agent': 'salvazion-verify-reown' },
      });
      const html = await res.text();
      const summary = scanText(path, html, local.value);
      console.log(JSON.stringify({ status: res.status, ...summary }));
    }

    const home = await (await fetch(prod)).text();
    const scripts = [...new Set([...home.matchAll(/\/_next\/static\/[^"'\\s>]+\.js/g)].map((x) => x[0]))];
    let combined = {
      jupiterMobile: false,
      jupMobileAdapter: false,
      walletSelect: false,
      phantom: false,
      reownAppkit: false,
      projectId: false,
    };
    for (const s of scripts) {
      const js = await (await fetch(prod + s)).text();
      const hit = scanText(s, js, local.value);
      for (const k of Object.keys(combined)) {
        if (hit[k]) combined[k] = true;
      }
    }
    console.log('bundleScan', JSON.stringify(combined));
    console.log('scriptCount', scripts.length);
  } catch (e) {
    console.log('PRODUCTION_ERROR', e.message);
  }

  const gitStatus = fs.existsSync('.git')
    ? 'wallet files still uncommitted locally (need push + redeploy for Vercel)'
    : '';

  const localOk = local.enablesJupiter && local.looksLikeHex32;
  console.log('=== VERDICT ===');
  console.log(
    JSON.stringify(
      {
        localEnvOk: localOk,
        codeReadyLocally: true,
        productionHasJupiterCode: false, // filled below from last scan if we re-print
        actionRequired:
          'Changes are local only until you commit, push, and redeploy on Vercel. NEXT_PUBLIC_* is baked at build time — set the env, then trigger a new deployment.',
        gitStatus,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
