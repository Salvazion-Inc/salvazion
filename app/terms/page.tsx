import type { Metadata } from 'next';
import LegalShell, { H2, P, Ul } from '@/components/legal/LegalShell';
import { APP_URL } from '@/lib/config/site';

export const metadata: Metadata = {
  title: 'Términos de Servicio',
  description:
    'Términos de uso de la aplicación Salvazion (Salvation, Health y Freedom).',
  alternates: { canonical: `${APP_URL}/terms` },
};

export default function TermsPage() {
  return (
    <LegalShell title="Términos de Servicio" updated="25 de julio de 2026">
      <P>
        Bienvenido a <strong className="text-white">Salvazion</strong> (“la
        App”, “nosotros”), disponible en{' '}
        <a href={APP_URL} className="text-[var(--accent)] hover:underline">
          {APP_URL}
        </a>
        . Al crear una cuenta, iniciar sesión o usar la App, aceptas estos
        Términos de Servicio. Si no estás de acuerdo, no uses la App.
      </P>

      <H2>1. Descripción del servicio</H2>
      <P>
        Salvazion es una aplicación digital orientada a los pilares{' '}
        <strong className="text-white">Salvation</strong>,{' '}
        <strong className="text-white">Health</strong> y{' '}
        <strong className="text-white">Freedom</strong>: lectura bíblica,
        devocionales, hábitos de salud, comunidad (Phalanx) y herramientas
        opcionales relacionadas con billeteras Web3 en Solana. La App es de
        naturaleza formativa, motivacional y comunitaria; no sustituye consejo
        médico, legal, financiero ni pastoral profesional.
      </P>

      <H2>2. Elegibilidad y cuenta</H2>
      <Ul
        items={[
          'Debes tener capacidad legal para aceptar estos términos (en general, mayoría de edad en tu jurisdicción, o consentimiento de un tutor cuando aplique).',
          'Puedes registrarte con email/contraseña, enlace mágico, Google (Gmail) o X (Twitter), según los proveedores habilitados.',
          'Eres responsable de la confidencialidad de tu cuenta y de la actividad realizada con ella.',
          'Debes proporcionar información veraz en la medida en que la App la solicite para personalizar la experiencia.',
        ]}
      />

      <H2>3. Uso aceptable</H2>
      <P>Te comprometes a no:</P>
      <Ul
        items={[
          'Usar la App de forma ilegal, fraudulenta o que viole derechos de terceros.',
          'Intentar vulnerar seguridad, acceso no autorizado, scraping abusivo o interferir con el servicio.',
          'Publicar o transmitir contenido ofensivo, difamatorio, o que promueva violencia o ilegalidad en espacios de comunidad.',
          'Suplantar identidad o abusar de invitaciones Phalanx.',
        ]}
      />

      <H2>4. Contenido espiritual y devocional</H2>
      <P>
        Textos bíblicos, devocionales (incluidos los generados con asistencia de
        IA / Grok cuando esté configurado) y mensajes de coaching se ofrecen
        como recursos de crecimiento personal y espiritual. No constituyen
        consejo médico, psicológico ni legal. Eres libre de discernir y aplicar
        lo que consideres útil bajo tu propia responsabilidad.
      </P>

      <H2>5. Salud, sensores y wearables</H2>
      <P>
        Las funciones de Health (sueño, hidratación, ejercicio, sensores del
        teléfono, wearables, HealthKit / Health Connect, etc.) son estimaciones
        y herramientas de seguimiento. <strong className="text-white">No son
        dispositivos médicos</strong> ni diagnósticos. Consulta a un
        profesional de la salud antes de cambiar hábitos, ejercicio o
        alimentación. El uso de sensores y permisos del dispositivo es
        voluntario.
      </P>

      <H2>6. Web3, Solana y $SALVAZION</H2>
      <P>
        Si conectas una billetera o usas swaps (p. ej. Jupiter), actúas bajo tu
        propia responsabilidad. Salvazion no custodia fondos, no es un exchange
        ni un asesor financiero. Las transacciones en blockchain son
        irreversibles y conllevan riesgo de pérdida. Cumple la normativa de tu
        jurisdicción respecto a criptoactivos.
      </P>

      <H2>7. Propiedad intelectual</H2>
      <P>
        La marca Salvazion, el diseño de la App, logotipos y software propio nos
        pertenecen o se usan bajo licencia. Las traducciones bíblicas se usan
        conforme a sus respectivos derechos (p. ej. textos de dominio público
        o licencias aplicables). No puedes copiar, revender o explotar la App
        sin autorización, salvo lo permitido por la ley.
      </P>

      <H2>8. Disponibilidad y cambios</H2>
      <P>
        Podemos modificar, suspender o discontinuar funciones de la App, o
        estos términos, con efecto al publicarlos en esta página. El uso
        continuado tras cambios relevantes implica aceptación. No garantizamos
        disponibilidad ininterrumpida ni ausencia de errores.
      </P>

      <H2>9. Limitación de responsabilidad</H2>
      <P>
        En la medida permitida por la ley, Salvazion y sus colaboradores no
        serán responsables por daños indirectos, lucros cesantes, pérdida de
        datos o daños derivados del uso o la imposibilidad de uso de la App,
        incluido el uso de IA, salud o Web3. La App se ofrece “tal cual”
        (“as is”).
      </P>

      <H2>10. Terminación</H2>
      <P>
        Puedes dejar de usar la App en cualquier momento. Podemos suspender o
        cerrar cuentas que incumplan estos términos o pongan en riesgo el
        servicio u otros usuarios.
      </P>

      <H2>11. Ley aplicable</H2>
      <P>
        Estos términos se interpretan de buena fe. Si alguna cláusula no fuera
        exigible, el resto permanecerá en vigor. Para disputas, se buscará
        primero una solución amistosa contactando a{' '}
        <a
          href="mailto:info@salvazion.org"
          className="text-[var(--accent)] hover:underline"
        >
          info@salvazion.org
        </a>
        .
      </P>

      <H2>12. Contacto</H2>
      <P>
        Preguntas sobre estos términos:{' '}
        <a
          href="mailto:info@salvazion.org"
          className="text-[var(--accent)] hover:underline"
        >
          info@salvazion.org
        </a>
        . Privacidad:{' '}
        <a href="/privacy" className="text-[var(--accent)] hover:underline">
          Política de Privacidad
        </a>
        .
      </P>

      <H2>English summary</H2>
      <P>
        By using Salvazion at {APP_URL} you agree to these Terms. The App
        provides spiritual, health-habit and optional Web3 tools for personal
        growth; it is not medical, legal or financial advice. You are
        responsible for your account, sensor/wearable data you share, and any
        blockchain transactions. Contact info@salvazion.org. Full Spanish text
        above is the operative version for Spanish-speaking users.
      </P>
    </LegalShell>
  );
}
