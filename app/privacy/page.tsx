import type { Metadata } from 'next';
import LegalShell, { H2, P, Ul } from '@/components/legal/LegalShell';
import { APP_URL } from '@/lib/config/site';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description:
    'Cómo Salvazion recoge, usa y protege tus datos personales y de salud.',
  alternates: { canonical: `${APP_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Política de Privacidad" updated="25 de julio de 2026">
      <P>
        En <strong className="text-white">Salvazion</strong> (“nosotros”)
        respetamos tu privacidad. Esta política describe qué datos tratamos en
        la App ({' '}
        <a href={APP_URL} className="text-[var(--accent)] hover:underline">
          {APP_URL}
        </a>
        ), con qué fin y qué derechos tienes. Al usar la App, aceptas esta
        política.
      </P>

      <H2>1. Responsable</H2>
      <P>
        Responsable del tratamiento: Salvazion / equipo del producto asociado
        al dominio app.salvazion.org. Contacto:{' '}
        <a
          href="mailto:info@salvazion.org"
          className="text-[var(--accent)] hover:underline"
        >
          info@salvazion.org
        </a>
        .
      </P>

      <H2>2. Datos que podemos recoger</H2>
      <Ul
        items={[
          'Cuenta: email, nombre, idioma, foto de perfil, preferencias de onboarding (propósito, ciudad, país, fecha de nacimiento, madurez espiritual, familia, focos).',
          'Inicio de sesión social: si usas Google o X, recibimos identificadores y datos de perfil que el proveedor comparta (p. ej. email, nombre, foto, @ de X), según su configuración y tu consentimiento.',
          'Uso de la App: acciones de puntuación (Salvation / Health / Freedom), rachas, insignias, progreso de lectura bíblica, devocionales completados.',
          'Health: sueño, hidratación, comidas, deportes, métricas de sensores del teléfono o wearables que tú actives o registres manualmente.',
          'Phalanx: invitaciones y conexiones con otros usuarios que aceptes.',
          'Web3 (opcional): dirección de billetera Solana si la conectas; no custodiamos claves privadas.',
          'Técnicos: cookies de sesión (Supabase Auth), datos de dispositivo/navegador necesarios para seguridad y funcionamiento de la PWA.',
        ]}
      />

      <H2>3. Finalidades</H2>
      <Ul
        items={[
          'Crear y mantener tu cuenta y sesión.',
          'Personalizar devocionales, coach y recomendaciones por etapa de vida.',
          'Calcular scores, rachas e insignias de los tres pilares.',
          'Ofrecer funciones de Health y sincronización con sensores/wearables solo si las usas.',
          'Gestionar invitaciones y vínculos Phalanx.',
          'Mejorar seguridad, prevenir abuso y operar el servicio (infraestructura Supabase, Vercel, etc.).',
          'Cumplir obligaciones legales cuando corresponda.',
        ]}
      />

      <H2>4. Base legal</H2>
      <P>
        Tratamos datos para ejecutar el contrato de uso de la App (estos
        términos y el servicio que solicitas), con tu consentimiento (p. ej.
        sensores, login social, permisos del sistema) y, cuando aplique, por
        interés legítimo en seguridad y mejora del producto, o por obligación
        legal.
      </P>

      <H2>5. Proveedores y encargados</H2>
      <P>Podemos usar proveedores que tratan datos en nuestro nombre, entre otros:</P>
      <Ul
        items={[
          'Supabase — autenticación, base de datos y almacenamiento (con Row Level Security: en general solo tú accedes a tus filas).',
          'Vercel — alojamiento de la App.',
          'Google / X — solo si eliges “Continuar con Gmail” o “Continuar con X”; su uso se rige también por sus políticas.',
          'xAI (Grok) — si generas devocionales con IA; se envían datos de perfil necesarios para personalizar el texto.',
          'Jupiter / red Solana — si usas swap o billetera; las transacciones son públicas en blockchain.',
        ]}
      />
      <P>
        No vendemos tu información personal a terceros para publicidad de
        terceros.
      </P>

      <H2>6. Datos de salud y sensibles</H2>
      <P>
        Los datos de Health (sueño, actividad, etc.) son sensibles. Solo se
        recogen cuando usas esas funciones. No los usamos para diagnosticar
        enfermedades. Puedes dejar de usar sensores o borrar datos locales
        según las opciones de la App y del dispositivo. En shell nativo,
        HealthKit / Health Connect requieren tu permiso explícito del sistema.
      </P>

      <H2>7. Conservación</H2>
      <P>
        Conservamos los datos mientras mantengas la cuenta o sea necesario para
        el servicio y obligaciones legales. Puedes solicitar eliminación de
        cuenta contactando a info@salvazion.org. Parte del caché puede vivir en
        tu dispositivo (localStorage) hasta que lo borres o desinstales la App.
      </P>

      <H2>8. Seguridad</H2>
      <P>
        Aplicamos medidas razonables (HTTPS, RLS en base de datos, cookies de
        sesión seguras). Ningún sistema es 100 % invulnerable; notifícanos
        incidentes relevantes a info@salvazion.org.
      </P>

      <H2>9. Tus derechos</H2>
      <P>
        Según tu jurisdicción (p. ej. derechos de acceso, rectificación,
        supresión, oposición, portabilidad o limitación), puedes ejercerlos
        escribiendo a{' '}
        <a
          href="mailto:info@salvazion.org"
          className="text-[var(--accent)] hover:underline"
        >
          info@salvazion.org
        </a>
        . También puedes revocar permisos de sensores/redes sociales en el
        dispositivo o en el proveedor (Google, X).
      </P>

      <H2>10. Menores</H2>
      <P>
        La App no está dirigida a menores sin supervisión. Si un tutor cree que
        un menor nos ha facilitado datos, contáctanos para revisarlo.
      </P>

      <H2>11. Transferencias internacionales</H2>
      <P>
        Proveedores como Supabase o Vercel pueden procesar datos en servidores
        fuera de tu país. Usamos proveedores reconocidos y medidas contractuales
        habituales de la industria cuando aplica.
      </P>

      <H2>12. Cookies</H2>
      <P>
        Usamos cookies o almacenamiento similar esenciales para autenticación y
        preferencias (idioma, tamaño de texto). No dependemos de redes
        publicitarias de terceros para el núcleo de la App.
      </P>

      <H2>13. Cambios</H2>
      <P>
        Podemos actualizar esta política publicando la nueva versión en esta
        URL con fecha de actualización. El uso continuado implica aceptación de
        los cambios materiales en la medida permitida por la ley.
      </P>

      <H2>14. Contacto</H2>
      <P>
        Privacidad y datos personales:{' '}
        <a
          href="mailto:info@salvazion.org"
          className="text-[var(--accent)] hover:underline"
        >
          info@salvazion.org
        </a>
        . Términos:{' '}
        <a href="/terms" className="text-[var(--accent)] hover:underline">
          Términos de Servicio
        </a>
        .
      </P>

      <H2>English summary</H2>
      <P>
        Salvazion ({APP_URL}) processes account, usage, optional health/sensor
        and social-login data to run the App. We use Supabase, Vercel and, if
        you choose them, Google, X and AI providers. We do not sell your
        personal data. Health features are not medical devices. Contact
        info@salvazion.org for privacy requests. The Spanish text above is the
        primary version for Spanish-speaking users.
      </P>
    </LegalShell>
  );
}
